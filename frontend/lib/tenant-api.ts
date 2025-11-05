import { apiFetch, API_BASE_URL } from './api-client';

export interface Complaint {
  id: number;
  tenant_user_id: number;
  property_id: number;
  title: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'resolved' | 'rejected';
  response: string | null;
  created_at: string;
  updated_at: string;
  property?: {
    id: number;
    name: string;
    address: string;
  };
}

export interface Suggestion {
  id: number;
  tenant_user_id: number;
  property_id: number;
  title: string;
  description: string | null;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  response: string | null;
  created_at: string;
  updated_at: string;
  property?: {
    id: number;
    name: string;
    address: string;
  };
}

export interface TenantDashboardData {
  complaints: Complaint[];
  suggestions: Suggestion[];
  payments: any[];
  reports: any[];
  monthlyReports: any[];
  stats: {
    complaints: {
      total: number;
      pending: number;
      inProgress: number;
      resolved: number;
      rejected: number;
    };
    suggestions: {
      total: number;
      pending: number;
      underReview: number;
      approved: number;
      rejected: number;
    };
    payments: {
      total: number;
      paid: number;
      pending: number;
      overdue: number;
      totalPaid: number;
    };
    reports: {
      total: number;
      pending: number;
      inProgress: number;
      resolved: number;
    };
  };
  tenant: {
    id: number;
    name: string;
    surname: string;
    email: string;
    property_ids: number[];
  };
}

// Get all tenant dashboard data in one API call
export async function getTenantDashboardData(params?: { year?: number; month?: number }): Promise<TenantDashboardData> {
  const queryParams = new URLSearchParams();
  if (params?.year) queryParams.append('year', params.year.toString());
  if (params?.month) queryParams.append('month', params.month.toString());

  const url = `/api/tenant-dashboard${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

  const response = await apiFetch(url);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch dashboard data');
  }

  const result = await response.json();
  return result.data;
}

// Get tenant's complaints
export async function getTenantComplaints(): Promise<Complaint[]> {
  const response = await apiFetch('/api/complaints/tenant');

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch complaints');
  }

  const data = await response.json();
  return data.complaints;
}

// Get tenant's suggestions
export async function getTenantSuggestions(): Promise<Suggestion[]> {
  const response = await apiFetch('/api/suggestions/tenant');

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch suggestions');
  }

  const data = await response.json();
  return data.suggestions;
}

