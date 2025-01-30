import { Link, NavLink, useNavigate } from 'react-router-dom'
import './Navbar.css'
import logavsa from './img/logavsa.png'
import { Nav, Navbar, NavDropdown, Container } from 'react-bootstrap';
import React from 'react';

const CompNavbar = () => {
    const navigate = useNavigate();

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
                            <NavDropdown.Item href="">Gestión de Operarios</NavDropdown.Item>
                        </NavDropdown>

                        <NavDropdown
                            id="nav-dropdown-dark"
                            title="Gestión de Máquinas"
                            menuVariant='dark'
                        >
                            <NavDropdown.Item href="">Listado de Máquinas</NavDropdown.Item>
                            <NavDropdown.Divider />
                            <NavDropdown.Item href="">Evento Mantención</NavDropdown.Item> 
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