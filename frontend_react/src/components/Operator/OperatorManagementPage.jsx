import { useState, useEffect } from 'react';
import { Container, Card, Table, Form, Row, Col, Button, Modal } from 'react-bootstrap';
import CompNavbar from '../Navbar/CompNavbar';
import { getAllOperators } from '../../api/operator.api';
import { getAllMachines } from '../../api/machines.api';
import { toast } from 'react-hot-toast';
import {OperatorForm} from './OperatorForm';
import { OperatorMachinesModal } from './OperatorMachinesModal';

export function OperatorManagementPage(){
    const [operators, setOperators] = useState([]);
    const [machines, setMachines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingOperator, setEditingOperator] = useState(null);
    const [filters, setFilters] = useState({
        searchTerm: '',
        machine: ''
    });
    const [showMachinesModal, setShowMachinesModal] = useState(false);
    const [selectedOperator, setSelectedOperator] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try{
            setLoading(false);
            const operatorsData = await getAllOperators();
            setOperators(operatorsData);

            const machinesData = await getAllMachines();
            setMachines(machinesData);
        }catch (error){
            console.error('Error al cargar operadores:', error);
            toast.error('Error al cargar los operadores');  
            console.error('Error al cargar las máquinas:', error);
            toast.error('Error al cargar las máquinas');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (operator) => {
        setEditingOperator(operator);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingOperator(null);
    };

    const handleShowMachines = (operator) => {
        setSelectedOperator(operator);
        setShowMachinesModal(true);        
    }
    
    const filteredOperators = operators.filter(operator => {
        const searchTerm = filters.searchTerm.toLowerCase();
        return operator.nombre.toLowerCase().includes(searchTerm) ||
                operator.rut.toLowerCase().includes(searchTerm);
    });

    return (
        <>
            <CompNavbar />
            <Container className="mt-4">
                <Card>
                    <Card.Header className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">Gestión de Operarios</h5>
                        <Button variant="primary" onClick={() => setShowModal(true)}>
                            <i className="fas fa-plus"></i> Nuevo Operador
                        </Button>
                    </Card.Header>
                    <Card.Body>
                        <Row className="mb-3">
                            <Col md={6}>
                                <Form.Control
                                    type="text"
                                    placeholder="Buscar por nombre o RUT..."
                                    value={filters.searchTerm}
                                    onChange={(e) => setFilters({
                                        ...filters,
                                        searchTerm: e.target.value
                                    })}
                                />
                            </Col>
                            <Col md={6}>
                               <Form.Group>
                                   <Form.Select
                                       value={filters.machine}
                                       onChange={(e) => setFilters({
                                           ...filters,
                                           machine: e.target.value
                                       })}
                                   >
                                       <option value="">Filtrar por máquina</option>
                                       {machines.map(machine => (
                                           <option key={machine.id} value={machine.id}>
                                               {machine.descripcion}
                                           </option>
                                       ))}
                                   </Form.Select>
                               </Form.Group>
                           </Col>
                        </Row>

                        {loading ? (
                            <div className="text-center py-3">
                                <span>Cargando operadores...</span>
                            </div>
                        ) : (
                            <Table striped bordered hover responsive>
                                <thead>
                                    <tr>
                                        <th>Nombre</th>
                                        <th>RUT</th>
                                        <th>Rol</th>
                                        <th>Empresa</th>
                                        <th>Máquinas</th>
                                        <th>Estado</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredOperators.map(operator => (
                                        <tr key={operator.id}>
                                            <td>{operator.nombre}</td>
                                            <td>{operator.rut}</td>
                                            <td>{operator.rol.nombre}</td>
                                            <td>{operator.empresa.nombre}</td>
                                            <td>
                                                <Button 
                                                    variant="info" 
                                                    size="sm"
                                                    onClick={() => handleShowMachines(operator)}
                                                >
                                                    Ver Máquinas ({operator.maquinas.length})
                                                </Button>
                                            </td>
                                            <td>
                                                <span className={`badge ${operator.activo ? 'bg-success' : 'bg-danger'}`}>
                                                    {operator.activo ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </td>
                                            <td>
                                                <Button 
                                                    variant="primary" 
                                                    size="sm" 
                                                    onClick={() => handleEdit(operator)}
                                                    className="me-2"
                                                >
                                                    <i className="fas fa-edit">Editar</i>
                                                </Button>
                                                <Button 
                                                    variant="danger" 
                                                    size="sm" 
                                                    onClick={() => handleEdit(operator)}
                                                    className="me-2"
                                                >
                                                    <i className="fas fa-edit">Eliminar</i>
                                                </Button>
                                                
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        )}
                    </Card.Body>
                </Card>
            </Container>

            <OperatorForm 
                show={showModal}
                handleClose={handleCloseModal}
                operatorToEdit={editingOperator}
                onOperatorSaved={loadData}
            />

            <OperatorMachinesModal 
                show={showMachinesModal}
                handleClose={() => setShowMachinesModal(false)}
                operator={selectedOperator}
            />
        </>
    );
}