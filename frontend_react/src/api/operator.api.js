import axios from './axiosConfig';

const API_URL = 'http://localhost:8000/operator/api/v1';

export const getAllOperators = async () => {
    try {
        const response = await axios.get(`${API_URL}/operadores/`);
        return response.data;
    } catch(error){
        console.error('Error al obtener operadores:', error);
        throw error;
    }
};

export const getRoles = async () => {
    try{
        const response = await axios.get(`${API_URL}/roles/`);
        return response.data;
    } catch (error){
        console.error('Error al obtener roles:', error);
        throw error;
    }
}


//Crear un nuevo operador 
export const createOperator = async (operatorData) => {
    try{
        console.log('Datos enviados al backend:', operatorData);
        const response = await axios.post(`${API_URL}/operadores/`, operatorData);
        return response.data;
    } catch (error) {
        console.error('Error al crear operador:', error);
        throw error;
    }
};

//Actualizar un operador existente
export const updateOperator = async (operatorId, operatorData) => {
    try{
        const response = await axios.put(`${API_URL}/operadores/${operatorId}/`, operatorData);
        return response.data;
    } catch (error){
        console.error("Error al actualizar operador:", error);
        throw error;
    }
};

//Eliminar operador (soft delete)
export const deleteOperator = async (operatorId) => {
    try{
        await axios.delete(`${API_URL}/operadores/${operatorId}/`);
    } catch (error){
        console.error('Error al eliminar operador:', error);
        throw error;
    }
}

export const getAsignacionesPrograma = async (programId) => {
    try{
        const response = await axios.get(`${API_URL}/operadores/${programId}/asignaciones/`);
        return response.data;
    } catch (error) {
        console.error('Error al obtener asignaciones del programa:', error);
        throw error;
    }
}






// Asignar operador a un programa
export const assignOperatorToProgram = async(programId, assignmentData) => {
    try{
        const response = await axios.post(`${API_URL}/operadores/${programId}/asignaciones`, assignmentData);
        return response.data;
    } catch (error){
        console.error('Error al asignar operador al programa:', error);
        throw error;
    }
};

//Eliminar asignación de operador
export const removeOperatorAssignment = async(programId, assignmentId) => {
    try{
        await axios.delete(`${API_URL}/operadores/${programId}/asignaciones/${assignmentId}`);
    } catch (error) {
        console.error('Eror al eliminar asignación:', error);
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