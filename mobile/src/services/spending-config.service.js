import { apiFetch } from './api-client';

const spendingConfigService = {
  // Get all spending configs created by the current user
  async getMySpendingConfigs() {
    try {
      const response = await apiFetch('/api/spending-configs');
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch spending configs');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error fetching spending configs:', error);
      throw error;
    }
  },

  // Create a new spending config
  async createSpendingConfig(data) {
    try {
      const response = await apiFetch('/api/spending-configs', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create spending config');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error creating spending config:', error);
      throw error;
    }
  },

  // Update a spending config
  async updateSpendingConfig(id, data) {
    try {
      const response = await apiFetch(`/api/spending-configs/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update spending config');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error updating spending config:', error);
      throw error;
    }
  },

  // Delete a spending config
  async deleteSpendingConfig(id) {
    try {
      const response = await apiFetch(`/api/spending-configs/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete spending config');
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting spending config:', error);
      throw error;
    }
  },

  // Get spending configs for a specific property
  async getPropertySpendingConfigs(propertyId) {
    try {
      const response = await apiFetch(`/api/spending-configs/property/${propertyId}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch property spending configs');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error fetching property spending configs:', error);
      throw error;
    }
  },

  // Assign spending configs to a property
  async assignSpendingConfigsToProperty(propertyId, data) {
    try {
      const response = await apiFetch(
        `/api/spending-configs/property/${propertyId}/assign`,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to assign spending configs');
      }
      
      return true;
    } catch (error) {
      console.error('Error assigning spending configs:', error);
      throw error;
    }
  },
};

export default spendingConfigService;

