import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Table, Form, Button, ButtonGroup } from 'react-bootstrap';
import { ReactSortable } from "react-sortablejs";
import CompNavbar from "../../components/Navbar/CompNavbar";
import { Footer } from "../../components/Footer/Footer";
import { LoadingSpinner } from "../../components/UI/LoadingSpinner/LoadingSpinner";
import { getProgram } from "../../api/programs.api";
import moment from 'moment';

export function ReporteSupervisor() {
    const { programId } = useParams();
    const [loading, setLoading] = useState(true);
    const [allTasks, setAllTasks] = useState([]); // Todas las tareas
    const [displayedTasks, setDisplayedTasks] = useState([]); // Tareas del día seleccionado
    const [currentDate, setCurrentDate] = useState(moment().format('YYYY-MM-DD'));
    const [availableDates, setAvailableDates] = useState([]);
    const [selectedDateIndex, setSelectedDateIndex] = useState(0);

    useEffect(() => {
        fetchAllTasks();
    }, [programId]);

    useEffect(() => {
        if (allTasks.length > 0) {
            updateAvailableDates();
        }
    }, [allTasks]);

    useEffect(() => {
        filterTasksByDate(currentDate);
    }, [currentDate, allTasks]);

    const fetchAllTasks = async () => {
        try {
            const response = await getProgram(programId);
            if (response.routes_data?.items) {
                const tasks = response.routes_data.items.map((item, index) => ({
                    id: item.id,
                    priority: index + 1,
                    maquina: item.maquina || 'Sin máquina',
                    proceso: item.name,
                    cantidad: item.cantidad_intervalo,
                    operador: item.operador_nombre || 'Sin asignar',
                    estado: 'Pendiente',
                    fecha_inicio: moment(item.start_time).format('YYYY-MM-DD'),
                    fecha_fin: moment(item.end_time).format('YYYY-MM-DD'),
                    observaciones: ''
                }));
                setAllTasks(tasks);
            }
        } catch (error) {
            console.error("Error al cargar tareas:", error);
        } finally {
            setLoading(false);
        }
    };

    const updateAvailableDates = () => {
        // Obtener todas las fechas únicas de inicio y fin
        const dates = new Set();
        allTasks.forEach(task => {
            const start = moment(task.fecha_inicio);
            const end = moment(task.fecha_fin);
            
            // Agregar todas las fechas entre inicio y fin
            for (let m = moment(start); m.diff(end, 'days') <= 0; m.add(1, 'days')) {
                dates.add(m.format('YYYY-MM-DD'));
            }
        });

        // Convertir a array y ordenar
        const sortedDates = Array.from(dates).sort();
        setAvailableDates(sortedDates);
        
        // Establecer la fecha actual si está en el rango, o la primera fecha disponible
        if (sortedDates.length > 0) {
            const today = moment().format('YYYY-MM-DD');
            const dateIndex = sortedDates.indexOf(today);
            if (dateIndex >= 0) {
                setSelectedDateIndex(dateIndex);
                setCurrentDate(today);
            } else {
                setSelectedDateIndex(0);
                setCurrentDate(sortedDates[0]);
            }
        }
    };

    const filterTasksByDate = (date) => {
        const tasksForDate = allTasks.filter(task => {
            const taskStart = moment(task.fecha_inicio);
            const taskEnd = moment(task.fecha_fin);
            const currentMoment = moment(date);
            return currentMoment.isBetween(taskStart, taskEnd, 'day', '[]');
        });
        setDisplayedTasks(tasksForDate);
    };

    const handleDateNavigation = (direction) => {
        let newIndex = direction === 'next' 
            ? Math.min(selectedDateIndex + 1, availableDates.length - 1)
            : Math.max(selectedDateIndex - 1, 0);
        
        setSelectedDateIndex(newIndex);
        setCurrentDate(availableDates[newIndex]);
    };

    const handlePriorityUpdate = async (newList) => {
        setDisplayedTasks(newList);
        // Actualizar las prioridades en allTasks también
        const updatedAllTasks = allTasks.map(task => {
            const updatedTask = newList.find(t => t.id === task.id);
            return updatedTask || task;
        });
        setAllTasks(updatedAllTasks);
        // Aquí implementaremos la actualización de prioridades en el backend
    };

    if (loading) return <LoadingSpinner message="Cargando reporte..." />;

    return (
        <>
            <CompNavbar />
            <Container className="mt-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <Link to={`/programs/${programId}`} className="btn btn-secondary">
                        Volver al Programa
                    </Link>
                    <h2>Reporte de Supervisor</h2>
                </div>

                <div className="d-flex justify-content-center align-items-center mb-4">
                    <ButtonGroup>
                        <Button 
                            variant="outline-primary"
                            onClick={() => handleDateNavigation('prev')}
                            disabled={selectedDateIndex === 0}
                        >
                            &lt; Día Anterior
                        </Button>
                        <Button variant="light" disabled>
                            {moment(currentDate).format('DD/MM/YYYY')}
                        </Button>
                        <Button 
                            variant="outline-primary"
                            onClick={() => handleDateNavigation('next')}
                            disabled={selectedDateIndex === availableDates.length - 1}
                        >
                            Siguiente Día &gt;
                        </Button>
                    </ButtonGroup>
                </div>

                {displayedTasks.length > 0 ? (
                    <div className="table-responsive">
                        <Table striped bordered hover>
                            <thead>
                                <tr>
                                    <th>Prioridad</th>
                                    <th>Máquina</th>
                                    <th>Proceso</th>
                                    <th>Cantidad</th>
                                    <th>Operador</th>
                                    <th>Estado</th>
                                    <th>Observaciones</th>
                                </tr>
                            </thead>
                            <ReactSortable
                                list={displayedTasks}
                                setList={handlePriorityUpdate}
                                animation={200}
                                tag="tbody"
                            >
                                {displayedTasks.map((task, index) => (
                                    <tr key={task.id}>
                                        <td>{index + 1}</td>
                                        <td>{task.maquina}</td>
                                        <td>{task.proceso}</td>
                                        <td>{task.cantidad}</td>
                                        <td>{task.operador}</td>
                                        <td>
                                            <Form.Select
                                                size="sm"
                                                value={task.estado}
                                                onChange={(e) => {
                                                    const newTasks = [...displayedTasks];
                                                    newTasks[index].estado = e.target.value;
                                                    setDisplayedTasks(newTasks);
                                                }}
                                            >
                                                <option value="Pendiente">Pendiente</option>
                                                <option value="En Proceso">En Proceso</option>
                                                <option value="Completado">Completado</option>
                                                <option value="Detenido">Detenido</option>
                                            </Form.Select>
                                        </td>
                                        <td>
                                            <Form.Control
                                                size="sm"
                                                type="text"
                                                value={task.observaciones}
                                                onChange={(e) => {
                                                    const newTasks = [...displayedTasks];
                                                    newTasks[index].observaciones = e.target.value;
                                                    setDisplayedTasks(newTasks);
                                                }}
                                                placeholder="Agregar observación"
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </ReactSortable>
                        </Table>
                    </div>
                ) : (
                    <div className="alert alert-info">
                        No hay tareas programadas para este día
                    </div>
                )}

                <div className="d-flex justify-content-end mt-3">
                    <Button variant="primary" onClick={() => {/* Implementar guardado */}}>
                        Guardar Reporte
                    </Button>
                </div>
            </Container>
            <Footer />
        </>
    );
}