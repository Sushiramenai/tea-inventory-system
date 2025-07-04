import axios, { AxiosError, AxiosInstance } from 'axios';

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    // Determine the API URL based on environment
    let baseURL = process.env.REACT_APP_API_URL || '/api';
    
    // For Replit, use relative URL in production since backend serves frontend
    const isReplit = window.location.hostname.includes('.repl.co') || 
                     window.location.hostname.includes('.replit.dev') ||
                     window.location.hostname.includes('.repl.run');
    
    if (process.env.NODE_ENV === 'production' || isReplit) {
      // In production or on Replit, backend serves frontend on same port
      baseURL = '/api';
    }
    
    this.client = axios.create({
      baseURL,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<{ error: ApiError }>) => {
        if (error.response?.data?.error) {
          throw error.response.data.error;
        }
        if (error.response?.status === 401) {
          // Unauthorized - redirect to login
          window.location.href = '/login';
          throw {
            code: 'UNAUTHORIZED',
            message: 'Session expired. Please login again.',
          };
        }
        throw {
          code: 'NETWORK_ERROR',
          message: error.message || 'Network error occurred',
        };
      }
    );
  }

  async get<T>(url: string, params?: any): Promise<T> {
    const response = await this.client.get<T>(url, { params });
    return response.data;
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.post<T>(url, data);
    return response.data;
  }

  async put<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.put<T>(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this.client.delete<T>(url);
    return response.data;
  }
}

export const api = new ApiClient();