import axios from 'axios'

const clientsApi = axios.create({
    baseURL:'http://localhost:8000/clientes/api/v1/clientes/'
});

export const getAllClients = () => clientsApi.get('/');
export const createClient = (client) => clientsApi.post('/', client);
export const deleteClient = (id) => clientsApi.delete(`/${id}/`);
export const updateClient = (id, client) => clientsApi.put(`/${id}/`, client);
export const getClient = (id) => clientsApi.get(`/${id}/`);
