import { useEffect, useState } from "react";
import { getAllPrograms, deleteProgram } from "../../api/programs.api.js";
import CompNavbar from "../Navbar/CompNavbar.jsx";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { Button, Modal } from "react-bootstrap";
import { toast } from "react-hot-toast";

export function ProgramaList(){
    const [programs, setPrograms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [theme, setTheme] = useState('light');
    const navigate = useNavigate();

    const [showDeleteButtons, setShowDeleteButtons] = useState(false);
    const [showDeleteModal, setShowDeleteModal]  = useState(false);
    const [programToDelete, setProgramToDelete] = useState(null);

    const handleDelete = async (programId) => {
        try{
            await deleteProgram(programId);
            setPrograms(programs.filter(program => program.id !== programId));
            toast.success('Programa eliminado correctamente');
        }catch(error){
            console.error('Error al eliminar el programa:', error);
            toast.error('Error al eliminar el programa');
        }
        setShowDeleteModal(false);
    };


    useEffect(() => {
        async function loadPrograms(){
            try{
                setLoading(true);
                const res = await getAllPrograms();
                setPrograms(res.data);
            }catch(error){
                console.error(`Error al cargar los programas: ${error}`);
                alert(`Error al cargar los programas: ${error.message}`);
            }finally{
                setLoading(false);
            }
        }
        loadPrograms();
    }, []);

    if (loading) return <p>Cargando Programas de Producción</p>;

    return(
        <div className="">
            <CompNavbar />
            <br />
            <div className="container">
            <div className="d-flex justify-content-between">
                <Button onClick={() => navigate('/')} variant="outline-primary" className="my-2 mx-2">Volver al inicio</Button>
                <div>
                    <Button
                        variant={showDeleteButtons ? 'secondary' : 'danger'}

                        onClick={() => setShowDeleteButtons(!showDeleteButtons)}
                        className="me-2"
                    >
                        {showDeleteButtons ? 'Cancelar' : 'Gestionar Programas'}
                    </Button>
                    <Link to='/programs-create' className="btn btn-success my-2 mx-2">Crear Programa</Link>
                </div>
            </div>
            <h1 className="display-4 text-center mb-4">Programas Producción</h1>
                <section className="">
                    <table className="table table-hover mt-1">
                        <thead>
                            <tr className={theme == 'light' ? "table-dark" : "table-primary"}>
                                <th>ID</th>
                                <th>Nombre</th>
                                <th>Fecha Inicio</th>
                                <th>Fecha Término</th>
                                <th>-</th>
                            </tr>
                        </thead>
                        <tbody>
                            {programs.map(program=>(
                                <tr key={program.id}>
                                    <td>{program.id}</td>
                                    <td>{program.nombre}</td>
                                    <td>{program.fecha_inicio}</td>
                                    <td>{program.fecha_fin}</td>
                                    <td>
                                        <div className="d-flex gap-2">
                                        <button className="btn btn-primary"
                                        onClick={()=>{
                                            navigate(`/programs/${program.id}`)
                                        }}
                                        >Ver</button>
                                        {showDeleteButtons && (
                                            <button
                                                className="btn btn-danger"
                                                onClick={()=>{
                                                    setShowDeleteModal(true);
                                                    setProgramToDelete(program);
                                                }}
                                            >
                                                Eliminar
                                            </button>
                                        )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
                {/* Modal de eliminación */}
                <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
                    <Modal.Header>
                        <Modal.Title>Confirmar Eliminación</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        ¿Estás seguro de que deseas eliminar el programa "{programToDelete?.nombre}"?
                        <br />
                        <small className="text-danger">Esta acción no se puede deshacer.</small>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                            Cancelar
                        </Button>
                        <Button variant="danger" onClick={() => handleDelete(programToDelete.id)}>  
                            Eliminar
                        </Button>
                    </Modal.Footer>
                </Modal>


            </div>
        </div>
    )
}