import { apiFetch } from './api-client';

/**
 * Get payments for property manager
 */
export async function getPropertyManagerPayments(filters = {}) {
  const params = new URLSearchParams();

  if (filters.property_id) params.append('property_id', filters.property_id.toString());
  if (filters.tenant_id) params.append('tenant_id', filters.tenant_id.toString());
  if (filters.status) params.append('status', filters.status);
  if (filters.year) params.append('year', filters.year.toString());

  // Handle multiple months
  if (filters.month !== undefined) {
    if (Array.isArray(filters.month)) {
      filters.month.forEach(m => params.append('month[]', (m + 1).toString()));
    } else {
      params.append('month', (filters.month + 1).toString());
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

/**
 * Get payment statistics
 */
export async function getPaymentStatistics(filters = {}) {
  const params = new URLSearchParams();

  if (filters.property_id) params.append('property_id', filters.property_id.toString());
  if (filters.year) params.append('year', filters.year.toString());

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

/**
 * Update payment status
 */
export async function updatePaymentStatus(paymentId, status, notes = null) {
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

/**
 * Bulk update payment statuses
 */
export async function bulkUpdatePayments(paymentIds, status, notes = null) {
  const response = await apiFetch('/api/tenant-payments', {
    method: 'PATCH',
    body: JSON.stringify({ payment_ids: paymentIds, status, notes }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update payments');
  }

  return response.json();
}

/**
 * Ensure payment records exist for specific month(s) and tenants
 */
export async function ensurePaymentRecords(tenantIds, propertyId, year, month) {
  const response = await apiFetch('/api/tenant-payments/ensure-records', {
    method: 'POST',
    body: JSON.stringify({
      tenant_ids: tenantIds,
      property_id: propertyId,
      year: year,
      month: month,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to ensure payment records');
  }

  const data = await response.json();
  return data.data;
}

/**
 * Update payment date
 */
export async function updatePaymentDate(paymentId, paymentDate) {
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

/**
 * Get tenants for a property
 */
export async function getTenantsForProperty(propertyId) {
  const response = await apiFetch(
    `/api/users/tenants?property_id=${propertyId}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch tenants');
  }

  const data = await response.json();
  return data.data || [];
}

/**
 * Get properties for property manager
 */
export async function getMyProperties() {
  const response = await apiFetch('/api/properties?myProperties=true');

  if (!response.ok) {
    throw new Error('Failed to fetch properties');
  }

  const data = await response.json();
  return data.data || [];
}

