import { apiFetch } from './api-client';

const userService = {
  // Update own profile
  async updateOwnProfile(data) {
    try {
      const response = await apiFetch('/api/users/profile/me', {
        method: 'PUT',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update profile');
      }

      return response.json();
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },
};

export default userService;

