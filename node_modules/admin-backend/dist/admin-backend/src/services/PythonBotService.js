"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PythonBotService = void 0;
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../utils/config");
const logger_1 = require("../utils/logger");
class PythonBotService {
    constructor() {
        this.baseURL = config_1.config.pythonBot.url;
        this.timeout = config_1.config.pythonBot.timeout;
    }
    async askQuestion(request) {
        try {
            const response = await axios_1.default.post(`${this.baseURL}/ask`, request, {
                timeout: this.timeout,
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            logger_1.logger.info('Question sent to Python bot', {
                question: request.question,
                env: request.env,
                response_status: response.data.status,
                confidence: response.data.confidence,
            });
            return response.data;
        }
        catch (error) {
            logger_1.logger.error('Error communicating with Python bot:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                request,
            });
            if (axios_1.default.isAxiosError(error)) {
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
    async checkHealth() {
        try {
            const response = await axios_1.default.get(`${this.baseURL}/`, {
                timeout: config_1.config.pythonBot.healthTimeout,
            });
            logger_1.logger.debug('Python bot health check successful', {
                status: response.data.status,
                nlp_ready: response.data.nlp_ready,
                version: response.data.version,
            });
            return response.data;
        }
        catch (error) {
            logger_1.logger.error('Python bot health check failed:', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw new Error('Python bot health check failed');
        }
    }
    async getCategories(env = 'stunting') {
        try {
            const response = await axios_1.default.get(`${this.baseURL}/categories`, {
                params: { env },
                timeout: this.timeout,
            });
            return response.data;
        }
        catch (error) {
            logger_1.logger.error('Error getting categories from Python bot:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                env,
            });
            throw new Error('Failed to get categories from Python bot');
        }
    }
    async getFAQs(env = 'stunting') {
        try {
            const response = await axios_1.default.get(`${this.baseURL}/faqs`, {
                params: { env },
                timeout: this.timeout,
            });
            return response.data;
        }
        catch (error) {
            logger_1.logger.error('Error getting FAQs from Python bot:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                env,
            });
            throw new Error('Failed to get FAQs from Python bot');
        }
    }
    async getStats(env = 'stunting') {
        try {
            const response = await axios_1.default.get(`${this.baseURL}/stats`, {
                params: { env },
                timeout: this.timeout,
            });
            return response.data;
        }
        catch (error) {
            logger_1.logger.error('Error getting stats from Python bot:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                env,
            });
            throw new Error('Failed to get stats from Python bot');
        }
    }
    async testConnection() {
        try {
            await this.checkHealth();
            return true;
        }
        catch (error) {
            return false;
        }
    }
    async getResponseTime() {
        const start = Date.now();
        try {
            await this.checkHealth();
            return Date.now() - start;
        }
        catch (error) {
            return -1;
        }
    }
}
exports.PythonBotService = PythonBotService;
//# sourceMappingURL=PythonBotService.js.map