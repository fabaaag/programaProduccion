import React, { useEffect, useState } from 'react';
import { Table, Badge, Button, Container } from 'react-bootstrap';
import CompNavbar from '../Navbar/CompNavbar';
import { Footer } from '../../components/Footer/Footer';
import { getAllMachinesFromApp, getMachineDetails } from '../../api/machines.api';
import { toast } from 'react-hot-toast';
import { MachineDetailsModal } from './MachineDetailsModal';

export function MachineList(){
    const [machines, setMachines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedMachine, setSelectedMachine] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false); 

    useEffect(() => {
        loadMachines();
    }, []);

    const loadMachines = async () => {
        try {
            setLoading(true);
            const data = await getAllMachinesFromApp();
            setMachines(data);
        } catch (error) {
            console.error('Error al cargar máquinas:', error);
            toast.error('Error al cargar la lista de máquinas');
        } finally {
            setLoading(false);
        }
    };

    const handleMachineUpdate = async () => {
        //Recargar los detalles de la máquina después de una actualización
        if (selectedMachine) {
            await handleShowDetails(selectedMachine.id);
        }
        //Recargar la lista de máquinas
        await loadMachines();

    }

    const handleShowDetails = async (machineId) => {
        try{
            setLoadingDetails(true);
            const details = await getMachineDetails(machineId);
            setSelectedMachine(details);
            setShowModal(true);
        } catch (error){
            console.error('Error al cargar detalles:', error);
            toast.error('Error al cargar los detalles de la máquina');
        } finally {
            setLoadingDetails(false);
        }
    };

    const getStatusBadge = (estado) => {
        if (!estado) return <Badge bg="secondary">Sin Estado</Badge>;

        const badgeColors = {
            'Operativa': 'success',
            'En Mantención': 'warning',
            'Inoperativa': 'danger'
        };

        return (
            <Badge bg={badgeColors[estado.estado] || 'secondary'}>
                {estado.estado}
            </Badge>
        );
    };

    if (loading) return <div>Cargando máquinas...</div>;

    return (
        <>
            <CompNavbar />
            <Container className="mt-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h1>Gestión de Máquinas</h1>
                    <Button variant="primary">Nueva Máquina</Button>
                </div>

                <Table striped bordered hover>
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>Descripción</th>
                            <th>Tipo</th>
                            <th>Estado</th>
                            <th>Disponible</th>
                            <th>Capacidad Máxima</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {machines.map(machine => (
                            <tr key={machine.id}>
                                <td>{machine.codigo}</td>
                                <td>{machine.descripcion}</td>
                                <td>{machine.tipo_maquina?.descripcion || 'No asignado'}</td>
                                <td>{getStatusBadge(machine.estado)}</td>
                                <td>
                                    <Badge bg={machine.disponible ? 'success' : 'danger'}>
                                        {machine.disponible ? 'Sí' : 'No'}
                                    </Badge>
                                </td>
                                <td>{machine.capacidad_maxima}</td>
                                <td>
                                    <Button 
                                        variant="outline-primary"
                                        size="sm"
                                        className="me-2"
                                        onClick={() => handleShowDetails(machine.id)}
                                    >
                                        Ver Detalles
                                    </Button>
                                    
                                </td>
                            </tr>
                        ))}
                    </tbody>

                </Table>
                
                <MachineDetailsModal 
                    show={showModal}
                    onHide={() => setShowModal(false)}
                    machine={selectedMachine}
                    onUpdate={handleMachineUpdate}
                />
            </Container>
            <Footer />
        </>
    );
}