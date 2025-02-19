import axios from 'axios';

const instance = axios.create({
    baseURL: 'http://localhost:8000',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

//Variable para controlar si estamos en proceso de refresh
let isRefreshing = false;
//Cola de solicitudes fallidas
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if(error){
            prom.reject(error);
        }else{
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// Interceptor para agregar el token a todas las peticiones
instance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            // Asegurarse de que el token se envía con el formato correcto
            config.headers = {
                ...config.headers,
                'Authorization': `Bearer ${token}`.trim()
            };
            // Debug para ver los headers
            console.log('Request headers:', config.headers);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

instance.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            console.log('401 error detected, attempting token refresh');
            const refreshToken = localStorage.getItem('refreshToken');
            
            if (refreshToken) {
                try {
                    const response = await axios.post('http://localhost:8000/users/api/v1/token/refresh/', {
                        refresh: refreshToken
                    });
                    
                    const newToken = response.data.access;
                    localStorage.setItem('token', newToken);
                    
                    // Actualizar el token en la petición original
                    error.config.headers['Authorization'] = `Bearer ${newToken}`;
                    
                    // Reintentar la petición original
                    return axios(error.config);
                } catch (refreshError) {
                    console.log('Token refresh failed:', refreshError);
                    localStorage.clear();
                    window.location.href = '/login';
                    return Promise.reject(refreshError);
                }
            }
        }
        return Promise.reject(error);
    }
);

export default instance;
