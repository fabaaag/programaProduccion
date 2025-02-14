import axios from 'axios';

const API_URL = 'http://localhost:8000/users/api/v1/';

export const loginUser = async (credentials) => {
    try {
        const response = await axios.post(`${API_URL}login/`, credentials);
        return response.data;
    }catch(error){
        throw error.response.data;
    }
};

export const checkAuthStatus = () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    return { isAuthenticated: !!token, user};
};

export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
};

export const updateProfile = async (userData) => {
    try{
        const response = await axios.put(`${API_URL}profile/`, userData);
        return response.data;
    }catch(error){
        throw error;
    }
};

export const getProfile = async () => {
    try{
        const response = await axios.get(`${API_URL}profile/`);
        return response.data
    }catch(error){
        throw error;
    }
}