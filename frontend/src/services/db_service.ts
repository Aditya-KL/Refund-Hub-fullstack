// frontend/src/services/db_service.ts

const API_BASE_URL = 'http://localhost:8000/api'; 

export const apiService = {
    // ─── ADMIN PROFILE FUNCTIONS ──────────────────────────────────────────
    getAdminProfile: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/users/admin/profile`);
            if (!response.ok) throw new Error('Failed to fetch admin profile');
            return await response.json();
        } catch (error) {
            console.error('Fetch admin error:', error);
            throw error;
        }
    },

    updateUserData: async (userId: string, data: any) => {
        try {
            const response = await fetch(`${API_BASE_URL}/user/update`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...data, _id: userId }),
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to update data');
            }
            return await response.json();
        } catch (error) {
            console.error('Database update error:', error);
            throw error;
        }
    },

    changePassword: async (userId: string, currentPassword: string, newPassword: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/users/${userId}/change-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword }),
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to change password');
            }
            return await response.json();
        } catch (error) {
            console.error('Password change error:', error);
            throw error;
        }
    },

    // ─── PORTAL SETTINGS FUNCTIONS ────────────────────────────────────────
    getSettings: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/settings`);
            if (!response.ok) throw new Error('Failed to fetch settings');
            return await response.json();
        } catch (error) {
            console.error('Fetch settings error:', error);
            throw error;
        }
    },

    updateSettings: async (settingsData: any) => {
        try {
            const response = await fetch(`${API_BASE_URL}/settings`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settingsData),
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to update settings');
            }
            return await response.json();
        } catch (error) {
            console.error('Update settings error:', error);
            throw error;
        }
    },

    // ─── ADMIN: SECRETARY MANAGEMENT ──────────────────────────────────────
    createSecretary: async (secretaryData: any) => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/secretaries`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(secretaryData),
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to create secretary');
            }
            return await response.json();
        } catch (error) {
            console.error('Create secretary error:', error);
            throw error;
        }
    },
    // Add these inside the apiService object in db_service.ts

getSecretaries: async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/secretaries`);
        if (!response.ok) throw new Error('Failed to fetch secretaries');
        return await response.json();
    } catch (error) {
        console.error('Fetch secretaries error:', error);
        throw error;
    }
},

deleteSecretary: async (id: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/secretaries/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to delete secretary');
        }
        return await response.json();
    } catch (error) {
        console.error('Delete secretary error:', error);
        throw error;
    }
},
};