const express = require('express');
const { pool } = require('../../config/database');
const DataImportService = require('../../services/dataImportService');

const router = express.Router();
const dataImportService = new DataImportService();

/**
 * 获取所有国家列表
 * GET /api/data/countries
 */
router.get('/countries', async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          id, 
          country_name, 
          country_code, 
          region, 
          sub_region,
          (SELECT COUNT(*) FROM military_expenditure WHERE country_id = countries.id) as data_points
        FROM countries 
        ORDER BY country_name
      `);

      res.json({
        success: true,
        data: result.rows,
        total: result.rows.length
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('获取国家列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取国家列表失败',
      error: error.message
    });
  }
});

/**
 * 获取数据类型列表
 * GET /api/data/types
 */
router.get('/types', async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          id,
          type_name,
          description,
          unit,
          currency,
          base_year,
          (SELECT COUNT(*) FROM military_expenditure WHERE data_type_id = data_types.id) as data_points
        FROM data_types 
        ORDER BY id
      `);

      res.json({
        success: true,
        data: result.rows,
        total: result.rows.length
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('获取数据类型失败:', error);
    res.status(500).json({
      success: false,
      message: '获取数据类型失败',
      error: error.message
    });
  }
});

/**
 * 获取特定国家的时间序列数据
 * GET /api/data/country/:countryId/timeseries?dataType=1&startYear=1990&endYear=2024
 */
