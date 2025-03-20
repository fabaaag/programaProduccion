import { useState, useEffect } from 'react';
import { Modal, Table, Alert, Spinner } from 'react-bootstrap';
import { getOperatorTasks } from '../../api/operator.api';
import { toast } from 'react-hot-toast';


export function OperatorAsignacionesModal({ show, handleClose, operator }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [tareas, setTareas] = useState([]);

    

    const loadAsignaciones = async (operator) => {
        if(!operator) return;

        setLoading(true);
        setError(null);

        try {
            console.log('Cargad')
            const taskData = await getOperatorTasks(operator);
            console.log("Datos de tareas recibidos:", taskData)
            setTareas(taskData || []);
        } catch (error) {
            console.error('Error al cargar asignaciones', error);
            toast.error('Error al cargar las asignaciones del operador');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (show && operator){
            loadAsignaciones(operator);
        }
    }, [show, operator]);

    const formatDate = (dateString) => {
        if(!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-CL');
    };

    return (
        <Modal show={show} onHide={(handleClose)} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>
                    Asignacion de {operator?.nombre}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && <Alert variant="danger">{error}</Alert>}

                {loading ? (
                    <div className="text-center py-4">
                        <Spinner animation="border" role="status">
                            <span className="visually-hidden">Cargando...</span>
                        </Spinner>
                        <p className="mt-2">Cargando asignaciones...</p>
                    </div>
                ): tareas.length === 0 ? (
                    <Alert variant="info">
                        Este operador no tiene asignaciones actualmente.
                    </Alert>
                ):(
                    <Table striped bordered hover responsive>
                        <thead>
                            <tr>
                                <th>Programa</th>
                                <th>Orden de Trabajo</th>
                                <th>Proceso</th>
                                <th>Máquina</th>
                                <th>Fecha Inicio</th>
                                <th>Fecha Fin</th>
                                <th>Cantidad Total</th>
                                <th>Estandar Diario</th>
                                <th>Dias Estimados</th>
                                <th>Producción Diaria</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tareas.map((tarea, index) => (
                                <tr key={index}>
                                    <td>{tarea.programa.nombre}</td>
                                    <td>{tarea.orden_trabajo.codigo} - {tarea.orden_trabajo.descripcion}</td>
                                    <td>{tarea.proceso.codigo} - {tarea.proceso.descripcion}</td>
                                    <td>{tarea.maquina.codigo} - {tarea.maquina.descripcion}</td>
                                    <td>{formatDate(tarea.fechas.inicio)}</td>
                                    <td>{formatDate(tarea.fechas.fin)}</td>
                                    <td>{tarea.produccion.cantidad_total}</td>
                                    <td>{tarea.produccion.estandar_diario}</td>
                                    <td>{tarea.produccion.dias_estimados}</td>
                                    <td>{tarea.produccion.cantidad_diaria}</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                )}
            </Modal.Body>
        
        </Modal>
    );
}

