import { apiFetch } from './api-client';

class TenantService {
  /**
   * Get tenant dashboard data (includes filtered monthly reports)
   */
  async getTenantDashboardData(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (params.year) queryParams.append('year', params.year);
      if (params.month) queryParams.append('month', params.month);

      const queryString = queryParams.toString();
      const endpoint = `/api/tenant/dashboard${queryString ? `?${queryString}` : ''}`;
      
      const response = await apiFetch(endpoint);
      
      if (!response.ok) {
        throw new Error('Failed to fetch tenant dashboard data');
      }

      return await response.json();
    } catch (error) {
      console.error('Get tenant dashboard error:', error);
      throw error;
    }
  }

  /**
   * Check if tenant has access to monthly reports
   * Returns true if the tenant's property allows monthly reports visibility
   */
  async hasMonthlyReportsAccess() {
    try {
      const dashboardData = await this.getTenantDashboardData();
      
      // Check if monthly reports are available (backend filters based on property setting)
      const monthlyReports = dashboardData?.data?.monthlyReports || [];
      return monthlyReports.length > 0 || dashboardData?.data?.tenant?.property_ids?.length > 0;
    } catch (error) {
      console.error('Check monthly reports access error:', error);
      return false;
    }
  }
}

export default new TenantService();

