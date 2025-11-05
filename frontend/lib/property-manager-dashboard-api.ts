import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Get sidebar badge counts for Property Manager
export const getSidebarCounts = async () => {
  const token = localStorage.getItem("auth_token");

  try {
    const response = await axios.get(
      `${API_URL}/api/property-manager-dashboard/sidebar-counts`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      }
    );

    console.log("[Frontend] Sidebar counts response:", response.data.data);
    return response.data.data;
  } catch (error) {
    console.error("[PM Sidebar Counts] Error:", error);
    throw error;
  }
};

// Get full dashboard data
export const getPropertyManagerDashboardData = async () => {
  const token = localStorage.getItem("auth_token");

  const response = await axios.get(
    `${API_URL}/api/property-manager-dashboard`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data.data;
};
