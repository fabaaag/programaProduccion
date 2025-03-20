import React, { useState, useEffect } from 'react';
import { Modal, Nav, Tab, Row, Col, Table, Badge, Form, Button } from 'react-bootstrap';
import toast from 'react-hot-toast';
import { getMachineTypes, updateMachineType } from '../../api/machines.api';


export function MachineDetailsModal({ show, onHide, machine }) {
    const [machineTypes, setMachineTypes] = useState([]);
    const [selectedTypes, setSelectedTypes] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (show) {
            loadMachineTypes();
            // Inicializar con los tipos actuales de la máquina
            setSelectedTypes(machine?.estado?.tipos_maquina?.map(t => t.id) || []);
        }
    }, [show, machine]);

    const loadMachineTypes = async () => {
        try {
            const types = await getMachineTypes();
            setMachineTypes(types);
        } catch (error) {
            console.error('Error al cargar tipos de máquina:', error);
            toast.error('Error al cargar tipos de máquina');
        }
    };

    const handleUpdateType = async () => {
        try {
            setLoading(true);
            await updateMachineType(machine.id, selectedTypes); // Actualizado para enviar array
            toast.success('Tipos de máquina actualizados correctamente');
            setIsEditing(false);
        } catch (error) {
            console.error('Error al actualizar tipos de máquina:', error);
            toast.error('Error al actualizar tipos de máquina');
        } finally {
            setLoading(false);
        }
    };

    const renderMachineTypeEdit = () => (
        <div className="mb-3">
            <Form.Group>
                <Form.Label>Tipos de Máquina</Form.Label>
                <Form.Select
                    multiple
                    value={selectedTypes}
                    onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions, option => option.value);
                        setSelectedTypes(selected);
                    }}
                    disabled={loading}
                >
                    {machineTypes.map(type => (
                        <option key={type.id} value={type.id}>
                            {type.codigo} - {type.descripcion}
                        </option>
                    ))}
                </Form.Select>
                <Form.Text className="text-muted">
                    Mantenga presionado Ctrl para seleccionar múltiples tipos
                </Form.Text>
            </Form.Group>
            <div className="mt-2">
                <Button
                    variant="primary"
                    onClick={handleUpdateType}
                    disabled={loading || selectedTypes.length === 0}
                    className="me-2"
                >
                    {loading ? 'Guardando...' : 'Guardar'}
                </Button>
                <Button
                    variant="secondary"
                    onClick={() => {
                        setIsEditing(false);
                        setSelectedTypes(machine?.estado?.tipos_maquina?.map(t => t.id) || []);
                    }}
                    disabled={loading}
                >
                    Cancelar
                </Button>
            </div>
        </div>
    );

    const renderMachineTypeDisplay = () => (
        <dl className="row">
            <dt className="col-sm-4">Tipos de Máquina</dt>
            <dd className="col-sm-8">
                <div className="d-flex justify-content-between align-items-center">
                    <div>
                        {machine.estado?.tipos_maquina?.map(tipo => (
                            <Badge 
                                key={tipo.id} 
                                bg="info" 
                                className="me-1"
                            >
                                {tipo.codigo} - {tipo.descripcion}
                            </Badge>
                        )) || 'Sin tipos asignados'}
                    </div>
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                    >
                        Editar
                    </Button>
                </div>
            </dd>
        </dl>
    );

    if (!machine) return null;

    const getStatusBadge = (estado) => {
        if (!estado) return  <Badge bg="secondary">Sin Estado</Badge>;

        const badgeColors = {
            'Operativa': 'success',
            'En Mantencioón': 'warning',
            'Inoperativa': 'danger'
        };

        return (
            <Badge bg={badgeColors[estado.estado] || 'secondary'}>{estado.estado}</Badge>
        );
    };

    return (
        <Modal show={show} onHide={onHide} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>
                    Detalles de Máquina: {machine?.codigo_maquina}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Tab.Container defaultActiveKey="info">
                    <Row>
                        <Col sm={3}>
                            <Nav variant="pills" className="flex-column">
                                <Nav.Item>
                                    <Nav.Link eventKey="info">Información</Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link eventKey="estado">Estado</Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link eventKey="procesos">Procesos</Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link eventKey="ordenes">Órdenes</Nav.Link>
                                </Nav.Item>
                            </Nav>
                        </Col>
                        <Col sm={9}>
                            <Tab.Content>
                                <Tab.Pane eventKey="info">
                                    <dl className="row">
                                        <dt className="col-sm-4">Código</dt>
                                        <dd className="col-sm-8">{machine.codigo_maquina}</dd>

                                        <dt className="col-sm-4">Descripción</dt>
                                        <dd className="col-sm-8">{machine.descripcion}</dd>

                                        <dt className="col-sm-4">Sigla</dt>
                                        <dd className="col-sm-8">{machine.sigla}</dd>

                                        <dt className="col-sm-4">Carga</dt>
                                        <dd className="col-sm-8">{machine.carga}</dd>

                                        <dt className="col-sm-4">Golpes</dt>
                                        <dd className="col-sm-8">{machine.golpes}</dd>

                                        <dt className="col-sm-4">Empresa</dt>
                                        <dd className="col-sm-8">{machine.empresa?.nombre || 'No asignada'}</dd>
                                    </dl>
                                </Tab.Pane>
                                <Tab.Pane eventKey="estado">
                                    <dl className="row">
                                        <dt className="col-sm-4">Tipo de Máquina</dt>
                                        <dd className="col-sm-8">
                                            {isEditing ? renderMachineTypeEdit() : renderMachineTypeDisplay()}
                                        </dd>

                                        <dt className="col-sm-4">Descripción</dt>
                                        <dd className="col-sm-8">
                                            {getStatusBadge(machine.estado?.estado_operatividad)}
                                        </dd>

                                        <dt className="col-sm-4">Disponible</dt>
                                        <dd className="col-sm-8">
                                            <Badge bg={machine.estado?.disponible ? 'success' : 'danger'}>
                                                {machine.estado?.disponible ? 'Sí' : 'No'}

                                            </Badge>
                                        </dd>

                                        <dt className="col-sm-4">Observaciones</dt>
                                        <dd className="col-sm-8">
                                            {machine.estado?.observaciones || 'Sin observaciones'}
                                        </dd>
                                    </dl>
                                </Tab.Pane>
                                <Tab.Pane eventKey="procesos">
                                    <Table striped bordered hover size="sm">
                                        <thead>
                                            <tr>
                                                <th>Código</th>
                                                <th>Descripción</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {machine.procesos_asociados?.map(proceso => (
                                                <tr key={proceso.id}>
                                                    <td>{proceso.codigo_proceso}</td>
                                                    <td>{proceso.descripcion}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </Tab.Pane>
                                <Tab.Pane eventKey="estado">
                                    <Table striped bordered hover size="sm">
                                        <thead>
                                            <tr>
                                                <th>Código OT</th>
                                                <th>Descripción Producto</th>
                                                <th>Programa</th>
                                                <th>Estado</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {machine.ordenes_trabajo?.map(ot => (
                                                <tr key={ot.id}>
                                                    <td>{ot.codigo_ot}</td>
                                                    <td>{ot.descripcion}</td>
                                                    <td>{ot.programa?.nombre || 'Sin programa asignado'}</td>
                                                    <td>
                                                        <Badge bg={ot.estado === 'P' ? 'primary' : 'success'}>
                                                            {ot.estado_display}
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </Tab.Pane>
                            </Tab.Content>
                            
                        </Col>
                    </Row>
                </Tab.Container>
            </Modal.Body>
        </Modal>
    )
}