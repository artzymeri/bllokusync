import { apiFetch } from './api-client';

const propertyService = {
  // Get all properties
  async getProperties() {
    try {
      // Request properties for the current property manager with a high limit to get all
      const response = await apiFetch('/api/properties?myProperties=true&limit=1000');
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch properties');
      }
      
      const result = await response.json();
      // The API returns { success, data, pagination }, so we need to extract the data array
      if (result.success && result.data) {
        return Array.isArray(result.data) ? result.data : [];
      }
      // Fallback for direct array response
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error fetching properties:', error);
      throw error;
    }
  },

  // Get a single property by ID
  async getPropertyById(id) {
    try {
      const response = await apiFetch(`/api/properties/${id}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch property');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error fetching property:', error);
      throw error;
    }
  },
};

export default propertyService;
