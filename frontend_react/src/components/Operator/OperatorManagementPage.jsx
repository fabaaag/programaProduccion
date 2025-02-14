import { useState, useEffect } from 'react';
import { Container, Card, Table, Form, Row, Col } from 'react-bootstrap';
import CompNavbar from '../Navbar/CompNavbar';
import { getAllOperators } from '../../api/operator.api';
import { getMaquinas } from '../../api/programs.api';
import { toast } from 'react-hot-toast';

export function OperatorManagementPage(){
    const [operators, setOperators] = useState([]);
    const [machines, setMachines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        searchTerm: '',
        machine: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try{
            const [operatorsData, machinesData] = await Promise.all([
                getAllOperators(),
                getMaquinas()
            ]);
            setOperators(operatorsData);
            setMachines(machinesData);
            setLoading(false);
        }catch (error){
            toast.error('Error al cargar los datos');
            setLoading(false);
        }
    };

    const filteredOperators = operators.filter(operator => {
        const matchesSearch = filters.searchTerm === '' || 
            operator.nombre.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
            operator.rut.toLowerCase().includes(filters.searchTerm.toLowerCase());

        const matchesMachine = filters.machine === '' || operator.maquinas.some(m => m.id === parseInt(filters.machine));

        return matchesSearch && matchesMachine;
    });

    return (
        <>
            <CompNavbar />
            <Container className="mt-4">
                <Card>
                    <Card.Header as="h5">Gestión de Operarios</Card.Header>
                    <Card.Body>
                        <Row className="mb-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Buscar por nombre o RUT</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Ingrese nombre o RUT"
                                        value={filters.searchTerm}
                                        onChange={(e)=> setFilters({
                                            ...filters,
                                            searchTerm: e.target.value
                                        })} 
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Filtrar por máquina</Form.Label>
                                    <Form.Select
                                        value={filters.machine}
                                        onChange={(e) => setFilters({
                                            ...filters,
                                            machine: e.target.value
                                        })}
                                    >
                                        <option value="">Todas las máquinas</option>
                                        {machines.map(machine => (
                                            <option key={machine.id} value={machine.id}>
                                                {machine.descripcion}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                        <Table striped bordered hover responsive>
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>RUT</th>
                                    <th>Rol</th>
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
                                        <td>{operator.maquinas.map(m => m.nombre).join(', ')}</td>
                                        <td>
                                            <span className={`badge ${operator.activo ? 'bg-success' : 'bg-danger'}`}>
                                                {operator.activo ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td>
                                            <Button variant="primary" size="sm">
                                                <i className="fas fa-pencil-alt"></i>
                                            </Button>
                                            <Button variant="danger" size="sm">
                                                <i className="fas fa-trash"></i>
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </Card.Body>
                </Card>
            </Container>
        </>
    )
}