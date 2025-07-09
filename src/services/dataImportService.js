const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { pool } = require('../config/database');

class DataImportService {
  constructor() {
    this.dataDirectory = path.join(__dirname, '../../public/data');
  }

  /**
   * 导入所有SIPRI数据到数据库
   */
  async importAllData() {
    const logId = await this.startUpdateLog('full_sync');
    let totalProcessed = 0;
    let totalInserted = 0;
    let totalUpdated = 0;
    let totalFailed = 0;

    try {
      // 获取所有CSV文件
      const csvFiles = this.getCsvFiles();
      
      console.log(`开始导入 ${csvFiles.length} 个数据文件...`);

      for (const file of csvFiles) {
        try {
          const result = await this.importSingleFile(file);
          totalProcessed += result.processed;
          totalInserted += result.inserted;
          totalUpdated += result.updated;
          totalFailed += result.failed;

          console.log(`✅ ${file} 导入完成: ${result.processed} 条记录`);
        } catch (error) {
          console.error(`❌ ${file} 导入失败:`, error.message);
          totalFailed += 1;
        }
      }

      await this.endUpdateLog(logId, 'completed', {
        processed: totalProcessed,
        inserted: totalInserted,
        updated: totalUpdated,
        failed: totalFailed
      });

      return {
        success: true,
        summary: {
          totalProcessed,
          totalInserted,
          totalUpdated,
          totalFailed
        }
      };

    } catch (error) {
      await this.endUpdateLog(logId, 'failed', { failed: totalFailed }, error.message);
      throw error;
    }
  }

  /**
   * 导入单个CSV文件
   */
  async importSingleFile(filename) {
    const filePath = path.join(this.dataDirectory, filename);
    const dataTypeName = this.getDataTypeFromFilename(filename);
    
    // 获取数据类型ID
    const dataTypeId = await this.getDataTypeId(dataTypeName);
    if (!dataTypeId) {
      throw new Error(`未找到数据类型: ${dataTypeName}`);
    }

    return new Promise((resolve, reject) => {
      const results = [];
      let processed = 0;
      let inserted = 0;
      let updated = 0;
      let failed = 0;

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => {
          results.push(data);
        })
        .on('end', async () => {
          try {
            for (const row of results) {
              try {
                const result = await this.processDataRow(row, dataTypeId);
                processed++;
                if (result.action === 'insert') inserted++;
                else if (result.action === 'update') updated++;
              } catch (error) {
                failed++;
                console.error(`处理数据行失败:`, error.message, row);
              }
            }

            resolve({ processed, inserted, updated, failed });
          } catch (error) {
            reject(error);
          }
        })
        .on('error', reject);
    });
  }

  /**
   * 处理单行数据
   */
  async processDataRow(row, dataTypeId) {
    const countryName = row.Country;
    if (!countryName) return null;

    // 获取或创建国家记录
    const countryId = await this.getOrCreateCountry(countryName);

    // 处理年份数据
    const years = Object.keys(row).filter(key => 
      key !== 'Country' && !isNaN(parseInt(key))
    );

    for (const year of years) {
      const value = this.parseValue(row[year]);
      if (value !== null) {
        await this.upsertExpenditureData({
          countryId,
          dataTypeId,
          year: parseInt(year),
          value
        });
      }
    }

    return { action: 'processed' };
  }

  /**
   * 插入或更新军事支出数据
   */
  async upsertExpenditureData({ countryId, dataTypeId, year, value }) {
    const client = await pool.connect();
    try {
      const query = `
        INSERT INTO military_expenditure (country_id, data_type_id, year, value)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (country_id, data_type_id, year)
        DO UPDATE SET 
          value = EXCLUDED.value,
          updated_at = CURRENT_TIMESTAMP
        RETURNING (xmax = 0) AS inserted
      `;

      const result = await client.query(query, [countryId, dataTypeId, year, value]);
      return {
        action: result.rows[0].inserted ? 'insert' : 'update'
      };
    } finally {
      client.release();
    }
  }

  /**
   * 获取或创建国家记录
   */
  async getOrCreateCountry(countryName) {
    const client = await pool.connect();
    try {
      // 先尝试查找
      let result = await client.query(
        'SELECT id FROM countries WHERE country_name = $1',
        [countryName]
      );

      if (result.rows.length > 0) {
        return result.rows[0].id;
      }

      // 如果不存在，则创建
      result = await client.query(
        'INSERT INTO countries (country_name) VALUES ($1) RETURNING id',
        [countryName]
      );

      return result.rows[0].id;
    } finally {
      client.release();
    }
  }

  /**
   * 获取数据类型ID
   */
  async getDataTypeId(typeName) {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT id FROM data_types WHERE type_name = $1',
        [typeName]
      );
      return result.rows.length > 0 ? result.rows[0].id : null;
    } finally {
      client.release();
    }
  }

  /**
   * 从文件名推断数据类型
   */
  getDataTypeFromFilename(filename) {
    const nameMap = {
      'Local currency financial years.csv': 'Local currency financial years',
      'Local currency calendar years.csv': 'Local currency calendar years',
      'Constant (2023) US$.csv': 'Constant (2023) US$',
      'Current US$.csv': 'Current US$',
      'Share of GDP.csv': 'Share of GDP',
      'Per capita.csv': 'Per capita',
      'Share of Govt. spending.csv': 'Share of Govt. spending'
    };

    return nameMap[filename] || filename.replace('.csv', '');
  }

  /**
   * 获取所有CSV文件
   */
  getCsvFiles() {
    const files = fs.readdirSync(this.dataDirectory);
    return files.filter(file => 
      file.endsWith('.csv') && 
      !file.includes('long_format') // 排除长格式文件
    );
  }

  /**
   * 解析数值
   */
  parseValue(valueStr) {
    if (!valueStr || valueStr.trim() === '' || valueStr === '..') {
      return null;
    }
    
    const num = parseFloat(valueStr);
    return isNaN(num) ? null : num;
  }

  /**
   * 开始更新日志
   */
  async startUpdateLog(updateType, fileSource = null) {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        INSERT INTO data_update_logs (update_type, file_source)
        VALUES ($1, $2)
        RETURNING id
      `, [updateType, fileSource]);
      
      return result.rows[0].id;
    } finally {
      client.release();
    }
  }

  /**
   * 结束更新日志
   */
  async endUpdateLog(logId, status, stats = {}, errorMessage = null) {
    const client = await pool.connect();
    try {
      await client.query(`
        UPDATE data_update_logs 
        SET 
          end_time = CURRENT_TIMESTAMP,
          status = $2,
          records_processed = $3,
          records_inserted = $4,
          records_updated = $5,
          records_failed = $6,
          error_message = $7
        WHERE id = $1
      `, [
        logId, 
        status, 
        stats.processed || 0,
        stats.inserted || 0,
        stats.updated || 0,
        stats.failed || 0,
        errorMessage
      ]);
    } finally {
      client.release();
    }
  }
}

module.exports = DataImportService; 