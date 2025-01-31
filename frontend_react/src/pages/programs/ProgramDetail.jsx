import React, { useEffect, useState } from "react";
import { useParams, Link, redirect } from "react-router-dom";
import { Button, Dropdown } from "react-bootstrap";
import { ReactSortable } from "react-sortablejs";
import CompNavbar from "../../components/Navbar/CompNavbar";
import { Footer } from "../../components/Footer/Footer";
import { getProgram, updatePriorities, deleteOrder } from "../../api/programs.api";
import Timeline from "react-calendar-timeline";
import "react-calendar-timeline/dist/Timeline.scss";

export function ProgramDetail() {
    const { programId } = useParams();
    const [programData, setProgramData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [otList, setOtList] = useState([]);
    const [timelineItems, setTimelineItems] = useState([]);
    const [showTimeline, setShowTimeline] = useState(false); // Control para mostrar el timeline
    const [timelineLoading, setTimelineLoading] = useState(false);
    const [timelineGroups, setTimelineGroups] = useState([]);

    const [expandedOTs, setExpandedOTs] = useState({});
    const [maquinas, setMaquinas] = useState([]);

    const handleToggleExpand = (otId) => {
        setExpandedOTs((prevExpanded) => ({
            ...prevExpanded,
            [otId]: !prevExpanded[otId]
        }));
    };

    const handleProcessUpdate = (otId, procesoId, field, value) => {
        console.log(`Actualizando OT: ${otId}, Proceso: ${procesoId}, Campo: ${field}, Valor: ${value}`);

        setOtList(prevOtList => prevOtList.map(ot => {
            if (ot.orden_trabajo === otId){
                return{
                    ...ot,
                    procesos: ot.procesos.map(proceso => {
                        if (proceso.id === procesoId){
                            return {
                                ...proceso,
                                [field]: value
                            };
                        }
                        return proceso;
                    })
                }
            }
            return ot;
        }));
    };
    

    const toggleTimeline = () => {
        if (!showTimeline) {
            setTimelineLoading(true);
            setTimeout(() => setTimelineLoading(false), 1000); // Simula carga
        }
        setShowTimeline(!showTimeline);
    };

    

    


    useEffect(() => {
        if (!programId) {
            console.error("No se proporcionó un programId");
            return;
        }
    
        const fetchProgramData = async () => {
            setLoading(true);
            try {
                const response = await getProgram(programId);
                console.log("Respuesta completa: ", response);
                console.log("Ordenes de trabajo: ", response.ordenes_trabajo);

                // Actualizar los datos generales del programa
                setProgramData(response.program || {});
                setOtList(response.ordenes_trabajo || []);

                console.log("Estado otList: ", otList);
    
                // Validar y procesar los datos de las rutas
                if (response.routes_data && typeof response.routes_data === "object") {
                    const { groups, items } = response.routes_data;
    
                    // Validar grupos y convertirlos si están disponibles
                    if (Array.isArray(groups)) {
                        const processedGroups = groups.map(ot => ({
                            id: ot.id,
                            title: ot.orden_trabajo_codigo_ot || "OT Sin código",
                            stackItems: true,
                            height: 50,
                            subgroups: ot.procesos?.map(proceso =>({
                                id: `${ot.id}-${proceso.id}`,
                                title: proceso.descripcion,
                                parent:ot.id,
                                height: 30,
                            })) || []
                        }));

                        //Aplanar la estructura para el Timeline
                        const flatGroups = processedGroups.reduce((acc, group)=>{
                            acc.push({
                                id: group.id,
                                title: group.title,
                                height: group.height,
                                stackItems: true
                            });
                            group.subgroups.forEach(subgroup => {
                                acc.push({
                                    id: subgroup.id,
                                    title: subgroup.title,
                                    parent: subgroup.parent,
                                    height: subgroup.height
                                });
                            });
                            return acc;
                        }, []);
                        setTimelineGroups(flatGroups);
                    } 
    
                    // Procesar elementos de rutas
                    if (Array.isArray(items)) {
                        const timelineItems = items.map((item) => ({
                            id: item.id,
                            group: `${item.ot_id}-${item.proceso_id}`,
                            title: item.name || item.title || "Sin texto",
                            start_time: new Date(item.start || item.start_time),
                            end_time: new Date(item.end || item.end_time),
                            itemProps: {
                                style: {
                                    backgroundColor: new Date(item.end || item.end_time) < new Date() ? "#ff4444" : "#4CAF50",
                                    color: 'white',
                                    borderRadius: '4px',
                                    padding: '2px 6px'
                                },
                            },
                            canMove: true,
                            canResize: false,
                        }));
                        console.log("Timeline Items: ", timelineItems);
                        console.log("Timeline Groups: ", timelineGroups);
    
                        setTimelineItems(timelineItems);
                    }
                }
            } catch (error) {
                console.error("Error al cargar detalles del programa:", error);
            } finally {
                setLoading(false);
            }
        };
    
        fetchProgramData();
    }, [programId]);
    
    const handleDeleteOrder = async (orderId) => {
        console.log(orderId, programId);
        if(window.confirm("¿Estás seguro que deseas eliminar esta orden de trabajo?")){
            setLoading(true);
            try{
                const result = await deleteOrder(programId, orderId);
                if(result && result.deleted > 0){
                setOtList(otList.filter((ot) => ot.orden_trabajo !== orderId));
                console.log("Orden de trabajo eliminada exitósamente.");
                }else{
                    console.error("Error al eliminar la orden de trabajo:", result);
                    alert("No se pudo eliminar la orden de trabajo");
                }
            }catch(error){
                console.error("Error al eliminar la orden de trabajo:", error);
                alert(error.message ||"Error al eliminar la orden de trabajo");
            }finally{
                setLoading(false);
            }
        }
    };

    const handleOtReorder = (newOtList) => {
        console.log("Nueva lista recibida: ", newOtList);
        setOtList(newOtList);

        const updatedGroups = newOtList.flatMap(ot => {
            const mainGroup = {
                id: `ot_${ot.orden_trabajo}`,
                title: ot.orden_trabajo_codigo_ot,
                height: 50,
                stackItems: true
            };

            const processGroups = ot.procesos.map(proceso => ({
                id: `${mainGroup.id}-${proceso.id}`,
                title: proceso.descripcion,
                parent: mainGroup.id,
                height: 30
            }));

            return [mainGroup, ...processGroups];
        });

        setTimelineGroups(updatedGroups);

        const orderIds = newOtList.map((ot, index) => ({
                id: ot.orden_trabajo,
                priority: index + 1
        })).filter(item => item !== null);

        console.log("Actualizando prioridades: ", orderIds);
        setLoading(true);

        updatePriorities(programId, orderIds)
            .then((response) => {
                console.log("Prioridades actualizadas:", response);

                if (response.routes_data?.items) {
                    const serverItems = response.routes_data.items.map(item => ({
                        id: item.id,
                        group: `${item.ot_id}-${item.proceso_id}`,
                        title: `${item.name} (Restantes: ${item.unidades_restantes})`,
                        start_time: new Date(item.start_time + 'Z'),  // Añadimos Z para asegurar que se interprete en UTC
                        end_time: new Date(item.end_time + 'Z'),      // Añadimos Z para asegurar que se interprete en UTC
                        itemProps: {
                            style: {
                                backgroundColor: '#4CAF50',
                                color: 'white',
                                borderRadius: '4px',
                                padding: '2px 6px',
                                opacity: 1 - (item.unidades_restantes / item.cantidad_total)
                            }
                        }
                    }));
                    setTimelineItems(serverItems);
                }
            })
            .catch((error) => {
                console.error("Error al actualizar prioridades", error);
                alert("Error al actualizar el orden de las OTs");
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const renderOt = (ot) => {
        console.log("Renderizando OT: ", ot);
        if (!ot) return null;
        return (
            <div
                key={ot.orden_trabajo}
                className="list-group-item"
                style={{
                    border: "1.5px solid",
                    borderRadius: "5px",
                    backgroundColor: "lavender",
                    padding: "10px",
                    textAlign: "center",
                    marginBottom: "5px",
                }}
            >
                <div className="d-flex justify-content-between align-items-center">
                    <span>
                        {ot.orden_trabajo_codigo_ot || "Sin código"} -{" "}
                        {ot.orden_trabajo_descripcion_producto_ot || "Sin descripción"} -{" "}
                        {ot.orden_trabajo_fecha_termino || "Sin fecha"}
                    </span>
                    <button 
                    className="btn btn-outline-primary"
                    onClick={() => handleToggleExpand(ot.orden_trabajo)}
                    >
                        {expandedOTs[ot.orden_trabajo] ? "Ocultar" : "Expandir"}
                    </button>
                </div>
                {/*Contenido expandible */}
                {expandedOTs[ot.orden_trabajo] && (
                <div className="mt-3">
                    <table className="table table-bordered">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Proceso</th>
                                <th>Máquina</th>
                                <th>Cantidad</th>
                                <th>Estandar</th>
                            </tr>
                        </thead>
                        <tbody>
                            {console.log("Procesos de la OT: ", ot.procesos)}
                            {ot.procesos?.map((proceso) => (
                                <tr key={proceso.id}>
                                    <td>{proceso.item}</td>
                                    <td>
                                        <input 
                                        type="text" 
                                        className="form-control" 
                                        value={`${proceso.codigo_proceso} - ${proceso.descripcion}`}
                                        disabled
                                        />
                                    </td>
                                    <td>
                                        <select 
                                        className="form-control" 
                                        value={`${proceso.maquina_id}`}
                                        onChange={(e) => handleProcessUpdate(
                                            ot.orden_trabajo,
                                            proceso.id,
                                            "maquina",
                                            e.target.value
                                            
                                        )}
                                        >
                                            {maquinas.map(maquina => (
                                                <option key={maquina.id} value={maquina.id}>
                                                    {maquina.descripcion}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                    <td>
                                        <input 
                                        type="number" 
                                        className="form-control"
                                        value={proceso.cantidad} 
                                        onChange={(e) => handleProcessUpdate(
                                            ot.orden_trabajo,
                                            proceso.id,
                                            'cantidad',
                                            parseInt(e.target.value, 10)
                                        )}
                                        />
                                    </td>
                                    <td>
                                        <input 
                                        type="number" 
                                        className="form-control"
                                        value={proceso.estandar}
                                        onChange={(e) => handleProcessUpdate(
                                            ot.orden_trabajo,
                                            proceso.id,
                                            'estandar',
                                            parseInt(e.target.value, 10)
                                        )}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                )}
            </div>
        )
    };
        

    if (loading) return <p>Cargando detalles del programa...</p>;
    if (!programData) return <p>No se encontró el programa.</p>;

    return (
        <div>
            <CompNavbar />
            <br />
            <div className="container">
                <div className="d-flex justify-content-between">
                    <Link to="/programs" className="btn btn-primary">
                        Volver a Programas
                    </Link>
                </div>
                <h1 className="display-4 text-center mb-4">
                    Detalles del Programa: {programData?.nombre}
                </h1>
                <span className="d-flex justify-content-evenly">
                    <p>Fecha Inicio: {programData?.fecha_inicio}</p>
                    <p>Fecha Término: {programData?.fecha_fin}</p>
                </span>
                <section
                    className="container-section container-fluid border py-2 mb-2"
                    style={{ borderRadius: "5px" }}
                >
                    <h2>Órdenes de Trabajo:</h2>
                    <div>
                        {otList && otList.length > 0 ? (
                            <ReactSortable
                                list={otList}
                                setList={setOtList}
                                onEnd={(evt) => {
                                    const newOtList = [...otList];
                                    const movedItem = newOtList.splice(evt.oldIndex, 1)[0];
                                    newOtList.splice(evt.newIndex, 0, movedItem);
                                    handleOtReorder(newOtList);
                                }}
                            >
                                {otList.map((ot) => renderOt(ot))}
                            </ReactSortable>
                        ) : (
                            <p>No hay OTs asignadas a este programa.</p>
                        )}
                    </div>
                    <Button variant="success" onClick={toggleTimeline} className="mt-3" disabled={timelineLoading}>
                        {timelineLoading
                            ? "Cargando Proyección..."
                            : showTimeline
                            ? "Ocultar Proyección"
                            : "Proyectar en Timeline"}
                    </Button>
                </section>

                {showTimeline && (
                    <div className="timeline-container mt-4 mb-4" style={{ width: "100%" }}>
                        <Timeline
                            groups={timelineGroups}
                            items={timelineItems}
                            defaultTimeStart={new Date()}
                            defaultTimeEnd={new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000)}
                            lineHeight={50}
                            stackItems
                            sidebarWidth={200}
                            canMove={false}
                            canResize={false}
                            groupRenderer={({ group }) => (
                                <div style={{
                                    padding: "5px",
                                    backgroundColor: group.parent ? "#f0f0f0" : "#e0e0e0"
                                }}>
                                    {group.title}
                                </div>
                            )}
                        />
                    </div>
                )}
            </div>

            <Footer/>
        </div>
    );
}
