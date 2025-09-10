import { ChatbotRequest, ChatbotResponse, HealthCheckResponse } from '../../../shared/types';
export declare class PythonBotService {
    private baseURL;
    private timeout;
    constructor();
    askQuestion(request: ChatbotRequest): Promise<ChatbotResponse>;
    checkHealth(): Promise<HealthCheckResponse>;
    getCategories(env?: 'stunting' | 'ppid'): Promise<any>;
    getFAQs(env?: 'stunting' | 'ppid'): Promise<any>;
    getStats(env?: 'stunting' | 'ppid'): Promise<any>;
    testConnection(): Promise<boolean>;
    getResponseTime(): Promise<number>;
}
//# sourceMappingURL=PythonBotService.d.ts.map