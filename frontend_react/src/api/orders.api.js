import axios from './axiosConfig'


export const getAllOrders = async () => await axios.get('/gestion/api/v1/ordenes/');
export const createOrder = async (order) => await axios.post('/gestion/api/v1/ordenes/', order);
export const deleteOrder = async (id) => await axios.delete(`/gestion/api/v1/ordenes/${id}/`);
export const updateOrder = async (id, order) => await axios.put(`/gestion/api/v1/ordenes/${id}/`, order);
export const getOrder = async (id) => await axios.get(`/gestion/api/v1/ordenes/${id}/`);