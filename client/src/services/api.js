import axios from 'axios';

const getBaseUrl = () => {
    if (import.meta.env.PROD) {
        // Use relative path — frontend and backend share the same Render service
        return import.meta.env.VITE_API_URL || '';
    }
    return 'http://localhost:3000';
};

const api = axios.create({
    baseURL: getBaseUrl(),
    timeout: 60000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// AUTH INTERCEPTOR: Inject ALEX IO JWT from localStorage
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('alex_io_token') || sessionStorage.getItem('alex_io_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Get available scenarios
export const getScenarios = async () => {
    const response = await api.get('/scenarios');
    return response.data;
};

export const sendMessage = async (messages, scenarioId, userId) => {
    const response = await api.post('/chat', { messages, scenarioId, userId });
    return response.data;
};

export const sendAudio = async (audioBlob, scenarioId, userId) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'input.webm');
    if (scenarioId) {
        formData.append('scenarioId', scenarioId);
    }
    if (userId) {
        formData.append('userId', userId);
    }

    // Let Axios/Browser set the correct multipart content-type with boundary
    const response = await api.post('/speak', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

export default api;
