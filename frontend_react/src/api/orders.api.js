import axios from 'axios'

const ordersApi = axios.create({
    baseURL:'http://localhost:8000/gestion/api/v1/ordenes/'
});

export const getAllOrders = () => ordersApi.get('/');
export const createOrder = (order) => ordersApi.post('/', order);
export const deleteOrder = (id) => ordersApi.delete(`/${id}/`);
export const updateOrder = (id, order) => ordersApi.put(`/${id}/`, order);
export const getOrder = (id) => ordersApi.get(`/${id}/`);