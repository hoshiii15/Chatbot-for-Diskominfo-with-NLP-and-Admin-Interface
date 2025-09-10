// Shared TypeScript types for the FAQ Chatbot Admin System

export interface FAQ {
  id: number;
  questions: string[];
  answer: string;
  category: string;
}

export interface FAQData {
  faqs: FAQ[];
}

export interface ChatbotResponse {
  answer: string;
  confidence: number;
  category: string;
  status: 'success' | 'error';
  source_faq_id?: number;
  links?: Array<{
    text: string;
    url: string;
  }>;
}

export interface ChatbotRequest {
  question: string;
  env?: 'stunting' | 'ppid';
}

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  message: string;
  nlp_ready: boolean;
  timestamp: string;
  version: string;
  supported_envs: string[];
}

export interface ChatLog {
  id: string;
  timestamp: string;
  question: string;
  answer: string;
  confidence: number;
  category: string;
  env: string;
  status: string;
  response_time?: number;
  user_ip?: string;
  user_agent?: string;
}

export interface AnalyticsData {
  total_questions: number;
  total_sessions: number;
  average_confidence: number;
  popular_questions: Array<{
    question: string;
    count: number;
    avg_confidence: number;
  }>;
  category_distribution: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  confidence_distribution: Array<{
    range: string;
    count: number;
    percentage: number;
  }>;
  daily_stats: Array<{
    date: string;
    questions: number;
    avg_confidence: number;
  }>;
  env_distribution: Array<{
    env: string;
    count: number;
    percentage: number;
  }>;
}

export interface SystemHealth {
  python_bot: {
    status: 'online' | 'offline' | 'error';
    response_time: number;
    last_check: string;
    version?: string;
  };
  database: {
    status: 'connected' | 'disconnected' | 'error';
    response_time: number;
    last_check: string;
  };
  files: {
    faq_stunting: boolean;
    faq_ppid: boolean;
    logs: boolean;
    backups: boolean;
  };
}

export interface WebsiteMonitor {
  id: string;
  url: string;
  name: string;
  status: 'active' | 'inactive' | 'error';
  last_ping: string;
  response_time: number;
  chatbot_version?: string;
  total_requests?: number;
  last_request?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  created_at: string;
  last_login?: string;
  is_active: boolean;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  meta: PaginationMeta;
}

// Environment types
export type Environment = 'stunting' | 'ppid';

// Dashboard widget types
export interface DashboardWidget {
  id: string;
  title: string;
  type: 'stat' | 'chart' | 'table' | 'metric';
  value?: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
  data?: any[];
}

// Real-time update types
export interface RealTimeUpdate {
  type: 'new_question' | 'system_status' | 'faq_updated' | 'user_activity';
  data: any;
  timestamp: string;
}

// Backup types
export interface BackupFile {
  id: string;
  filename: string;
  env: Environment;
  created_at: string;
  size: number;
  checksum: string;
}

export interface BackupResponse {
  success: boolean;
  backup_id?: string;
  filename?: string;
  message?: string;
}

// Configuration types
export interface AppConfig {
  python_bot_url: string;
  database_url: string;
  jwt_secret: string;
  log_level: 'debug' | 'info' | 'warn' | 'error';
  backup_retention_days: number;
  max_file_size: number;
  rate_limit_requests: number;
  rate_limit_window: number;
}
