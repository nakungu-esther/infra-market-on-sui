// API client utilities
import { ApiResponse, PaginatedResponse } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('bearer_token') : null;
      
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options?.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}: ${response.statusText}`,
          code: data.code,
        };
      }

      return {
        success: true,
        data: data.data || data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      };
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async patch<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

// Service-specific API endpoints
export const servicesApi = {
  getAll: (params?: Record<string, any>) => {
    const query = new URLSearchParams(params as any).toString();
    return apiClient.get<PaginatedResponse<any>>(`/services${query ? `?${query}` : ''}`);
  },
  getById: (id: string | number) => apiClient.get(`/services/${id}`),
  create: (data: any) => apiClient.post('/services', data),
  update: (id: string | number, data: any) => apiClient.put(`/services/${id}`, data),
  delete: (id: string | number) => apiClient.delete(`/services/${id}`),
  updateStatus: (id: string | number, status: string) => apiClient.patch(`/services/${id}/status`, { status }),
  getMyServices: (params?: Record<string, any>) => {
    const query = new URLSearchParams(params as any).toString();
    return apiClient.get(`/services/my-services${query ? `?${query}` : ''}`);
  },
  exportJson: () => apiClient.get('/services/export'),
  exportYaml: () => fetch('/api/services/export/yaml'),
};

export const adminApi = {
  getAllServices: (params?: Record<string, any>) => {
    const query = new URLSearchParams(params as any).toString();
    return apiClient.get(`/admin/services${query ? `?${query}` : ''}`);
  },
  moderateService: (id: string | number, status: string) => 
    apiClient.patch(`/admin/services/${id}/moderate`, { status }),
  addTag: (serviceId: string | number, tag: string) => 
    apiClient.post(`/admin/services/${serviceId}/tags`, { tag }),
  getTags: (serviceId: string | number) => 
    apiClient.get(`/admin/services/${serviceId}/tags`),
  deleteTag: (serviceId: string | number, tagId: string | number) => 
    apiClient.delete(`/admin/services/${serviceId}/tags/${tagId}`),
  getCategories: () => apiClient.get('/admin/categories'),
  createCategory: (data: { name: string; description?: string }) => 
    apiClient.post('/admin/categories', data),
  updateCategory: (id: string | number, data: { name?: string; description?: string }) => 
    apiClient.put(`/admin/categories/${id}`, data),
  deleteCategory: (id: string | number) => apiClient.delete(`/admin/categories/${id}`),
};