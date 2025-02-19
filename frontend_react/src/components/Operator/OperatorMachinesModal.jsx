import { Modal, Table } from 'react-bootstrap';

export function OperatorMachinesModal({ show, handleClose, operator }) {
    return (
        <Modal show={show} onHide={handleClose} size='lg'>
            <Modal.Header closeButton>
                <Modal.Title>Maquinas asignadas a {operator?.nombre}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Table striped bordered hover responseive>
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>Descripción</th>
                            <th>Tipo</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {operator?.maquinas?.map(maquina => (
                            <tr key={maquina.id}>
                                <td>{maquina.codigo_maquina}</td>
                                <td>{maquina.descripcion}</td>
                                <td>{maquina.tipo_maquina}</td>
                                <td>
                                    <span className={`badge ${maquina.activo ? 'bg-success' : 'bg-danger'}`}>
                                        {maquina.activo ? 'Activa' : 'Inactiva'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
                {operator?.maquinas?.length === 0 && (
                    <div className="text-center py-3">
                        <p>Este operador no tiene máquinas asignadas</p>
                    </div>
                )}
            </Modal.Body>
        </Modal>
    )
}