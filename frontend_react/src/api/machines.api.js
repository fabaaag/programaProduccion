import axios from './axiosConfig';

const API_URL = 'http://localhost:8000/gestion/api/v1';

export const getAllMachines = async () => {
    try{
        const response = await axios.get(`${API_URL}/maquinas/`);
        return response.data;
    } catch (error){
        console.error('Error al obtener máquinas:', error);
        throw error;
    }
}
