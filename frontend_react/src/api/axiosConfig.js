import axios from 'axios';

axios.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token){
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

axios.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if(error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('login')){

            originalRequest._retry = true;
            
            try{
                const refresh = localStorage.getItem('refresh');
                if(refresh){
                    const response = await axios.post('http://localhost:8000/users/api/v1/token/refresh/', {
                        refresh: refresh
                    });

                    const newToken = response.data.access;
                    localStorage.setItem('token', newToken);

                    //Reintentamos la petición original con el nuevo token
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    return axios(error.config);
                }
            } catch (refreshError) {
                console.error('Error refreshing token:', refreshError);
                localStorage.clear();
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);


export default axios;