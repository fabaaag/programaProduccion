import axios from './axiosConfig';


export const crearAsignacion = async (asignacionData) => {
    try {
        // Convertir IDs a números si son strings
        const formattedData = {
            operador_id: parseInt(asignacionData.operador_id),
            maquina_id: parseInt(asignacionData.maquina_id),
            proceso_id: parseInt(asignacionData.proceso_id),
            codigo_proceso: asignacionData.codigo_proceso,
            fecha_asignacion: asignacionData.fecha_asignacion
        };
        console.log("datos para el back ", asignacionData.data)

        console.log('Datos formateados a enviar:', formattedData);
        
        const response = await axios.post(
            `/gestion/api/v1/programas/${asignacionData.programa_id}/asignaciones/`, 
            formattedData
        );
        return response.data;
    } catch (error) {
        console.error('Error detallado:', error.response?.data);
        throw error;
    }
};

export const obtenerAsignacionesPrograma = async (programaId) => {
    try {
        const response = await axios.get(`/operator/api/v1/asignaciones/programa/${programaId}`);
    } catch (error) {
        console.error('Error al obtener asignaciones:', error);
        throw error;
    }
}