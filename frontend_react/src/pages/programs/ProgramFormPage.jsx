import { useForm } from "react-hook-form";
import { createProgram, getProgram } from "../../api/programs.api";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import CompNavbar from "../../components/Navbar/CompNavbar";
import axios from "axios";

export function ProgramFormPage() {
  const { register, handleSubmit, formState: { errors }, setValue } = useForm();
  const navigate = useNavigate();
  const [unassignedOrders, setUnassignedOrders] = useState([]);
  const [selectedOrders, setSelectedOrders] = useState([]);

  // Fetch unassigned orders from the backend
  const fetchUnassignedOrders = async () => {
    try {
      const response = await axios.get("http://localhost:8000/gestion/api/v1/ordenes/no_asignadas/");
      console.log(response.data);
      setUnassignedOrders(response.data);
    } catch (error) {
      console.error("Error fetching unassigned orders:", error);
    }
  };

  // Handle adding/removing orders to/from the selected list
  const handleOrderSelection = (order) => {
    if (selectedOrders.some((selected) => selected.id === order.id)) {
      setSelectedOrders(selectedOrders.filter((selected) => selected.id !== order.id));
    } else {
      setSelectedOrders([...selectedOrders, order]);
    }
  };

  // Handle form submission
  const onSubmit = handleSubmit(async (data) => {
    try{
      const programData = {
        ...data,
        ordenes: selectedOrders.map((order) => order.id),
      };
      //Llamar al backend 
      const response = await createProgram(programData);

      if(response.status === 201){
        toast.success("Programa creado exitósamente", {
          position:"bottom-right",
          style:{ background:"#101010", color:"#fff" },
        });
        navigate("/programs");
      }
    
    }catch(error){
      console.error("Error creating program", error);
      toast.error("Error al crear el programa", {
        position:"bottom-right",
        style:{ background:"#101010", color:"#fff" },
      });
    }
  });

  // Load program data for editing (if applicable)
  useEffect(() => {
    fetchUnassignedOrders();
  }, []);

  return (
    <div>
      <CompNavbar />
      <br />
      <div className="container">
        <h1 className="h1">Crear Programa de Producción</h1>
        <hr />
        <form onSubmit={onSubmit}>
          <div className="mb-3">
            <label htmlFor="nombre" className="form-label">Nombre del Programa</label>
            <input
              type="text"
              id="nombre"
              className="form-control"
              {...register("nombre", { required: true })}
            />
            {errors.nombre && <span className="text-danger">Este campo es obligatorio</span>}
          </div>
          <div className="mb-3">
            <label htmlFor="fecha_inicio" className="form-label">Fecha de Inicio</label>
            <input
              type="date"
              id="fecha_inicio"
              className="form-control"
              {...register("fecha_inicio", { required: true })}
            />
            {errors.fecha_inicio && <span className="text-danger">Este campo es obligatorio</span>}
          </div>
          <div className="mb-3">
            <label htmlFor="fecha_termino" className="form-label">Fecha de Término</label>
            <input
              type="date"
              id="fecha_termino"
              className="form-control"
              {...register("fecha_termino", { required: true })}
            />
            {errors.fecha_termino && <span className="text-danger">Este campo es obligatorio</span>}
          </div>
          <div className="mb-3">
            <label htmlFor="ordenes" className="form-label">Órdenes de Trabajo</label>
            <div className="list-group">
              {unassignedOrders.map((order) => (
                <div key={order.id} className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id={`order-${order.id}`}
                    checked={selectedOrders.some((selected) => selected.id === order.id)}
                    onChange={() => handleOrderSelection(order)}
                  />
                  <label className="form-check-label" htmlFor={`order-${order.id}`}>
                    {order.codigo_ot} - {order.descripcion_producto_ot}
                  </label>
                </div>
              ))}
            </div>
          </div>
          <button type="submit" className="btn btn-primary">Guardar Programa</button>
        </form>
      </div>
    </div>
  );
}

export default ProgramFormPage;