router.get('/country/:countryId/timeseries', async (req, res) => {
  try {
    const { countryId } = req.params;
    const { dataType, startYear = 1949, endYear = 2024 } = req.query;

    const client = await pool.connect();
    try {
      let query = `
        SELECT 
          c.country_name,
          dt.type_name as data_type,
          dt.unit,
          dt.currency,
          me.year,
          me.value,
          me.is_estimated
        FROM military_expenditure me
        JOIN countries c ON me.country_id = c.id
        JOIN data_types dt ON me.data_type_id = dt.id
        WHERE me.country_id = $1
          AND me.year >= $2
          AND me.year <= $3
      `;

      const params = [countryId, startYear, endYear];

      if (dataType) {
        query += ' AND me.data_type_id = $4';
        params.push(dataType);
      }

      query += ' ORDER BY me.year, dt.type_name';

      const result = await client.query(query, params);

      res.json({
        success: true,
        data: result.rows,
        total: result.rows.length,
        metadata: {
          countryId,
          dataType,
          yearRange: { start: startYear, end: endYear }
        }
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('获取时间序列数据失败:', error);
    res.status(500).json({
      success: false,
      message: '获取时间序列数据失败',
      error: error.message
    });
  }
});

/**
 * 获取特定年份的横截面数据（国家对比）
 * GET /api/data/year/:year/comparison?dataType=1&limit=20
 */
router.get('/year/:year/comparison', async (req, res) => {
  try {
    const { year } = req.params;
    const { dataType = 1, limit = 50, order = 'desc' } = req.query;

    const client = await pool.connect();
    try {
      const orderBy = order === 'asc' ? 'ASC' : 'DESC';
      
      const query = `
        SELECT 
          c.country_name,
          c.region,
          dt.type_name as data_type,
          dt.unit,
          dt.currency,
          me.value,
          me.is_estimated,
          -- 计算排名
          RANK() OVER (ORDER BY me.value ${orderBy}) as rank
        FROM military_expenditure me
        JOIN countries c ON me.country_id = c.id
        JOIN data_types dt ON me.data_type_id = dt.id
        WHERE me.year = $1 
          AND me.data_type_id = $2
          AND me.value IS NOT NULL
        ORDER BY me.value ${orderBy}
        LIMIT $3
      `;

      const result = await client.query(query, [year, dataType, limit]);

      res.json({
        success: true,
        data: result.rows,
        total: result.rows.length,
        metadata: {
          year,
          dataType,
          limit,
          order
        }
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('获取横截面数据失败:', error);
    res.status(500).json({
      success: false,
      message: '获取横截面数据失败',
      error: error.message
    });
  }
});

/**
 * 多国多年份数据查询
 * POST /api/data/query
 * Body: { countries: [1,2,3], dataTypes: [1,2], years: [2020,2021,2022] }
 */
router.post('/query', async (req, res) => {
  try {
    const { countries = [], dataTypes = [], years = [], limit = 1000 } = req.body;

    if (countries.length === 0 && dataTypes.length === 0 && years.length === 0) {
      return res.status(400).json({
        success: false,
        message: '至少需要指定国家、数据类型或年份中的一个筛选条件'
      });
    }

    const client = await pool.connect();
    try {
      let query = `
        SELECT 
          c.id as country_id,
          c.country_name,
          c.region,
          dt.id as data_type_id,
          dt.type_name as data_type,
          dt.unit,
          dt.currency,
          me.year,
          me.value,
          me.is_estimated
        FROM military_expenditure me
        JOIN countries c ON me.country_id = c.id
        JOIN data_types dt ON me.data_type_id = dt.id
        WHERE 1=1
      `;

      const params = [];
      let paramIndex = 1;

      if (countries.length > 0) {
        query += ` AND me.country_id = ANY($${paramIndex})`;
        params.push(countries);
        paramIndex++;
      }

      if (dataTypes.length > 0) {
        query += ` AND me.data_type_id = ANY($${paramIndex})`;
        params.push(dataTypes);
        paramIndex++;
      }

      if (years.length > 0) {
        query += ` AND me.year = ANY($${paramIndex})`;
        params.push(years);
        paramIndex++;
      }

      query += ` ORDER BY c.country_name, dt.type_name, me.year LIMIT $${paramIndex}`;
      params.push(limit);

      const result = await client.query(query, params);

      res.json({
        success: true,
        data: result.rows,
        total: result.rows.length,
        metadata: {
          filters: { countries, dataTypes, years },
          limit
        }
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('查询数据失败:', error);
    res.status(500).json({
      success: false,
      message: '查询数据失败',
      error: error.message
    });
  }
});

/**
 * 获取数据统计概要
 * GET /api/data/summary
 */
router.get('/summary', async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          (SELECT COUNT(*) FROM countries) as total_countries,
          (SELECT COUNT(*) FROM data_types) as total_data_types,
          (SELECT COUNT(*) FROM military_expenditure) as total_records,
          (SELECT MIN(year) FROM military_expenditure) as earliest_year,
          (SELECT MAX(year) FROM military_expenditure) as latest_year,
          (SELECT COUNT(DISTINCT year) FROM military_expenditure) as year_coverage,
          (SELECT COUNT(*) FROM military_expenditure WHERE is_estimated = true) as estimated_records,
          (SELECT COUNT(*) FROM data_update_logs WHERE status = 'completed') as successful_updates
      `);

      const regionStats = await client.query(`
        SELECT 
          c.region,
          COUNT(c.id) as country_count,
          COUNT(me.id) as data_points
        FROM countries c
        LEFT JOIN military_expenditure me ON c.id = me.country_id
        WHERE c.region IS NOT NULL
        GROUP BY c.region
        ORDER BY country_count DESC
      `);

      const yearlyStats = await client.query(`
        SELECT 
          me.year,
          COUNT(DISTINCT me.country_id) as countries_with_data,
          COUNT(me.id) as total_records
        FROM military_expenditure me
        WHERE me.year >= (SELECT MAX(year) - 10 FROM military_expenditure)
        GROUP BY me.year
        ORDER BY me.year DESC
      `);

      res.json({
        success: true,
        data: {
          overview: result.rows[0],
          regionBreakdown: regionStats.rows,
          recentYearsCoverage: yearlyStats.rows
        }
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('获取数据概要失败:', error);
    res.status(500).json({
      success: false,
      message: '获取数据概要失败',
      error: error.message
    });
  }
});

/**
 * 导入数据 (管理员功能)
 * POST /api/data/import
 */
router.post('/import', async (req, res) => {
  try {
    console.log('开始数据导入...');
    const result = await dataImportService.importAllData();

    res.json({
      success: true,
      message: '数据导入完成',
      data: result.summary
    });
  } catch (error) {
    console.error('数据导入失败:', error);
    res.status(500).json({
      success: false,
      message: '数据导入失败',
      error: error.message
    });
  }
});

/**
 * 获取导入日志
 * GET /api/data/import/logs?limit=10
 */
router.get('/import/logs', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          id,
          update_type,
          records_processed,
          records_inserted,
          records_updated,
          records_failed,
          start_time,
          end_time,
          status,
          error_message,
          file_source,
          EXTRACT(EPOCH FROM (end_time - start_time)) as duration_seconds
        FROM data_update_logs
        ORDER BY start_time DESC
        LIMIT $1
      `, [limit]);

      res.json({
        success: true,
        data: result.rows,
        total: result.rows.length
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('获取导入日志失败:', error);
    res.status(500).json({
      success: false,
      message: '获取导入日志失败',
      error: error.message
    });
  }
});

module.exports = router; 