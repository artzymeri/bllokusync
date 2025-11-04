import { apiFetch } from './api-client';

export interface MonthlyReport {
  id: number;
  property_id: number;
  report_month: string;
  generated_by_user_id: number;
  total_budget: string;
  total_tenants: number;
  paid_tenants: number;
  pending_amount: string;
  spending_breakdown: SpendingBreakdown[];
  notes?: string;
  created_at: string;
  updated_at: string;
  property?: {
    id: number;
    name: string;
    address: string;
  };
}

export interface SpendingBreakdown {
  config_id: number;
  config_title: string;
  allocated_amount: number;
  percentage: number;
  description?: string | null;
}

export interface MonthlyReportPreview {
  property: {
    id: number;
    name: string;
    address: string;
  };
  report_month: string;
  total_tenants: number;
  paid_tenants: number;
  total_budget: string;
  pending_amount: string;
  spending_configs: Array<{
    id: number;
    title: string;
    description?: string;
  }>;
  payments: Array<{
    id: number;
    tenant_id: number;
    amount: string;
    status: string;
    payment_date?: string;
    tenant: {
      id: number;
      name: string;
      surname: string;
      email: string;
      floor_assigned?: number;
    };
  }>;
}

export interface GenerateMonthlyReportData {
  propertyId: number;
  month: number;
  year: number;
  notes?: string;
  spendingAllocations?: SpendingBreakdown[];
  sendEmailToTenants?: boolean;
}

// Get report preview (without saving)
export const getMonthlyReportPreview = async (params: {
  propertyId: number;
  month: number;
  year: number;
}): Promise<{ success: boolean; preview: MonthlyReportPreview }> => {
  const queryParams = new URLSearchParams({
    propertyId: params.propertyId.toString(),
    month: params.month.toString(),
    year: params.year.toString(),
  });

  const response = await apiFetch(`/api/monthly-reports/preview?${queryParams}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch report preview');
  }

  return response.json();
};

// Generate or update a monthly report
export const generateMonthlyReport = async (data: GenerateMonthlyReportData): Promise<{
  success: boolean;
  message: string;
  report: MonthlyReport;
}> => {
  const response = await apiFetch('/api/monthly-reports/generate', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to generate report');
  }

  return response.json();
};

// Get all reports across all managed properties
export const getAllMyReports = async (params?: {
  year?: number;
}): Promise<{ success: boolean; reports: MonthlyReport[] }> => {
  const queryParams = params?.year ? `?year=${params.year}` : '';

  const response = await apiFetch(`/api/monthly-reports/all${queryParams}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch reports');
  }

  return response.json();
};

// Get monthly reports for a specific property
export const getPropertyReports = async (
  propertyId: number,
  params?: { year?: number }
): Promise<{ success: boolean; reports: MonthlyReport[] }> => {
  const queryParams = params?.year ? `?year=${params.year}` : '';

  const response = await apiFetch(`/api/monthly-reports/property/${propertyId}${queryParams}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch property reports');
  }

  return response.json();
};

// Get detailed monthly report by ID
export const getMonthlyReportDetail = async (
  reportId: number
): Promise<{
  success: boolean;
  report: MonthlyReport;
  payments: Array<any>;
}> => {
  const response = await apiFetch(`/api/monthly-reports/${reportId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch report details');
  }

  return response.json();
};

// Delete a monthly report
export const deleteMonthlyReport = async (reportId: number): Promise<{
  success: boolean;
  message: string;
}> => {
  const response = await apiFetch(`/api/monthly-reports/${reportId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete report');
  }

  return response.json();
};

// Update a monthly report
export const updateMonthlyReport = async (
  reportId: number,
  data: {
    notes?: string;
    spendingAllocations?: SpendingBreakdown[];
  }
): Promise<{
  success: boolean;
  message: string;
  report: MonthlyReport;
}> => {
  const response = await apiFetch(`/api/monthly-reports/${reportId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update report');
  }

  return response.json();
};

// Get tenant's property monthly reports
export const getTenantPropertyReports = async (params?: {
  year?: number;
}): Promise<{ success: boolean; reports: MonthlyReport[] }> => {
  const queryParams = params?.year ? `?year=${params.year}` : '';

  const response = await apiFetch(`/api/monthly-reports/tenant/my-reports${queryParams}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch reports');
  }

  return response.json();
};
