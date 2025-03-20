import React, { useEffect, useState } from "react";
import { useParams, Link, redirect } from "react-router-dom";
import { Button, Dropdown, Form } from "react-bootstrap";
import { ReactSortable } from "react-sortablejs";
import CompNavbar from "../../components/Navbar/CompNavbar";
import { Footer } from "../../components/Footer/Footer";
import { getProgram, updatePriorities, deleteOrder, getMaquinas, generateProgramPDF, getProcesoTimeline } from "../../api/programs.api";
import { getAllOperators, getOperadoresPorMaquina } from "../../api/operator.api";
import { crearAsignacion, obtenerAsignacionesPrograma } from "../../api/asignaciones.api";
import Timeline from "react-calendar-timeline";
import "react-calendar-timeline/dist/Timeline.scss";
import { toast } from "react-hot-toast";
import moment from "moment";
import { OperadorSelectionModal } from '../../components/Programa/OperadorSelectionModal';
import { LoadingSpinner } from "../../components/UI/LoadingSpinner/LoadingSpinner";

export function ProgramDetail() {
    const { programId } = useParams();
    const [programData, setProgramData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [overlayLoading, setOverlayLoading] = useState(false);
    const [otList, setOtList] = useState([]);
    const [timelineItems, setTimelineItems] = useState([]);
    const [showTimeline, setShowTimeline] = useState(false); // Control para mostrar el timeline
    const [timelineLoading, setTimelineLoading] = useState(false);
    const [timelineGroups, setTimelineGroups] = useState([]);

    const [expandedOTs, setExpandedOTs] = useState({});
    const [maquinas, setMaquinas] = useState([]);

    const [pendingChanges, setPendingChanges] = useState({});
    const [savingChanges, setSavingChanges] = useState(false);
    const [operadores, setOperadores] = useState([]);
    const [maquinasPorProceso, setMaquinasPorProceso] = useState({});

    const [operadoresPorMaquina, setOperadoresPorMaquina] = useState({});

    // Añadir estados para el modal
    const [showOperadorModal, setShowOperadorModal] = useState(false);
    const [currentProceso, setCurrentProceso] = useState(null);

    // Para controlar la visibiidad de la alerta de cambios pendientes
    const [showPendingChangesAlert, setShowPendingChangesAlert] = useState(false);

    const cargarOperadoresPorMaquina = async (procesoId, maquinaId) => {
        try {
            console.log(`[Frontend] Cargando operadores para máquina ID: ${maquinaId}`);
            const operadoresData = await getOperadoresPorMaquina(maquinaId);
            console.log(`[Frontend] Operadores recibidos para máquina ${maquinaId}:`, operadoresData);

            setOperadoresPorMaquina(prev => ({
                ...prev,
                [procesoId]: operadoresData
            }));

            return operadoresData;
        } catch (error) {
            console.error('Error al cargar operadores para la máquina:', error);
            toast.error('Error al cargar operadores disponibles');
            return [];
        }
    };

    //Agregar función para cargar máquinas por proceso
    const cargarMaquinasPorProceso = async (itemRuta) => {
        try{
            console.log("[Frontend] itemRuta completo:", itemRuta);

            //Verificar si el objecto tiene la propiedad codigo_proceso
            if(!itemRuta || !itemRuta.codigo_proceso){
                console.error("[Frontend] Error: itemRuta no tiene codigo_proceso", itemRuta);
                return [];
            }
            const codigoProceso = itemRuta.codigo_proceso;
            console.log(`[Frontend] Código de proceso extraído: ${codigoProceso}`);

            //Verificar que el código de proceso no sea null o undefined
            if(!codigoProceso){
                console.error('[Frontend] No se encontró código de proceso para el item:', itemRuta);
                return [];
            }
            console.log(`[Frontend] Llamando a getMáquinas con programId=${programId}, procesoCodigo=${codigoProceso} `);
            const maquinasData = await getMaquinas(programId, codigoProceso);

            console.log(`[Frontend] Máquinas recibidas para proceso ${codigoProceso}:`, maquinasData);
            setMaquinasPorProceso(prev => ({
                ...prev,
                [itemRuta.id]: maquinasData
            }));
            return maquinasData;
        } catch(error) {
            console.error('Error al cargar máquinas para el proceso:', error);
            toast.error("Error al cargar máquinas disponibles");
            return [];
        }
    };

    const handleProcessChange = (otId, procesoId, field, value) => {
        if(!otList){
            console.error('otList no está inicializado.');
            return;
        }
    
        console.log(`Cambio pendiente en OT: ${otId}, Proceso: ${procesoId}, Campo: ${field}, Valor: ${value}`);

        // Si el campo es maquina_id y tiene un valor, cargar operadores para esa máquina
        if(field === 'maquina_id' && value){
            cargarOperadoresPorMaquina(procesoId, value);
        }
    
        setOtList(prevOtList => {
            if(!prevOtList) return [];  // Retornamos array vacío si es undefined
    
            const newList = prevOtList.map(ot => {
                if(ot.orden_trabajo === otId && ot.procesos){
                return{
                    ...ot,
                    procesos: ot.procesos.map(proceso => {
                            if(proceso.id === procesoId){
                            return {
                                ...proceso,
                                [field]: value
                            };
                        }
                        return proceso;
                    })
                    };
                }
                return ot;
            });
            return newList;
        });

        setPendingChanges(prev => {
            const newChanges = {
                ...prev,
                [`${otId}-${procesoId}-${field}`]: {
                    otId,
                    procesoId,
                    field,
                    value
                }
            };
            console.log('Cambios pendientes:', newChanges);
            //Mostrar la alerta si hay cambios pendientes
            setShowPendingChangesAlert(true);

            return newChanges;
        });
    };

    const handleSaveChanges = async () => {
        try {
            setSavingChanges(true);
            setOverlayLoading(true);
            console.log("Guardando cambios:", pendingChanges);
            
            // Procesar asignaciones
            const asignacionKeys = Object.keys(pendingChanges).filter(key => key.includes('_asignacion'));
            
            if (asignacionKeys.length > 0) {
                for (const key of asignacionKeys) {
                    const procesoId = key.split('_')[0]; // Extraer el ID del proceso
                    
                    // Encontrar el proceso correspondiente
                    let procesoEncontrado = null;
                    for (const ot of otList) {
                        for (const proceso of ot.procesos) {
                            if (proceso.id.toString() === procesoId) {
                                procesoEncontrado = proceso;
                                break;
                            }
                        }
                        if (procesoEncontrado) break;
                    }
                    
                    if (procesoEncontrado) {
                        try {
                            console.log("Guardando asignación para proceso:", procesoEncontrado);
                            const asignacionData = pendingChanges[key];
                            // Llamar a handleOperadorChange con saveImmediately=true
                            await handleOperadorChange(
                                procesoEncontrado, 
                                asignacionData.operador, 
                                true
                            );
                        } catch (error) {
                            console.error("Error al crear asignación:", error);
                            throw error;
                        }
                    } else {
                        console.error(`No se encontró el proceso con ID ${procesoId}`);
                    }
                }
            }

            //Procesar cambios en procesos (estandar, cantidad, maquina)
            const procesosConCambios = {};

            //Agrupar cambios por ot y proceso
            Object.keys(pendingChanges).forEach(key => {
                if (!key.includes('_asignacion')){
                    const [otId, procesoId, field] = key.split('-');

                    if (!procesosConCambios[otId]){
                        procesosConCambios[otId] = {};
                    }

                    if (!procesosConCambios[otId][procesoId]) {
                        procesosConCambios[otId][procesoId] = {};
                    }

                    procesosConCambios[otId][procesoId][field] = pendingChanges[key].value;
                }
            });

            
            // Procesar cambios de prioridad
            const orderIds = otList.map((ot, index) => {
                const procesos = [];

                if (procesosConCambios[ot.orden_trabajo]){
                    Object.keys(procesosConCambios[ot.orden_trabajo]).forEach(procesoId => {
                        procesos.push({
                            id: parseInt(procesoId),
                            ...procesosConCambios[ot.orden_trabajo][procesoId]
                        });
                    });
                }

                return {
                    id: ot.orden_trabajo,
                    priority: index + 1 ,
                    procesos: procesos.length > 0 ? procesos: undefined
                }
            });
            
            if (orderIds.length > 0) {
                console.log("Actualizando prioridades:", orderIds);
                await updatePriorities(programId, orderIds, true);
            }
            
            // Limpiar cambios pendientes
            setPendingChanges({});

            //Ocultar la alerta después de guardar
            setShowPendingChangesAlert(false);
            
            // Recargar datos
            await fetchProgramData();
            
            toast.success("Cambios guardados correctamente");
        } catch (error) {
            console.error("Error al guardar los cambios:", error);
            toast.error(`Error al guardar los cambios: ${error.message}`);
        } finally {
            setSavingChanges(false);
        }
    };

    const handleToggleExpand = async(otId) => {
        const expandiendo = !expandedOTs[otId];
        setExpandedOTs((prevExpanded) => ({
            ...prevExpanded,
            [otId]: expandiendo
        }));

        //Si estamos expandiendo, cargar las máquinas para cada proceso
        if(expandiendo){
            const ot = otList.find(ot => ot.orden_trabajo === otId);
            if (ot && ot.procesos){ 
                for (const proceso of ot.procesos) { 
                    if(!maquinasPorProceso[proceso.id]){
                        await cargarMaquinasPorProceso(proceso);
                    }
                }
            }
        }
    };

    const toggleTimeline = () => {
        if (hayProcesosConEstandarCero()) {
            const procesosConEstandarCero = getProcesosConEstandarCero();

            toast.error(
                <div>
                    <p>No se puede proyectar: Hay procesos con estándar en 0</p>
                    <ul style={{ maxHeight: '200px', overflowY: 'auto', padding: '0 0 0 20px'}}>
                        {procesosConEstandarCero.map((p, idx) => (
                            <li key={idx}>{p.ot_codigo} - {p.proceso_descripcion}</li>
                        ))}
                    </ul>
                    <p>Por favor, corrija los valores antes de proyectar.</p>
                </div>,
                { duration: 5000 }
            );
            return; //Salimos de la función sin cambiar el estado del timeline
        }

        //Solo llegamos aquí si no hay procesos con estándar en 0
        if (!showTimeline) {
            setTimelineLoading(true);
            setTimeout(() => setTimelineLoading(false), 1000); // Simula carga
        }
        setShowTimeline(!showTimeline);
    };


    const fetchData = async () => {
        if(!programId){
            console.error("No hay programId disponible");
            return;
        }
        try{
            const maquinasData = await getMaquinas(programId);
            
            setMaquinas(maquinasData);

            const operadoresData = await getAllOperators();
            
            setOperadores(operadoresData);
            
        }catch(error){
            console.error("Error al cargar datos:", error);
            toast.error("Error al cargar las maquinas y operadores");
        }
    };

    const fetchProgramData = async () => {
        setLoading(true);
        try {
            const response = await getProgram(programId);
            console.log("Datos recibidos del backend:", response.data);
            

            console.log("=== DATOS DEL PROGRAMA RECIBIDOS ===");
            console.log("Programa:", response);

            // Actualizar los datos generales del programa
            setProgramData(response.program || {});

            // Procesar las órdenes de trabajo y sus asignaciones
            const ordenesTrabajo = response.ordenes_trabajo || [];
            setOtList(ordenesTrabajo.map(ot => ({
                ...ot,
                procesos: ot.procesos.map(proceso => ({
                    ...proceso,
                    //Agregar información de asignación si existe
                    operador_id: proceso.asignacion?.operador_id || null,
                    operador_nombre: proceso.asignacion?.operador_nombre || null,
                    fecha_inicio: proceso.asignacion?.fecha_inicio || null,
                    fecha_fin: proceso.asignacion?.fecha_fin || null,
                }))
            })));

            // Validar y procesar los datos del timeline
            if (response.routes_data && typeof response.routes_data === "object") {
                console.log("=== DATOS DE RUTAS RECIBIDOS ===");
                console.log("Grupos:", response.routes_data.groups);
                console.log("Items:", response.routes_data.items);
                const { groups, items } = response.routes_data;

                // Validar grupos y convertirlos si están disponibles
                if (Array.isArray(groups)) {
                    const processedGroups = groups.map(ot => ({
                        id: ot.id,
                        title: ot.orden_trabajo_codigo_ot || "OT Sin código",
                        stackItems: false,
                        height: 70,
                        subgroups: ot.procesos?.map(proceso =>({
                            id: `${ot.id}-${proceso.id}`,
                            title: proceso.descripcion,
                            parent:ot.id,
                            height: 50,
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
                                padding: '2px',
                                marginBottom: '10px',    
                            },
                        },
                        canMove: true,
                        canResize: false,
                    }));
                    setTimelineItems(timelineItems);
                }
            }

            //Procesar las asignaciones si existen
            if(response.ordenes_trabajo){
                console.log("OT con asignaciones:", response.ordenes_trabajo);
            }
        } catch (error) {
            console.error("Error al cargar detalles del programa:", error);
            toast.error("Error al cargar los datos");
        } finally {
            setLoading(false);
        }
    };

    useEffect(()=> {  
        fetchData();
    }, [programId])

    useEffect(() => {
        if (!programId) {
            console.error("No se proporcionó un programId");
            return;
        }
        fetchProgramData();
    }, [programId]);

    const handleOperadorChange = async (proceso, operadorId, saveInmediately = true) => {
        if (!programId) {
            console.error('No hay programId disponible');
            return;
        }
            
        console.log(`Asignando operador ${operadorId} al proceso ${proceso.id}`);
        console.log(`programId: ${programId}, tipo: ${typeof programId}`);

        // Si operadorId es null, estamos desasignando
        const isRemoving = operadorId === null;

        try {
            // Actualizar el estado local primero para UI responsiva
            setOtList(prevOtList => {
                return prevOtList.map(ot => {
                    if (ot.procesos) {
                        return {
                            ...ot,
                            procesos: ot.procesos.map(p => {
                                if (p.id === proceso.id) {
                                    return {
                                        ...p,
                                        operador_id: operadorId,
                                        operador_nombre: isRemoving ? null : 
                                            operadores.find(op => op.id.toString() === operadorId.toString())?.nombre || 'Operador asignado',
                                        asignacion: isRemoving ? null : { 
                                            id: p.asignacion?.id || 'temp', 
                                            fecha_asignacion: new Date().toISOString() 
                                        }
                                    };
                                }
                                return p;
                            })
                        };
                    }
                    return ot;
                });
            });

            if (saveInmediately) {
                let fechaInicio, fechaFin;

                // Si estamos desasignando, no necesitamos obtener las fechas
                if (!isRemoving) {
                    try {
                        // Obtener las fechas del timeline desde el backend
                        const timelineData = await getProcesoTimeline(programId, proceso.id);
                        console.log("Datos de timeline recibidos:", timelineData);

                        fechaInicio = timelineData.fecha_inicio;
                        fechaFin = timelineData.fecha_fin;
                    } catch (error) {
                        console.warn("Error al obtener fechas del timeline:", error);
                        
                        // Si hay error, buscar el item en el timeline local
                        const timelineItem = timelineItems.find(item => {
                            // Extraer el proceso_id del group (formato: "ot_X-Y" donde Y es el proceso_id)
                            const groupParts = item.group.split('-');
                            const procesoIdFromGroup = parseInt(groupParts[groupParts.length - 1]);
                            return procesoIdFromGroup == parseInt(proceso.id);
                        });

                        if (timelineItem) {
                            console.log("Item del timeline encontrado:", timelineItem);
                            fechaInicio = timelineItem.start_time;
                            fechaFin = timelineItem.end_time;
                        } else {
                            console.warn("No se encontró el item del timeline para este proceso.");
                            // Si no se encuentra el item en el timeline, usar fechas predeterminadas.
                            fechaInicio = new Date();
                            fechaFin = new Date(fechaInicio);
                            fechaFin.setHours(fechaFin.getHours() + 8);
                        }
                    }
                }

                // Convertir fechas a formato ISO pero con la zona horaria de Chile
                const formatearFechaChile = (fecha) => {
                    if (!(fecha instanceof Date)) {
                        fecha = new Date(fecha);
                    }
                    
                    // Obtener el offset de Chile (UTC-3 o UTC-4 dependiendo del horario de verano)
                    // Chile está en UTC-3 durante el horario de verano y UTC-4 durante el horario estándar
                    const offsetChile = -3; // Horario de verano (ajustar según corresponda)
                    
                    // Crear una nueva fecha con el offset de Chile
                    const fechaChile = new Date(fecha.getTime());
                    const offsetActual = fecha.getTimezoneOffset() / 60;
                    const diferenciaOffset = offsetActual + offsetChile;
                    
                    // Ajustar la fecha según la diferencia de offset
                    fechaChile.setHours(fecha.getHours() + diferenciaOffset);
                    
                    // Formatear la fecha en formato ISO sin la Z al final (que indica UTC)
                    const fechaISO = fechaChile.toISOString().slice(0, 19);
                    
                    // Agregar el offset de Chile manualmente
                    return `${fechaISO}-03:00`;
                };

                console.log("Fechas para asignación:", {
                    inicio: fechaInicio,
                    fin: fechaFin
                });

                const asignacionData = {
                    programa_id: parseInt(programId),
                    item_ruta_id: proceso.id,
                    operador_id: operadorId,
                    fecha_inicio: formatearFechaChile(fechaInicio),
                    fecha_fin: formatearFechaChile(fechaFin),
                    is_removing: isRemoving
                };

                console.log("Datos de asignación formateados:", asignacionData);

                // Llamar al endpoint para asignar/desasignar operador
                const resp_asignacion = await crearAsignacion(asignacionData);
                console.log("Respuesta de la asignación:", resp_asignacion);

                toast.success(isRemoving ? 'Operador desasignado correctamente' : 'Operador asignado correctamente');

                // Actualizar la vista con los datos actualizados
                await fetchData();
            }
        } catch (error) {
            console.error('Error al asignar/desasignar operador:', error);
            toast.error(isRemoving ? 'Error al desasignar operador' : 'Error al asignar operador');
            
            // Revertir cambios en UI en caso de error
            await fetchData();
        }
    };

    // Función para abrir el modal
    const openOperadorModal = (proceso) => {
        setCurrentProceso(proceso);
        setShowOperadorModal(true);
    };
    
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

    const hayProcesosConEstandarCero =() => {
        if (!otList || otList.length === 0) return false;

        return otList.some(ot => 
            ot.procesos && ot.procesos.some(proceso => 
                !proceso.estandar || parseFloat( proceso.estandar) === 0
            )
        );
    };

    const getProcesosConEstandarCero = () => {
        const procesosConEstandarCero = [];

        otList?.forEach( ot => {
            ot.procesos?.forEach(proceso => {
                if (!proceso.estandar || parseFloat(proceso.estandar) === 0) {
                    procesosConEstandarCero.push({
                        ot_codigo: ot.orden_trabajo_codigo_ot,
                        proceso_descripcion: proceso.descripcion,
                        id: proceso.id
                    });
                }
            });
        });

        return procesosConEstandarCero;
    };

    const renderOt = (ot) => {
        // Verificar cambios pendientes solo para esta OT específica
        const hasPendingChanges = Object.keys(pendingChanges).some(key => {
            return key.startsWith(`${ot.orden_trabajo}-`);
        }); 

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
                    <div className="d-flex align-items-center">
                        <span className="me-3">{ot.orden_trabajo_codigo_ot || "Sin código"}</span>
                        <span>{ot.orden_trabajo_descripcion_producto_ot || "Sin descripción"}</span>
                        <span className="ms-3">{ot.orden_trabajo_fecha_termino || "Sin fecha"}</span>
                    </div>
                    <div className="d-flex align-items-center">
                        {hasPendingChanges && (
                            <Button
                                variant="success"
                                size="sm"
                                onClick={handleSaveChanges}
                                disabled={savingChanges}
                                className="me-2"
                            >
                                {savingChanges ? "Guardando..." : "Guardar"}
                            </Button>
                        )}
                        <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleToggleExpand(ot.orden_trabajo)}
                    >
                            {expandedOTs[ot.orden_trabajo] ? "Ocultar" : "Mostrar"}
                        </Button>
                    </div>
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
                                <th>Operador</th>
                                <th>Cantidad</th>
                                <th>Estandar</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ot.procesos?.map((item_ruta) => (
                                <tr 
                                    key={item_ruta.id}
                                    className={!item_ruta.estandar || parseFloat(item_ruta.estandar) === 0 ? "table-danger" : ""}
                                >
                                    <td>{item_ruta.item}</td>
                                    <td>
                                        <input 
                                        type="text" 
                                        className="form-control" 
                                        value={`${item_ruta.codigo_proceso} - ${item_ruta.descripcion}`}
                                        disabled
                                        />
                                    </td>
                                    <td>
                                        <select 
                                        className="form-control" 
                                        value={item_ruta.maquina_id || ''}
                                        onChange={(e) => handleProcessChange(
                                            ot.orden_trabajo,
                                            item_ruta.id,
                                            "maquina_id",
                                            e.target.value
                                            
                                        )}
                                        onFocus={() => {
                                            console.log("[Frontend] onFocus del selector de máquinas");
                                            console.log("[Frontend] item_ruta:", item_ruta);
                                            console.log("[Frontend] ¿Tiene código de proceso?", !!item_ruta.codigo_proceso);

                                            //Cargar máquinas cuando el select recibe el foco
                                            if(!maquinasPorProceso[item_ruta.id]){
                                                cargarMaquinasPorProceso(item_ruta);
                                            }
                                        }}
                                        >
                                            <option value="">Seleccione una máquina</option>
                                            {(maquinasPorProceso[item_ruta.id] || maquinas).map(maquina => (
                                                <option
                                                    value={maquina.id}
                                                    key={maquina.id}
                                                >
                                                    {maquina.codigo_maquina} - {maquina.descripcion}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                    <td>
                                        {item_ruta.asignacion ? (
                                            // Si hay operador asignado, mostrar como texto con botón de edición
                                            <div className="d-flex align-items-center">
                                                <input 
                                                    type="text" 
                                                    className="form-control" 
                                                    value={item_ruta.operador_nombre || 'Sin nombre'}
                                                    disabled
                                                    title={item_ruta.asignacion?.fecha_asignacion ? `Asignado el: ${new Date(item_ruta.asignacion.fecha_asignacion).toLocaleString()}` : ''}
                                                />
                                                <Button
                                                    variant="outline-primary"
                                                    size="sm"
                                                    onClick={() => openOperadorModal(item_ruta)}
                                                    title="Cambiar Operador"
                                                    disabled={!item_ruta.maquina_id}
                                                >
                                                    <i className="bi bi-pencil"></i>
                                                </Button>
                                            </div>
                                        ) : (
                                            // Si no hay operador asignado, mostrar botón para asignar
                                            <Button
                                                variant="outline-secondary"
                                                className="w-100"
                                                onClick={() => openOperadorModal(item_ruta)}
                                                disabled={!item_ruta.maquina_id}
                                            >
                                                <i className="bi bi-person-plus-fill me-2"></i>
                                                Asignar Operador
                                            </Button>
                                        )}
                                    </td>
                                    <td>
                                        <input 
                                        type="number" 
                                        className="form-control"
                                        value={item_ruta.cantidad} 
                                        onChange={(e) => handleProcessChange(
                                            ot.orden_trabajo,
                                            item_ruta.id,
                                            'cantidad',
                                            parseInt(e.target.value, 10)
                                        )}
                                        />
                                    </td>
                                    <td>
                                        <Form.Control 
                                        type="number" 
                                            value={item_ruta.estandar || 0}
                                            onChange={(e) => {
                                                const newValue = parseFloat(e.target.value);
                                                handleProcessChange(
                                                    ot.orden_trabajo,
                                                    item_ruta.id,
                                                    'estandar',
                                                    parseFloat(e.target.value)
                                                );
                                            }}
                                            min="0"
                                            step="1"
                                            className={!item_ruta.estandar || parseFloat(item_ruta.estandar) === 0 ? "border-danger" : ""}
                                        />
                                        {(!item_ruta.estandar || parseFloat(item_ruta.estandar) === 0) && 
                                            <small className="text-danger">Ingrese un estándar mayor a 0</small>
                                        }
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
        

    if (loading) return <LoadingSpinner message="Cargando detalles del programa..." overlay={true} size="small"/>;
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
                    {hayProcesosConEstandarCero() && (
                        <div className="alert alert-warning" role="alert">
                            <i className="bi bi-exclamation-triangle-fill me-2"></i>
                            Hay procesos con estándar en 0. Por favor, ingrese un valor válido para poder proyectar en la carta.
                        </div>
                    )}

                    {showPendingChangesAlert && Object.keys(pendingChanges).length > 0 && (
                        <div className="alert alert-info" role="alert">
                            <i className="bi bi-info-circle-fill me-2"></i>
                            Hay cambios pendientes por guardar. Por favor, guarde los cambios antes de salir de la página.
                        </div>
                    )}
                    
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
                    <Button 
                    variant="success" 
                    onClick={toggleTimeline} 
                    className="mt-3" 
                    disabled={timelineLoading}
                    title = {hayProcesosConEstandarCero() ? "No se puede proyectar: Hay procesos con estándar en 0": ""}
                    >
                        {timelineLoading
                            ? 
                                <span>
                                    <LoadingSpinner message="" size="small"/> Cargando Proyección
                                </span>
                            : showTimeline
                            ? "Ocultar Proyección"
                            : hayProcesosConEstandarCero()
                                ? "Proyectar (Corregir estándares en OTs)"
                                : "Proyectar"}
                    </Button>
                    <Button 
                    variant="primary" 
                    onClick={async() => {
                        try{
                            await generateProgramPDF(programId);
                            toast.success("PDF generando correctamente");
                        }catch(error){
                            toast.error("Error detallado al generar el PDF", error);

                            //Mostrar mensaje más específico según el tipo error
                            if (error.response){
                                //El servidor respondió con un código de error
                                if (error.response.data instanceof Blob){
                                    // Si la respuesta es un blob, intentar leerlo como texto
                                    const text = await error.response.data.text();
                                    try {
                                        const errorData = JSON.parse(text);
                                        toast.error(`Error al generar PDF: ${errorData.detail || errorData.message || "Error del servidor"}`);
                                    } catch (e) {
                                        toast.error(`Error al generar PDF: ${text.substring(0, 100)}`);
                                    }
                                } else {
                                    toast.error(`Error al generar PDF: ${error.response.data?.detail || error.response.statusText}`);
                                }
                            } else if (error.request) {
                                //La solicitud se hizo pero no se recibió respuesta
                                toast.error("No se recibió respuesta del servidor al generar el PDF");
                            } else {
                                //Error en la configuración de la solicitud
                                toast.error(`Error al configurar la solicitud: ${error.message}`);
                            }
                        }
                    }} 
                    className="mt-3">
                        Generar PDF
                    </Button>
                </section>

                {showTimeline && (
                    <div className="timeline-container mt-4 mb-4" style={{ width: "100%" }}>
                        <Timeline
                            groups={timelineGroups}
                            items={timelineItems}
                            defaultTimeStart={moment().startOf('day').toDate()}
                            defaultTimeEnd={moment().add(14, 'days').toDate()}
                            lineHeight={50}
                            // No cambiar stackItems si ya funciona
                            sidebarWidth={200}
                            canMove={false}
                            canResize={false}
                            // Configuración para mostrar horas
                            timeSteps={{
                                second: 1,
                                minute: 30,
                                hour: 1,
                                day: 1,
                                month: 1,
                                year: 1
                            }}
                            // Mostrar las horas en el encabezado
                            traditionalZoom={true}
                            // Formato de hora
                            timeFormat="%H:%M"
                            // Mostrar líneas de hora
                            showCursorLine
                            // Marcar la hora de descanso con un color diferente
                            dayBackground={date => {
                                const hours = date.getHours();
                                // Marcar la hora de descanso (13:00-14:00) con un color diferente
                                if (hours === 13) {
                                    return '#f8d7da';  // Color rojo claro
                                }
                                return null;
                            }}
                        />
                    </div>
                )}
            </div>

            {/* Modal de selección de operador */}
            <OperadorSelectionModal
                show={showOperadorModal}
                onHide={() => setShowOperadorModal(false)}
                maquinaId={currentProceso?.maquina_id}
                procesoId={currentProceso?.id}
                currentOperadorId={currentProceso?.operador_id}
                onSelect={(operadorId) => handleOperadorChange(currentProceso, operadorId)}
            />

            <Footer/>
        </div>
    );
}
