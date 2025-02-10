import React, { useState} from 'react';
import { loginUser } from '..api/auth.api';
import { useNavigate } from 'react-router-dom';


export function Login(){
    const [credentials, setCredentials] = useState({
        username: '',
        password: ''
    });
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = await loginUser(credentials);
            //Redirigir segun el rol del usuario
            if(data.user.rol === 'ADMIN'){
                navigate('/admin/dashboard');
            }else if(data.user.rol === 'SUPERVISOR'){
                navigate('/supervisor/dashboard');
            }else {
                navigate('/dashboard');
            }
        }catch (error){
            console.error('Error de login:', error);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <input 
                type="text"
                placeholder="Usuario"
                onChange={(e)=> setCredentials({
                    ...credentials,
                    username: e.target.value
                })}
            />
            <input 
                type="password"
                placeholder="Contraseña"
                onChange={(e) => setCredentials({
                    ...credentials,
                    password: e.target.value
                })}
            />
            <button type="submit">Iniciar Sesión</button>
        </form>
    )
}