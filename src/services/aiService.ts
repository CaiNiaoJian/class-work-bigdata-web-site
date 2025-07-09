// AI服务 - 千帆知道功能 (使用Kimi API)
export interface AIStreamResponse {
  content: string;
  isComplete: boolean;
  error?: string;
}

export class AIService {
  private readonly apiEndpoint = 'https://api.moonshot.cn/v1/chat/completions';
  private readonly apiKey = 'sk-jFZ4VoMH0FL8DJWRAnhpMEbWUOA17FjaJEyWAul44Rx2ePvW';
  private readonly model = 'moonshot-v1-8k';

  /**
   * 生成国家深度分析的提示词
   * @param countryName 国家名称
   * @returns 格式化的提示词
   */
  private generateCountryAnalysisPrompt(countryName: string): string {
    return `作为一个专业的国际关系和军事分析专家，请对"${countryName}"进行全面深度分析。请按以下结构提供详细信息：

## 国家概况
- 基本国情和地理位置
- 政治制度和领导体制
- 经济实力和发展水平

## 简要历史
- 重要历史节点和转折点
- 现代化进程和改革历程
- 对当前国际地位的历史影响

## 军事力量分析
- 军队规模和组织结构
- 主要军事装备和技术水平
- 军事支出趋势和国防战略
- 在国际军事力量对比中的地位

## 地缘政治格局
- 在全球和地区政治中的作用
- 主要盟友和战略伙伴关系
- 面临的地缘政治挑战和机遇
- 对国际秩序的影响

## 国家风格特色
- 外交政策风格和特点
- 文化软实力和国际形象
- 决策机制和政策执行特点
- 在国际事务中的独特作用

请用专业、客观、深入的语言进行分析，每个部分约200-300字。重点关注该国在国际军事和安全格局中的地位。`;
  }

     /**
    * 调用Kimi大模型API进行流式输出
    * @param countryName 国家名称
    * @param onChunk 接收流式数据的回调函数
    * @returns Promise<void>
    */
   async generateCountryAnalysis(
     countryName: string,
     onChunk: (response: AIStreamResponse) => void
   ): Promise<void> {
     const prompt = this.generateCountryAnalysisPrompt(countryName);
     
     try {
       const response = await fetch(this.apiEndpoint, {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${this.apiKey}`,
         },
         body: JSON.stringify({
           model: this.model,
           messages: [
             {
               role: 'system',
               content: '你是 Kimi，由 Moonshot AI 提供的人工智能助手，你更擅长中文和英文的对话。你会为用户提供安全，有帮助，准确的回答。同时，你会拒绝一切涉及恐怖主义，种族歧视，黄色暴力等问题的回答。请按照用户要求的格式和结构提供专业的分析。'
             },
             {
               role: 'user',
               content: prompt
             }
           ],
           stream: true,
           temperature: 0.3
         })
       });

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法获取响应流');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            // 发送完成信号
            onChunk({
              content: '',
              isComplete: true
            });
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.trim() === '') continue;
            
            // 处理Server-Sent Events格式
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              
              if (data === '[DONE]') {
                onChunk({
                  content: '',
                  isComplete: true
                });
                return;
              }

                             try {
                 const parsed = JSON.parse(data);
                 
                 if (parsed.choices && parsed.choices[0]?.delta?.content) {
                   onChunk({
                     content: parsed.choices[0].delta.content,
                     isComplete: false
                   });
                 } else if (parsed.error) {
                   onChunk({
                     content: '',
                     isComplete: true,
                     error: parsed.error.message || 'API调用失败'
                   });
                   return;
                 }
               } catch (parseError) {
                 console.warn('解析AI响应数据失败:', parseError);
               }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

    } catch (error) {
      console.error('AI分析生成失败:', error);
      onChunk({
        content: '',
        isComplete: true,
        error: error instanceof Error ? error.message : '生成分析失败'
      });
    }
  }

     /**
    * 简化版本：非流式调用（作为备用方案）
    * @param countryName 国家名称
    * @returns Promise<string>
    */
   async generateCountryAnalysisSimple(countryName: string): Promise<string> {
     const prompt = this.generateCountryAnalysisPrompt(countryName);
     
     try {
       const response = await fetch(this.apiEndpoint, {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${this.apiKey}`,
         },
         body: JSON.stringify({
           model: this.model,
           messages: [
             {
               role: 'system',
               content: '你是 Kimi，由 Moonshot AI 提供的人工智能助手，你更擅长中文和英文的对话。你会为用户提供安全，有帮助，准确的回答。同时，你会拒绝一切涉及恐怖主义，种族歧视，黄色暴力等问题的回答。请按照用户要求的格式和结构提供专业的分析。'
             },
             {
               role: 'user',
               content: prompt
             }
           ],
           temperature: 0.3
         })
       });

       if (!response.ok) {
         throw new Error(`API请求失败: ${response.status}`);
       }

       const data = await response.json();
       
       if (data.error) {
         throw new Error(data.error.message || 'API调用失败');
       }

       return data.choices?.[0]?.message?.content || '生成分析内容失败';
       
     } catch (error) {
       console.error('AI分析生成失败:', error);
       return `抱歉，暂时无法为"${countryName}"生成深度分析。请稍后重试。`;
     }
   }
}

// 导出单例实例
export const aiService = new AIService(); 