import React, { useState} from 'react';
import { loginUser } from '../../api/auth.api';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Container, Card, Alert } from 'react-bootstrap';
import { toast } from 'react-hot-toast';


export function Login(){
    const [credentials, setCredentials] = useState({
        username: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        console.log('Credenciales a enviar:', credentials);
        try {
            const data = await loginUser(credentials);
            console.log('Respuesta del servidor:', data);

            //Guardar token y datos de usuario
            localStorage.setItem('token', data.token);
            localStorage.setItem('refresh', data.refresh)
            localStorage.setItem('user', JSON.stringify(data.user));

            toast.success('Inicio de sesión exitoso');
            
            
            //Redirigir segun el rol del usuario
            if(data.user.rol === 'ADMIN'){
                navigate('/home');
            }else if(data.user.rol === 'SUPERVISOR'){
                navigate('/home');
            }else {
                navigate('/home');
            }
        }catch (error){
            console.error('Error completo:', error);
            setError(error.response?.data?.error || 'Error al iniciar sesión');
            toast.error('Error al iniciar sesión');
        }finally {
            setLoading(false);
        }
    };

    return (
        <Container className="d-flex justify-content-center align-items-center min-vh-100">
            <Card style={{width: '400px'}}>
                <Card.Body>
                    <Card.Title className="text-center mb-4">Iniciar Sesión</Card.Title>
                    {error && <Alert variant="danger">{error}</Alert>}

                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>Usuario</Form.Label>
                            <Form.Control 
                                type="text"
                                placeholder="Ingrese su usuario"
                                value={credentials.username}
                                onChange={(e) => setCredentials({
                                    ...credentials,
                                    username: e.target.value
                                })}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                                <Form.Label>Contraseña</Form.Label>
                                <Form.Control 
                                    type="password"
                                    placeholder="Ingrese su contraseña"
                                    value={credentials.password}
                                    onChange={(e) => setCredentials({
                                        ...credentials,
                                        password: e.target.value
                                    })}
                                    required
                                />
                        </Form.Group>

                        <Button
                            type="submit"
                            variant="primary"
                            className="w-100"
                            disabled={loading}
                        >
                            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                        </Button>
                        
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
}