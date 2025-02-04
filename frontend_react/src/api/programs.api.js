import axios from "axios";


const programsApi = axios.create({
    baseURL:'http://localhost:8000/gestion/api/v1/programas/'
})

export const createProgram = (program) => programsApi.post('/crear_programa/', program);

export const getAllPrograms = () => programsApi.get('/');

export const deleteProgram = async (id) => {
  try {
      const response = await programsApi.delete(`/${id}/`);
      return response.data
  } catch (error) {
      console.log("Error eliminando programas:", error)
      throw error
  }
};
export const updateProgram = (id, program) => programsApi.put(`/${id}/`, program);
export const getProgram = async (programId) => {
    try {
      const response = await programsApi.get(`${programId}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching program:', error);
      throw error;
    }
  };


  
import Cookies from 'js-cookie';
  
export const updatePriorities = async (programId, orderIds) => {
  try {
    const response = await programsApi.put(
      `${programId}/update-prio/`,
      { 
        order_ids: orderIds,
        recalculate_dates: true
      },
      {
        headers: {
          'Content-Type':'application/json',
        }
      }
    );
    return response.data; // Devuelve datos si fue exitoso
  } catch (error) {
    console.error("Error actualizando prioridades", error);
    throw error; // Manejo del error en la API
  }
};
  
export const deleteOrder = async (programId, orderId) => {
  try{
    console.log(orderId);
    const response = await programsApi.delete(`${programId}/delete-orders/`, {
      data: { order_ids:[orderId] },
      headers: {
        'Content-Type': 'application/json',
      },
      validateStatus: function (status) {
        return status >= 200 && status < 300;
      }
    });
    return response.data.result;
  }catch(error){
    if (error.response){
      throw error.response.data;
    }
    throw error;
  }
};

/*import axios from 'axios';

// Suponiendo que el CSRF token está en una meta etiqueta
const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

// Datos que deseas enviar en la solicitud
const data = {
  priority: 1,
  // ... otros parámetros necesarios
};

// URL de la API
const url = 'http://localhost:8000/gestion/api/v1/programas/10/update-prio/';

// Realizando la solicitud PUT
axios.put(url, data, {
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN_HERE', // Si necesitas autenticación
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken // Incluir el CSRF token aquí
    }
  })
  .then(response => {
    console.log('Prioridades actualizadas:', response.data);
  })
  .catch(error => {
    if (error.response) {
      console.error('Error:', error.response.data);
      console.error('Código de estado:', error.response.status);
    } else {
      console.error('Error desconocido:', error.message);
    }
  });
/*export const getGanttChart = async (programId) => {
    try {
        r
    }
} */