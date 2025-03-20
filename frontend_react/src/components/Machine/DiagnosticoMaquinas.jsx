import React, { useState, useEffect } from 'react';
import { Card, Accordion, Badge, ListGroup, Row, Col, Button, Modal, Form } from 'react-bootstrap';
import axios from '../../api/axiosConfig';
import toast from 'react-hot-toast';

function AsignacionModal({ show, onHide, maquina, onAsignacionCompleta }) {
    const [procesos, setProcesos] = useState([]);
    const [selectedProceso, setSelectedProceso] = useState('');
    const [tiposDisponibles, setTiposDisponibles] = useState([]);
    const [selectedTipos, setSelectedTipos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState([]);

    // Resetear estados cuando se abre el modal
    useEffect(() => {
        if (show) {
            setSelectedProceso('');
            setTiposDisponibles([]);
            setSelectedTipos([]);
            setPreview([]);
            cargarProcesos();
        }
    }, [show]);

    // Cuando se selecciona un proceso, cargar sus tipos de máquina
    useEffect(() => {
        if (selectedProceso) {
            cargarTiposProceso();
        } else {
            setTiposDisponibles([]);
            setSelectedTipos([]);
        }
    }, [selectedProceso]);

    // Cuando se seleccionan tipos, mostrar preview
    useEffect(() => {
        if (selectedTipos.length > 0) {
            cargarProcesosCompatibles();
        } else {
            setPreview([]);
        }
    }, [selectedTipos]);

    const cargarProcesos = async () => {
        try {
            const response = await axios.get('/gestion/api/v1/procesos/');
            setProcesos(response.data);
        } catch (error) {
            console.error('Error al cargar procesos:', error);
            toast.error('Error al cargar procesos');
        }
    };

    const cargarTiposProceso = async () => {
        try {
            console.log('Cargando tipos para proceso:', selectedProceso); // Debug
            const response = await axios.get(`/gestion/api/v1/procesos/${selectedProceso}/`);
            console.log('Respuesta tipos:', response.data); // Debug
            
            if (response.data.tipos_maquina_compatibles) {
                setTiposDisponibles(response.data.tipos_maquina_compatibles);
            } else {
                setTiposDisponibles([]);
                toast.error('No hay tipos de máquina disponibles para este proceso');
            }
        } catch (error) {
            console.error('Error al cargar tipos:', error);
            toast.error('Error al cargar tipos de máquina');
            setTiposDisponibles([]);
        }
    };

    const cargarProcesosCompatibles = async () => {
        try {
            const response = await axios.get('/gestion/api/v1/procesos/');
            const procesosCompatibles = response.data.filter(proceso => 
                proceso.tipos_maquina_compatibles.some(tipo => 
                    selectedTipos.includes(tipo.id)
                )
            );
            setPreview(procesosCompatibles);
        } catch (error) {
            console.error('Error al cargar preview:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedProceso) {
            toast.error('Por favor seleccione un proceso');
            return;
        }
    
        setLoading(true);
        try {
            // Obtener los tipos de máquina del proceso seleccionado
            const tiposIds = tiposDisponibles
                .filter(tipo => selectedTipos.includes(tipo.id))
                .map(tipo => tipo.id);
    
            // Verificar que hay tipos seleccionados
            if (tiposIds.length === 0) {
                toast.error('Por favor seleccione al menos un tipo de máquina');
                return;
            }
    
            // Hacer la petición con los tipos seleccionados
            await axios.put(`/machine/api/v1/machines/${maquina.id}/`, {
                tipos_maquina_ids: tiposIds
            });
    
            toast.success('Tipos de máquina actualizados correctamente');
            onAsignacionCompleta();
            onHide();
        } catch (error) {
            console.error('Error al asignar tipos:', error);
            const errorMessage = error.response?.data?.error || 'Error al asignar tipos de máquina';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
            <Modal show={show} onHide={onHide} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Asignar Tipo a Máquina</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>
                        <strong>Máquina:</strong> {maquina?.codigo} - {maquina?.descripcion}
                    </p>
                    <Form onSubmit={handleSubmit}>
                        {/* Selector de Proceso */}
                        <Form.Group className="mb-3">
                            <Form.Label>Seleccione un Proceso</Form.Label>
                            <Form.Select
                                value={selectedProceso}
                                onChange={(e) => {
                                    console.log('Proceso seleccionado:', e.target.value); // Debug
                                    setSelectedProceso(e.target.value);
                                }}
                                disabled={loading}
                            >
                                <option value="">Seleccione...</option>
                                {procesos.map(proceso => (
                                    <option key={proceso.id} value={proceso.id}>
                                        {proceso.codigo_proceso} - {proceso.descripcion}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
        
                        {/* Selector de Tipos de Máquina */}
                        {selectedProceso && (
                            <Form.Group className="mb-3">
                                <Form.Label>Tipos de Máquina Disponibles</Form.Label>
                                {tiposDisponibles.length > 0 ? (
                                    tiposDisponibles.map(tipo => (
                                        <Form.Check
                                            key={tipo.id}
                                            type="checkbox"
                                            id={`tipo-${tipo.id}`}
                                            label={`${tipo.codigo} - ${tipo.accion}`}
                                            checked={selectedTipos.includes(tipo.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedTipos([...selectedTipos, tipo.id]);
                                                } else {
                                                    setSelectedTipos(selectedTipos.filter(id => id !== tipo.id));
                                                }
                                            }}
                                            disabled={loading}
                                        />
                                    ))
                                ) : (
                                    <p className="text-muted">No hay tipos de máquina disponibles para este proceso</p>
                                )}
                            </Form.Group>
                        )}

                    {/* Preview de Procesos Compatibles */}
                    {preview.length > 0 && (
                        <div className="mb-3">
                            <h6>Procesos que se habilitarán:</h6>
                            <div className="border p-2 rounded" style={{maxHeight: '200px', overflowY: 'auto'}}>
                                {preview.map(proceso => (
                                    <Badge 
                                        key={proceso.id} 
                                        bg={proceso.id === selectedProceso ? "primary" : "secondary"}
                                        className="me-1 mb-1"
                                    >
                                        {proceso.codigo_proceso} - {proceso.descripcion}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="d-flex justify-content-end gap-2">
                        <Button variant="secondary" onClick={onHide} disabled={loading}>
                            Cancelar
                        </Button>
                        <Button 
                            variant="primary"
                            type="submit" 
                            disabled={loading || !selectedProceso}
                        >
                            {loading ? 'Asignando...' : 'Asignar'}
                        </Button>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    );
}

export function DiagnosticoMaquinas() {
    const [diagnostico, setDiagnostico] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [selectedMaquina, setSelectedMaquina] = useState(null);

    const fetchDiagnostico = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/machine/api/v1/machines-diagnostico/');
            setDiagnostico(response.data);
        } catch (error) {
            setError('Error al cargar el diagnóstico');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDiagnostico();
    }, []);

    const handleAsignarTipo = (maquina) => {
        setSelectedMaquina(maquina);
        setShowModal(true);
    };

    const renderMaquinaInfo = (maquina) => (
        <ListGroup.Item key={maquina.id}>
            <div className="d-flex justify-content-between align-items-start">
                <div>
                    <h6>{maquina.codigo} - {maquina.descripcion}</h6>
                    <small className="text-muted">Empresa: {maquina.empresa}</small>
                    
                    {/* Tipos de máquina */}
                    <div className="mt-2">
                        <strong>Tipos:</strong>{' '}
                        {maquina.tipos.length > 0 ? (
                            maquina.tipos.map(tipo => (
                                <Badge key={tipo.id} bg="info" className="me-1">
                                    {tipo.codigo} - {tipo.accion}
                                </Badge>
                            ))
                        ) : (
                            <Badge bg="warning">Sin tipos asignados</Badge>
                        )}
                    </div>

                    {/* Procesos */}
                    <div className="mt-2">
                        <strong>Procesos:</strong>{' '}
                        {maquina.procesos.length > 0 ? (
                            maquina.procesos.map(proceso => (
                                <Badge key={proceso.id} bg="success" className="me-1">
                                    {proceso.codigo} - {proceso.descripcion}
                                </Badge>
                            ))
                        ) : (
                            <Badge bg="warning">Sin procesos asociados</Badge>
                        )}
                    </div>

                    {/* Órdenes de trabajo */}
                    {maquina.ordenes_trabajo.length > 0 && (
                        <div className="mt-2">
                            <strong>OTs:</strong>{' '}
                            {maquina.ordenes_trabajo.map(ot => (
                                <Badge key={ot.codigo_ot} bg="primary" className="me-1">
                                    {ot.codigo_ot} - {ot.situacion}
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>
                {(!maquina.tipos.length || !maquina.procesos.length) && (
                    <Button 
                        variant="outline-primary" 
                        size="sm"
                        onClick={() => handleAsignarTipo(maquina)}
                    >
                        Asignar Tipo
                    </Button>
                )}
            </div>
        </ListGroup.Item>
    );

    if (loading) return <div>Cargando diagnóstico...</div>;
    if (error) return <div className="text-danger">{error}</div>;
    if (!diagnostico) return null;

    return (
        <div className="p-3">
            <h3>Diagnóstico de Máquinas</h3>
            <Row className="mt-3">
                <Col>
                    <Accordion>
                        {/* Máquinas sin tipo */}
                        <Accordion.Item eventKey="0">
                            <Accordion.Header>
                                Máquinas sin tipo asignado ({diagnostico.maquinas_sin_tipo.length})
                            </Accordion.Header>
                            <Accordion.Body>
                                <ListGroup>
                                    {diagnostico.maquinas_sin_tipo.map(renderMaquinaInfo)}
                                </ListGroup>
                            </Accordion.Body>
                        </Accordion.Item>

                        {/* Máquinas sin procesos */}
                        <Accordion.Item eventKey="1">
                            <Accordion.Header>
                                Máquinas sin procesos ({diagnostico.maquinas_sin_procesos.length})
                            </Accordion.Header>
                            <Accordion.Body>
                                <ListGroup>
                                    {diagnostico.maquinas_sin_procesos.map(renderMaquinaInfo)}
                                </ListGroup>
                            </Accordion.Body>
                        </Accordion.Item>

                        {/* Máquinas con procesos */}
                        <Accordion.Item eventKey="2">
                            <Accordion.Header>
                                Máquinas con procesos ({diagnostico.maquinas_con_procesos.length})
                            </Accordion.Header>
                            <Accordion.Body>
                                <ListGroup>
                                    {diagnostico.maquinas_con_procesos.map(renderMaquinaInfo)}
                                </ListGroup>
                            </Accordion.Body>
                        </Accordion.Item>

                        {/* Máquinas en OT */}
                        <Accordion.Item eventKey="3">
                            <Accordion.Header>
                                Máquinas en OT ({diagnostico.maquinas_en_ot.length})
                            </Accordion.Header>
                            <Accordion.Body>
                                <ListGroup>
                                    {diagnostico.maquinas_en_ot.map(renderMaquinaInfo)}
                                </ListGroup>
                            </Accordion.Body>
                        </Accordion.Item>
                    </Accordion>
                </Col>
            </Row>
            
            <AsignacionModal
                show={showModal}
                onHide={() => setShowModal(false)}
                maquina={selectedMaquina}
                onAsignacionCompleta={fetchDiagnostico}
            />
        </div>
    );
}