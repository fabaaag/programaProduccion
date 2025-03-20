import { Link, NavLink, useNavigate } from 'react-router-dom'
import './Navbar.css'
import logavsa from './img/logavsa.png'
import { Nav, Navbar, NavDropdown, Container } from 'react-bootstrap';
import React from 'react';
import { logout } from '../../api/auth.api';
import { toast } from 'react-hot-toast';

const CompNavbar = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));

    const handleLogout = () => {
        logout();
        toast.success('Sesion cerrada correctamente');
        navigate('/login');
    };

    return (
        <Navbar variant='dark' bg='dark' expand='lg'>
            <Container>
                <Navbar.Brand href="/">
                    <img src={logavsa} alt="logo" width={30} height={30} className="d-inline-block align-top" />
                    <span className='mx-1'>Abasolo Vallejo</span>
                </Navbar.Brand>
                <Navbar.Toggle aria-controls="navbar-dark-example"/>
                <Navbar.Collapse id="navbar-dark">
                    <Nav>
                        <NavDropdown
                            id="nav-dropdown-dark"
                            title="Maestro Materiales"
                            menuVariant='dark'

                        >
                            <NavDropdown.Item href="">Productos</NavDropdown.Item>
                            <NavDropdown.Divider />
                            <NavDropdown.Item href="">Piezas</NavDropdown.Item>
                        </NavDropdown>

                        <NavDropdown
                            id="nav-dropdown-dark"
                            title="Planificación Producción"
                            menuVariant='dark'

                        >
                            <NavDropdown.Item href="/orders">Órdenes de Trabajo</NavDropdown.Item>
                            <NavDropdown.Divider />
                            <NavDropdown.Item href="/programs">Programas de Producción</NavDropdown.Item>
                            <NavDropdown.Divider />
                            <NavDropdown.Item href="/operators">Gestión de Operarios</NavDropdown.Item>
                        </NavDropdown>

                        <NavDropdown
                            id="nav-dropdown-dark"
                            title="Gestión de Máquinas"
                            menuVariant='dark'
                        >
                            <NavDropdown.Item href="/machines">Listado de Máquinas</NavDropdown.Item>
                            <NavDropdown.Divider />
                            <NavDropdown.Item href="">Evento Mantención</NavDropdown.Item> 
                        </NavDropdown>

                        <NavDropdown
                            title={user ? `${user.first_name || user.username} ` : 'Usuario'}
                            id='user-dropdown'
                            align='end'
                            menuVariant='dark'
                        >
                            <NavDropdown.Item onClick={() => navigate('/profile')}>Mi Perfil</NavDropdown.Item>
                            <NavDropdown.Divider />
                            <NavDropdown.Item onClick={handleLogout}>Cerrar Sesión</NavDropdown.Item>
                            <NavDropdown.Divider />
                            {user?.rol === 'ADMIN' && (
                                <NavDropdown.Item onClick={() => navigate('/users/manage')}>
                                    Gestión de Usuarios
                                </NavDropdown.Item>
                            )}
                        </NavDropdown>
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>



    
    )
};

export default CompNavbar;

/*
<DropdownButton title="Planificación Produccion">
                    <Dropdown.Item><Link to='/orders'>Ordenes de Trabajo</Link></Dropdown.Item>
                    <Dropdown.Item href="/">Recursos Humanos</Dropdown.Item>
                    <Dropdown.Item as="button" onClick={()=> navigate('/programs')}>Programa de Produccion</Dropdown.Item>
                </DropdownButton>
                <Link to="/clients"><Button>Clientes</Button></Link>
                <DropdownButton title="Usuario">
                    <Dropdown.Item href="/">Ingresa</Dropdown.Item>
                    <Dropdown.Item href="/">Registrate</Dropdown.Item>
                </DropdownButton>


<img onClick={()=>{toggle_mode()}} src={theme == 'light' ? toggle_light : toggle_dark} alt="" className='toggle-icon'/>*/