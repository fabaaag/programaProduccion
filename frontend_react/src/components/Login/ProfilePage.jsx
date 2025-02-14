import { useState, useEffect } from 'react';
import { Form, Button, Card, Container } from 'react-bootstrap';
import CompNavbar from '../Navbar/CompNavbar.jsx';
import { updateProfile, getProfile } from '../../api/auth.api';
import { toast } from 'react-hot-toast';

export function ProfilePage(){
    const [userData, setUserData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        telefono: '',
        cargo: ''
    });

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const profileData = await getProfile();
                setUserData({
                    first_name: profileData.first_name || '',
                    last_name: profileData.last_name || '',
                    email: profileData.email || '',
                    telefono: profileData.telefono || '',
                    cargo: profileData.cargo || ''
                });
            } catch (error) {
                console.error('Error al cargar el perfil:', error);
                toast.error('Error al cargar el perfil');
            } finally {
                setLoading(false);
            }
        };
    
        fetchProfile();
    }, []);

    
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            console.log('Datos a enviar:', userData);
            const updateUser = await updateProfile(userData);
            localStorage.setItem('user', JSON.stringify(updateUser));
            toast.success('Perfil actualizado exitosamente');
        }catch(error){
            console.error("error completo:", error.response?.data);
            toast.error('Error al actualizar el perfil');
        }
    };

    if (loading) {
        return <div>Cargando Perfil...</div>
    }

    return(
        <>
            <CompNavbar />
            <Container className='mt-4'>
                <Card>
                    <Card.Header>
                        <h3>Mi Perfil</h3>
                    </Card.Header>
                    <Card.Body>
                        <Form onSubmit={handleSubmit}>
                            <Form.Group className='mb-3'>
                                <Form.Label>Nombre</Form.Label>
                                <Form.Control
                                    type='text'
                                    value={userData.first_name}
                                    onChange={(e) => setUserData({
                                        ...userData,
                                        first_name: e.target.value
                                    })}
                                />
                            </Form.Group>

                            <Form.Group className='mb-3'>
                                <Form.Label>Apellido</Form.Label>
                                <Form.Control
                                    type='text'
                                    value={userData.last_name}
                                    onChange={(e) => setUserData({
                                        ...userData,
                                        last_name: e.target.value
                                   })}
                                />                                
                            </Form.Group>

                            <Form.Group className='mb-3'>
                                <Form.Label>Email</Form.Label>
                                <Form.Control 
                                    type='email'
                                    value={userData.email}
                                    onChange={(e) => setUserData({
                                        ...userData,
                                        email: e.target.value
                                    })}
                                />
                            </Form.Group>
                            
                            <Form.Group className='mb-3'>
                                <Form.Label>Teléfono</Form.Label>
                                <Form.Control 
                                    type='text'
                                    value={userData.telefono}
                                    onChange={(e) => setUserData({
                                        ...userData,
                                        telefono: e.target.value
                                    })}
                                />
                            </Form.Group>

                            <Form.Group className='mb-3'>
                                <Form.Label>Cargo</Form.Label>
                                <Form.Control 
                                    type='text'
                                    value={userData.cargo}
                                    onChange={(e) => setUserData({
                                        ...userData,
                                        cargo: e.target.value
                                    })}
                                />
                            </Form.Group>
                            <Button variant="primary" type="submit">
                                Actualizar Perfil
                            </Button>
                        </Form>
                    </Card.Body>
                </Card>
            </Container>
        
        </>
    )
}