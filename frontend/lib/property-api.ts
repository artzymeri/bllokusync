import { authAPI } from './auth-api';
import { apiFetch, API_BASE_URL } from './api-client';

// Global handler for API responses
async function handleApiResponse(response: Response) {
  // If unauthorized, clear auth and redirect to login
  if (response.status === 401) {
    authAPI.removeToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new Error('Session expired. Please login again.');
  }

  return response;
}

export interface Property {
  id: number;
  name: string;
  address: string;
  city_id: number;
  cityDetails?: {
    id: number;
    name: string;
  };
  latitude: number | null;
  longitude: number | null;
  floors_from: number | null;
  floors_to: number | null;
  show_monthly_reports_to_tenants?: boolean;
  property_manager_user_id: number | null;
  manager?: {
    id: number;
    name: string;
    surname: string;
    email: string;
  };
  managers?: Array<{
    id: number;
    name: string;
    surname: string;
    email: string;
  }>;
  created_at: string;
  updated_at: string;
}

export interface PropertyFilters {
  search?: string;
  city?: string;
  managerId?: number;
  myProperties?: boolean;
  page?: number;
  limit?: number;
}

class PropertyAPI {
  async getAllProperties(filters?: PropertyFilters) {
    const queryParams = new URLSearchParams();
    if (filters?.search) queryParams.append('search', filters.search);
    if (filters?.city) queryParams.append('city', filters.city);
    if (filters?.managerId) queryParams.append('managerId', filters.managerId.toString());
    if (filters?.myProperties) queryParams.append('myProperties', 'true');
    if (filters?.page) queryParams.append('page', filters.page.toString());
    if (filters?.limit) queryParams.append('limit', filters.limit.toString());

    const response = await apiFetch(
      `/api/properties?${queryParams.toString()}`,
      {
        method: 'GET',
      }
    );
    await handleApiResponse(response);
    return response.json();
  }

  // Get all properties (simple list without pagination)
  async getProperties(filters?: PropertyFilters): Promise<Property[]> {
    const result = await this.getAllProperties({ ...filters, limit: 1000 });
    return result.data || [];
  }

  async getPropertyById(id: number) {
    const response = await apiFetch(`/api/properties/${id}`, {
      method: 'GET',
    });
    await handleApiResponse(response);
    return response.json();
  }

  async createProperty(data: {
    name: string;
    address: string;
    city_id: number;
    latitude?: number | null;
    longitude?: number | null;
    floors_from?: number | null;
    floors_to?: number | null;
    show_monthly_reports_to_tenants?: boolean;
    manager_ids?: number[];
  }) {
    const response = await apiFetch('/api/properties', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    await handleApiResponse(response);
    return response.json();
  }

  async updateProperty(id: number, data: {
    name?: string;
    address?: string;
    city_id?: number;
    latitude?: number | null;
    longitude?: number | null;
    floors_from?: number | null;
    floors_to?: number | null;
    show_monthly_reports_to_tenants?: boolean;
    manager_ids?: number[];
  }) {
    const response = await apiFetch(`/api/properties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    await handleApiResponse(response);
    return response.json();
  }

  async deleteProperty(id: number) {
    const response = await apiFetch(`/api/properties/${id}`, {
      method: 'DELETE',
    });
    await handleApiResponse(response);
    return response.json();
  }

  async getManagers() {
    const response = await apiFetch('/api/properties/managers/list', {
      method: 'GET',
    });
    await handleApiResponse(response);
    return response.json();
  }
}

export const propertyAPI = new PropertyAPI();
