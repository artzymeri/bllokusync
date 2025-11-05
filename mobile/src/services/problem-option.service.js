import { apiFetch } from './api-client';

const problemOptionService = {
  // Get all problem options created by the property manager
  async getMyProblemOptions() {
    try {
      const response = await apiFetch('/api/problem-options');
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch problem options');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error fetching problem options:', error);
      throw error;
    }
  },

  // Create a new problem option
  async createProblemOption(data) {
    try {
      const response = await apiFetch('/api/problem-options', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create problem option');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error creating problem option:', error);
      throw error;
    }
  },

  // Update a problem option
  async updateProblemOption(id, data) {
    try {
      const response = await apiFetch(`/api/problem-options/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update problem option');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error updating problem option:', error);
      throw error;
    }
  },

  // Delete a problem option
  async deleteProblemOption(id) {
    try {
      const response = await apiFetch(`/api/problem-options/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete problem option');
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting problem option:', error);
      throw error;
    }
  },

  // Get problem options for a specific property
  async getPropertyProblemOptions(propertyId) {
    try {
      const response = await apiFetch(`/api/problem-options/property/${propertyId}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch property problem options');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error fetching property problem options:', error);
      throw error;
    }
  },

  // Assign problem options to a property
  async assignProblemOptionsToProperty(propertyId, data) {
    try {
      const response = await apiFetch(
        `/api/problem-options/property/${propertyId}/assign`,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to assign problem options');
      }
      
      return true;
    } catch (error) {
      console.error('Error assigning problem options:', error);
      throw error;
    }
  },
};

export default problemOptionService;

