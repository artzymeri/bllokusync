import { apiFetch, API_BASE_URL } from './api-client';

export interface TenantPayment {
  id: number;
  tenant_id: number;
  property_id: number;
  payment_month: string;
  amount: string;
  status: 'pending' | 'paid' | 'overdue';
  payment_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  tenant?: {
    id: number;
    name: string;
    surname: string;
    email: string;
    apartment_label?: string; // <-- Added field
  };
  property?: {
    id: number;
    name: string;
    address: string;
  };
}

export interface PaymentStatistics {
  total: number;
  paid: number;
  pending: number;
  overdue: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
}

export interface EnsurePaymentRecordsResult {
  payments: any[];
  new_records: number;
  existing_records: number;
  errors?: any[];
}

// Get payments for a specific tenant
export async function getTenantPayments(
  tenantId: number,
  filters?: {
    property_id?: number;
    status?: string;
    year?: number;
    month?: number;
  }
): Promise<TenantPayment[]> {
  const params = new URLSearchParams();
  if (filters?.property_id) params.append('property_id', filters.property_id.toString());
  if (filters?.status) params.append('status', filters.status);
  if (filters?.year) params.append('year', filters.year.toString());
  if (filters?.month) params.append('month', filters.month.toString());

  const response = await apiFetch(
    `/api/tenant-payments/tenant/${tenantId}?${params.toString()}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch tenant payments');
  }

  const data = await response.json();
  return data.data;
}

// Get payments for property manager
export async function getPropertyManagerPayments(filters?: {
  property_id?: number;
  tenant_id?: number;
  status?: string;
  year?: number;
  month?: number | number[]; // Support both single and multiple months
}): Promise<TenantPayment[]> {
  const params = new URLSearchParams();
  if (filters?.property_id) params.append('property_id', filters.property_id.toString());
  if (filters?.tenant_id) params.append('tenant_id', filters.tenant_id.toString());
  if (filters?.status) params.append('status', filters.status);
  if (filters?.year) params.append('year', filters.year.toString());

  // Handle multiple months
  if (filters?.month !== undefined) {
    if (Array.isArray(filters.month)) {
      filters.month.forEach(m => params.append('month[]', (m + 1).toString())); // Convert 0-indexed to 1-indexed
    } else {
      params.append('month', (filters.month + 1).toString()); // Convert 0-indexed to 1-indexed
    }
  }

  const response = await apiFetch(
    `/api/tenant-payments/property-manager?${params.toString()}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch payments');
  }

  const data = await response.json();
  return data.data;
}

// Get payment statistics
export async function getPaymentStatistics(filters?: {
  property_id?: number;
  year?: number;
}): Promise<PaymentStatistics> {
  const params = new URLSearchParams();
  if (filters?.property_id) params.append('property_id', filters.property_id.toString());
  if (filters?.year) params.append('year', filters.year.toString());

  const response = await apiFetch(
    `/api/tenant-payments/statistics?${params.toString()}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch payment statistics');
  }

  const data = await response.json();
  return data.data;
}

// Update payment status
export async function updatePaymentStatus(
  paymentId: number,
  status: 'pending' | 'paid' | 'overdue',
  notes?: string
): Promise<TenantPayment> {
  const response = await apiFetch(`/api/tenant-payments/${paymentId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status, notes }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update payment');
  }

  const data = await response.json();
  return data.data;
}

// Bulk update payment statuses
export async function bulkUpdatePayments(
  paymentIds: number[],
  status: 'pending' | 'paid' | 'overdue',
  notes?: string
): Promise<void> {
  const response = await apiFetch('/api/tenant-payments', {
    method: 'PATCH',
    body: JSON.stringify({ payment_ids: paymentIds, status, notes }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update payments');
  }
}

// Generate future payment records
export async function generateFuturePayments(
  tenantId: number,
  propertyId: number,
  monthsAhead: number
): Promise<TenantPayment[]> {
  const response = await apiFetch('/api/tenant-payments/generate-future', {
    method: 'POST',
    body: JSON.stringify({
      tenant_id: tenantId,
      property_id: propertyId,
      months_ahead: monthsAhead,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to generate future payments');
  }

  const data = await response.json();
  return data.data;
}

// Ensure payment records exist for specific month(s) and tenants
export async function ensurePaymentRecords(
  tenantIds: number[],
  propertyId: number,
  year: number,
  month: number | number[] // Support both single and multiple months
): Promise<EnsurePaymentRecordsResult> {
  const response = await apiFetch('/api/tenant-payments/ensure-records', {
    method: 'POST',
    body: JSON.stringify({
      tenant_ids: tenantIds,
      property_id: propertyId,
      year: year,
      month: month, // Send as-is (can be single number or array)
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to ensure payment records');
  }

  const data = await response.json();
  return data.data as EnsurePaymentRecordsResult;
}

// Update payment date
export async function updatePaymentDate(
  paymentId: number,
  paymentDate: string
): Promise<TenantPayment> {
  const response = await apiFetch(`/api/tenant-payments/${paymentId}/payment-date`, {
    method: 'PATCH',
    body: JSON.stringify({ payment_date: paymentDate }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update payment date');
  }

  const data = await response.json();
  return data.data;
}

// Delete payment record
export async function deletePayment(paymentId: number): Promise<void> {
  const response = await apiFetch(`/api/tenant-payments/${paymentId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete payment');
  }
}
