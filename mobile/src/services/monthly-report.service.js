import { apiFetch } from './api-client';

/**
 * Get monthly report preview (without saving)
 */
export async function getMonthlyReportPreview(propertyId, month, year) {
  const queryParams = new URLSearchParams({
    propertyId: propertyId.toString(),
    month: month.toString(),
    year: year.toString(),
  });

  const response = await apiFetch(`/api/monthly-reports/preview?${queryParams}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch report preview');
  }

  return response.json();
}

/**
 * Generate or update a monthly report
 */
export async function generateMonthlyReport(data) {
  const response = await apiFetch('/api/monthly-reports/generate', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to generate report');
  }

  return response.json();
}

/**
 * Get all reports across all managed properties
 */
export async function getAllMyReports(year = null) {
  const queryParams = year ? `?year=${year}` : '';

  const response = await apiFetch(`/api/monthly-reports/all${queryParams}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch reports');
  }

  return response.json();
}

/**
 * Get monthly reports for a specific property
 */
export async function getPropertyReports(propertyId, year = null) {
  const queryParams = year ? `?year=${year}` : '';

  const response = await apiFetch(`/api/monthly-reports/property/${propertyId}${queryParams}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch property reports');
  }

  return response.json();
}

/**
 * Get detailed monthly report by ID
 */
export async function getMonthlyReportDetail(reportId) {
  const response = await apiFetch(`/api/monthly-reports/${reportId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch report details');
  }

  return response.json();
}

/**
 * Delete a monthly report
 */
export async function deleteMonthlyReport(reportId) {
  const response = await apiFetch(`/api/monthly-reports/${reportId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete report');
  }

  return response.json();
}

/**
 * Update a monthly report
 */
export async function updateMonthlyReport(reportId, data) {
  const response = await apiFetch(`/api/monthly-reports/${reportId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update report');
  }

  return response.json();
}

