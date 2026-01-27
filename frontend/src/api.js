import axios from 'axios';

// Get the backend API URL. 
// If we're on localhost, use localhost. 
// If we're on a network IP, use that same IP but port 5000.
const getBaseUrl = () => {
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
