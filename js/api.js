const API = {
    baseUrl: window.location.origin + '/api',

    request: async (endpoint, options = {}) => {
        const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const token = user.token;

        const headers = {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options.headers,
        };

        const config = {
            ...options,
            headers,
        };

        try {
            const response = await fetch(`${API.baseUrl}${endpoint}`, config);
            const data = await response.json();
            
            if (!response.ok) {
                if(response.status === 401) {
                    localStorage.removeItem('currentUser');
                    window.location.reload();
                }
                throw new Error(data.message || 'API Error');
            }
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    auth: {
        login: (credentials) => API.request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
        register: (userData) => API.request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
    },

    tasks: {
        getAll: () => API.request('/tasks'),
        create: (taskData) => API.request('/tasks', { method: 'POST', body: JSON.stringify(taskData) }),
        update: (id, taskData) => API.request(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(taskData) }),
        delete: (id) => API.request(`/tasks/${id}`, { method: 'DELETE' }),
    },

    team: {
        getAll: () => API.request('/users'),
        updateRole: (id, role) => API.request(`/team/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),
        remove: (id) => API.request(`/team/${id}`, { method: 'DELETE' }),
    },

    chat: {
        getMessages: (type, receiverId = '') => API.request(`/chat/${type}${receiverId ? '/' + receiverId : ''}`),
        sendMessage: (msgData) => API.request('/chat', { method: 'POST', body: JSON.stringify(msgData) }),
        deleteMessage: (id) => API.request(`/chat/${id}`, { method: 'DELETE' }),
    },

    calendar: {
        getAll: () => API.request('/calendar'),
        create: (eventData) => API.request('/calendar', { method: 'POST', body: JSON.stringify(eventData) }),
        update: (id, eventData) => API.request(`/calendar/${id}`, { method: 'PUT', body: JSON.stringify(eventData) }),
        delete: (id) => API.request(`/calendar/${id}`, { method: 'DELETE' }),
    },

    notifications: {
        getAll: () => API.request('/notifications'),
        markAsRead: (id) => API.request(`/notifications/${id}/read`, { method: 'PUT' }),
        markAllAsRead: () => API.request('/notifications/read-all', { method: 'PUT' }),
    },

    audit: {
        getLogs: () => API.request('/audit'),
    }
};

window.API = API;
