import CompNavbar from '../components/Navbar/CompNavbar';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom'
import { Button, Card } from "react-bootstrap";
import { Footer } from "../components/Footer/Footer"

export function HomePage() {
    const navigate = useNavigate();
  return (
    <div className={``}>
        <CompNavbar />
        <h1 className="display-4 text-center mb-4">AVSA</h1>
        <hr />
        <div className="container-fluid border-bottom-1">
          <div className="col md-12 d-flex justify-content-evenly">
            <Card style={{width:"18rem"}}>
              <Card.Img variant='top' src='#' />
              <Card.Body>
                <Card.Title>Planificación</Card.Title>
                <Card.Text>Redirige a la página de programas de producción</Card.Text>
                <div className="container d-flex justify-content-center">
                  <Button variant='primary' onClick={()=>{
                      navigate('/programs')
                    }}>Ir</Button>
                </div>
              </Card.Body>
            </Card>
            <Card style={{width:"18rem"}}>
              <Card.Img variant='top' src='#' />
              <Card.Body>
                <Card.Title>M. Materiales/Diagnosticomaqs</Card.Title>
                <Card.Text>Redirige a la página de diagns</Card.Text>
                <div className="container d-flex justify-content-center">
                  <Button variant='primary' onClick={()=>{
                      navigate('/machines-diagnostico')
                    }}>Ir</Button>
                </div>
              </Card.Body>
            </Card>
          </div>
          <br />
          <div className="col md-12 d-flex justify-content-evenly">
            <Card style={{width:"18rem"}}>
              <Card.Img variant='top' src='#' />
              <Card.Body>
                <Card.Title>Gestión</Card.Title>
                <Card.Text>Redirige a la página de gestion de personal</Card.Text>
                <div className="container d-flex justify-content-center">
                  <Button variant='primary' onClick={()=>{
                    navigate('/operators')
                  }}>Ir</Button>
                </div>
              </Card.Body>
            </Card>
            <Card style={{width:"18rem"}}>
              <Card.Img variant='top' src='#' />
              <Card.Body>
                <Card.Title>Máquinas</Card.Title>
                <Card.Text>Redirige a la página de programas de producción</Card.Text>
                <div className="container d-flex justify-content-center">
                  <Button variant='primary' onClick={()=>{
                      navigate('/programs')
                    }}>Ir</Button>
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>
        <hr />
        <div style={{}}>
          <Footer/>
        </div>
    </div>
    
  )
}
