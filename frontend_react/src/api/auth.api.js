import axios from 'axios';

const API_URL = 'http://localhost:8000/users/api/';

export const loginUser = async (credentials) => {
    try {
        const response = await axios.post(`${API_URL}/login/`, credentials);
        if(response.data.toke){
            localStorage.setItem('token', response.data.token);
            localStorage.setItem(UserActivation, JSON.stringify(response.data.user));
        }
        return response.data;
    }catch(error){
        throw error.response.data;
    }
};

export const createOperator = async (userData) => {
    try {
        const response = await axios.post (
            `${API_}/operadores/crear`,
            userData,
            {
                headers: {
                    'Authorization' : `Bearer ${localStorage.getItem('token')}`
                }
            }
        );
        return reponse.data;
    }catch(error){
        throw error.response.data;
    }
};

export const getOperators = async () => {
    try{
        const response = await axios.get(
            `${API_URL}/operadores/`,
            {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            }
        );
        return response.data;
    }catch(error){
        throw error.response.data;
    }
};