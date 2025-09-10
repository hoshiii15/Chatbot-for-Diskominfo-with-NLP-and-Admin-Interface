import axios, { AxiosResponse } from 'axios';
import { config } from '../utils/config';
import { logger } from '../utils/logger';
import { 
  ChatbotRequest, 
  ChatbotResponse, 
  HealthCheckResponse 
} from '../../../shared/types';

export class PythonBotService {
  private baseURL: string;
  private timeout: number;

  constructor() {
    this.baseURL = config.pythonBot.url;
    this.timeout = config.pythonBot.timeout;
  }

  /**
   * Send a question to the Python chatbot
   */
  async askQuestion(request: ChatbotRequest): Promise<ChatbotResponse> {
    try {
      const response: AxiosResponse<ChatbotResponse> = await axios.post(
        `${this.baseURL}/ask`,
        request,
        {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      logger.info('Question sent to Python bot', {
        question: request.question,
        env: request.env,
        response_status: response.data.status,
        confidence: response.data.confidence,
      });

      return response.data;
    } catch (error) {
      logger.error('Error communicating with Python bot:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        request,
      });

      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED') {
          throw new Error('Python bot is not running or not accessible');
        }
        if (error.code === 'ETIMEDOUT') {
          throw new Error('Python bot request timed out');
        }
        if (error.response) {
          throw new Error(`Python bot returned error: ${error.response.status} ${error.response.statusText}`);
        }
      }

      throw new Error('Failed to communicate with Python bot');
    }
  }

  /**
   * Check if the Python chatbot is healthy
   */
  async checkHealth(): Promise<HealthCheckResponse> {
    try {
      const response: AxiosResponse<HealthCheckResponse> = await axios.get(
        `${this.baseURL}/`,
        {
          timeout: config.pythonBot.healthTimeout,
        }
      );

      logger.debug('Python bot health check successful', {
        status: response.data.status,
        nlp_ready: response.data.nlp_ready,
        version: response.data.version,
      });

      return response.data;
    } catch (error) {
      logger.error('Python bot health check failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw new Error('Python bot health check failed');
    }
  }

  /**
   * Get available categories for an environment
   */
  async getCategories(env: 'stunting' | 'ppid' = 'stunting'): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseURL}/categories`,
        {
          params: { env },
          timeout: this.timeout,
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Error getting categories from Python bot:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        env,
      });

      throw new Error('Failed to get categories from Python bot');
    }
  }

  /**
   * Get all FAQs for an environment
   */
  async getFAQs(env: 'stunting' | 'ppid' = 'stunting'): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseURL}/faqs`,
        {
          params: { env },
          timeout: this.timeout,
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Error getting FAQs from Python bot:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        env,
      });

      throw new Error('Failed to get FAQs from Python bot');
    }
  }

  /**
   * Get statistics from the Python bot
   */
  async getStats(env: 'stunting' | 'ppid' = 'stunting'): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseURL}/stats`,
        {
          params: { env },
          timeout: this.timeout,
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Error getting stats from Python bot:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        env,
      });

      throw new Error('Failed to get stats from Python bot');
    }
  }

  /**
   * Test the connection to the Python bot
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.checkHealth();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get response time for the Python bot
   */
  async getResponseTime(): Promise<number> {
    const start = Date.now();
    try {
      await this.checkHealth();
      return Date.now() - start;
    } catch (error) {
      return -1;
    }
  }
}
