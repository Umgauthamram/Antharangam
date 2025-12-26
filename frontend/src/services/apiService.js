import axios from 'axios';
import { toast } from 'react-hot-toast'; 

const API_BASE_URL = 'http://localhost:5001/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000, 
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.response.use(
    (response) => response, 
    (error) => {
        const message = error.response?.data?.error || error.message || "Network Error";
        const status = error.response?.status;
        
        if (status >= 500 || !error.response) {
            toast.error(`Error ${status || 'Client'}: ${message}`);
        }
        
        return Promise.reject(error);
    }
);

export default apiClient;