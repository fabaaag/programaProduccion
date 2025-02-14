import axios from './axiosConfig';

const API_URL = 'http://localhost:8000/api/operator/api/v1';

export const getAllOperators = async () => {
    try {
        const response = await axios.get(`${API_URL}/operadores/`);
        return response.data;
    } catch(error){
        console.error('Error al obtener operadores:', error);
        throw error;
    }
};

export const getOperatorById = async (id) => {
    try{
        const response = await axios.get(`${API_URL}/disponibilidad/`, {
            params: {
                operador_id: operatorId,
                fecha_inicio: startDate,
                fecha_fin: endDate

            }
        });
        return response.data;
    } catch (error){
        console.error('Error al obtener disponibilidad:', error);
        throw error;
    }
};
