import axios from './axiosConfig';

const API_URL = 'http://localhost:8000/gestion/api/v1';

export const getAllEmpresas = async () => {
    try{
        const response = await axios.get(`${API_URL}/empresas/`);
        return response.data;
    } catch (error){
        console.error("Error al obtener empresas:", error);
        throw error;
    }
}