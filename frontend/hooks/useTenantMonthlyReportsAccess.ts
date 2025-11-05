import { useTenantDashboard } from "./useTenant";

/**
 * Hook to check if tenant has access to monthly reports
 * Returns true if at least one of the tenant's properties allows monthly reports visibility
 */
export function useTenantMonthlyReportsAccess() {
  const { data, isLoading } = useTenantDashboard();

  // Check if tenant has access to any monthly reports
  const hasAccess = data?.data?.monthlyReports && data.data.monthlyReports.length > 0;

  return {
    hasAccess: hasAccess || false,
    isLoading,
  };
}
