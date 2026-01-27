import axios from 'axios';

// Get the backend API URL. 
// Priority: environment variable > localhost > network IP
const getBaseUrl = () => {
    // Check if environment variable is set (for production)
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }
    
    // For local development
    const { hostname } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:5000';
    }
    return `http://${hostname}:5000`;
};

const API_BASE_URL = getBaseUrl();

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000, // 10 seconds timeout
});

export default api;
export { API_BASE_URL };
