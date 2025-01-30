import { useEffect, useState } from "react";
import { getAllOrders } from "../../api/orders.api.js";
import CompNavbar from "../Navbar/CompNavbar.jsx";
import { useNavigate } from "react-router-dom";
import Pagination from 'react-bootstrap/Pagination';

export function OrdersList(){
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const[theme, setTheme] = useState('light');
    const navigate = useNavigate()
    
    useEffect(()=>{
        async function loadOrders(){
            try{
                setLoading(true);
                const res = await getAllOrders();
                setOrders(res.data);
            }catch(error){
                console.error("Error al cargar las órdenes: ",error);
                alert(`Error al cargar las órdenes: ${error.message}`);
            }finally{
                setLoading(false)
            }
        }
        loadOrders();
    }, []);
    
    if (loading) return <p>Cargando órdenes</p>;
    
    return(
        <div className={` ${theme}`}>
            <CompNavbar />
            <br />
            <div className="container">
                <section className="container-section container-fluid border">
                    <div className="d-flex justify-content-evenly mt-3">
                        <a href="/" className="mx-3">Volver al Inicio</a>
                        <h1 className="display-4 text-center mb-4">Ordenes de Trabajo</h1>
                        <button className="btn btn-info me-4">Ir a Programas</button>
                    </div>
                </section>
                <section className="container-section container-fluid">
                    <div className="table-responsive">
                        <table className="table table-bordered table-striped">
                            <thead className="table-dark">
                                <tr className={theme == 'light' ? "table-dark": "table-primary"}>
                                    <th colSpan={2} className="th-first">Orden de Trabajo</th>
                                    <th colSpan={2} className="th-first">Código</th>
                                    <th colSpan={3} className="th-first">Fecha</th>
                                    <th className="th-first"></th>
                                    <th colSpan={2} className="th-first">O.T</th>
                                    <th colSpan={3} className="th-first">Nota Venta</th>
                                    <th className="th-first"></th>
                                    <th colSpan={2} className="th-first">Cantidad</th>
                                    <th colSpan={2} className="th-first">Peso</th>
                                    <th colSpan={2} className="th-first">Materia Prima</th>
                                </tr>
                                <tr>
                                    <th>Nro.</th>
                                    <th>Descripción Producto</th>
                                    <th>Inicial</th>
                                    <th>Salida</th>
                                    <th>Emisión</th>
                                    <th>Término</th>
                                    <th>Estado</th>
                                    <th>Tipo</th>
                                    <th>Situación</th>
                                    <th>Nro.</th>
                                    <th>Item</th>
                                    <th>Ref.</th>
                                    <th>Multa</th>
                                    <th>Pedido</th>
                                    <th>Avance</th>
                                    <th>Unitario</th>
                                    <th>Código</th>
                                    <th>Cantidad</th>
                                    <th>Cliente</th>
                                    <th>Ficha Técnica</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map(order=>(
                                    <tr key={order.id}>
                                        <td onClick={()=>{
                                            navigate(`/orders/${order.id}`)
                                        }}>{order.codigo_ot}</td>
                                        <td>{order.descripcion_producto_ot}</td>
                                        <td>{order.codigo_producto_inicial}</td>
                                        <td>{order.codigo_producto_salida}</td>
                                        <td>{order.fecha_emision}</td>
                                        <td>{order.fecha_termino}</td>
                                        <td></td>
                                        <td>{order.tipo_ot?.descripcion}</td>
                                        <td>{order.situacion_ot?.descripcion}</td>
                                        <td>{order.nro_nota_venta_ot}</td>
                                        <td>{order.item_nota_venta}</td>
                                        <td>{order.referencia_nota_venta}</td>
                                        <td>{order.multa}</td>
                                        <td>{order.cantidad}</td>
                                        <td>{order.cantidad_avance}</td>
                                        <td>{order.peso_unitario}</td>
                                        <td>{order.materia_prima?.nombre}</td>
                                        <td>{order.cantidad_mprima}</td>
                                        <td>{order.cliente?.nombre}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                </section>
            </div>
        </div>
    )
}