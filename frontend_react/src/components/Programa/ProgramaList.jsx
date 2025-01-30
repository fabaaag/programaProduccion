import { useEffect, useState } from "react";
import { getAllPrograms } from "../../api/programs.api.js";
import CompNavbar from "../Navbar/CompNavbar.jsx";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { Button } from "react-bootstrap";

export function ProgramaList(){
    const [programs, setPrograms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [theme, setTheme] = useState('light');
    const navigate = useNavigate();

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
        <div className=" ${theme}">
            <CompNavbar />
            <br />
            <div className="container">
            <div className="d-flex justify-content-between">
            <Link to="/" className="btn btn-danger my-2 mx-2">Volver al inicio</Link>
            <Link to='/programs-create' className="btn btn-success my-2 mx-2">Crear Programa</Link>
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
                                        <button className="btn btn-primary"
                                        onClick={()=>{
                                            navigate(`/programs/${program.id}`)
                                        }}
                                        >Ver</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
                
            </div>
        </div>
    )
}