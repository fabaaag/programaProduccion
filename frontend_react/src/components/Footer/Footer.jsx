import React from 'react';
import { Container, Row, Col, Stack, Image, Nav, NavLink} from 'react-bootstrap';
import logavsa from './img/logavsa.png'


export function Footer() {
  return (
    <div>
        <footer>
            <Container fluid>
                <Row className="bg-dark text-white p-4">
                    <Col className="mx-5">
                        <Stack>
                            <Image src={logavsa} alt='company logo' rounded width={150} height={150}/>
                            <h2>Abasolo Vallejo</h2>
                            
                        </Stack>
                    </Col>
                    <Col>
                        
                    </Col>
                    <Col>
                        
                    </Col>
                </Row>
            </Container>
        </footer>
    </div>
  )
}

