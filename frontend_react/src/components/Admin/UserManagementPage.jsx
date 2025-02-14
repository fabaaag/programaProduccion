import { useState, useEffect } from 'react';
import { Table, Button, Container, Card } from 'react-bootstrap';
import CompNavbar from '../../components/Navbar/CompNavbar';
import { getAllUsers } from '../../api/users.api'
import { toast } from 'react-hot-toast';
import { useNavigate} from 'react-router-dom';

export function UserManagementPage(){
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadUsers();
    }, []);

    const handleToggleStatus = async (userId) => {
        try{
            await toggleUserStatus(userId);
            loadUsers();
        } catch (error) {
            toast.error('Error al actualizar el estado del usuario');
        }
    };

    const loadUsers = async () => {
        try{
            const data = await getAllUsers();
            setUsers(data);
        } catch (error) {
            toast.error('Error al cargar usuarios');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Cargando...</div>

    return (
        <>
            <CompNavbar />
            <Container className='mt-4'>
                <Card>
                    <Card.Header>
                        <h3>Gestión de Usuarios</h3>
                        <Button
                            variant='primary'
                            onClick={() => navigate('/users/create')}
                        >
                            Crear Usuario
                        </Button>
                    </Card.Header>
                    <Card.Body>
                        <Table striped bordered hover>
                            <thead>
                                <tr>
                                    <th>Usuario</th>
                                    <th>Nombre</th>
                                    <th>Email</th>
                                    <th>Rol</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.id}>
                                        <td>{user.username}</td>
                                        <td>{`${user.first_name} ${user.last_name}`}</td>
                                        <td>{user.email}</td>
                                        <td>{user.rol}</td>
                                        <td>{user.activo ? 'Activo' : 'Inactivo'}</td>
                                        <td>
                                            <Button
                                                variant='info'
                                                size='sm'
                                                className='me-2'
                                                onClick={() => navigate(`/users/edit/${user.id}`)}
                                            >
                                                Editar
                                            </Button>
                                            <Button
                                                variant={user.activo ? "danger" : "success"}
                                                size="sm"
                                                onClick={() => handleToggleStatus(user.id)}
                                            >
                                                {user.activo ? "Desactivar" :"Activar"}
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
};