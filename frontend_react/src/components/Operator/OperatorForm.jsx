import { useState, useEffect } from 'react';
import { Form, Button, Modal, Alert } from 'react-bootstrap';
import { createOperator, updateOperator, getRoles} from '../../api/operator.api.js';
import { getAllMachines } from '../../api/machines.api.js';
import { getAllEmpresas } from '../../api/empresas.api.js';
import { toast } from 'react-hot-toast';

export function OperatorForm({ show, handleClose, operatorToEdit, onOperatorSaved }){
    const [formData, setFormData] = useState({
        nombre: '',
        rut: '',
        rol: '',
        empresa: '',
        maquinas: [],
        activo: true
    });

    const [roles, setRoles] = useState([]);
    const [machines, setMachines] = useState([]);
    const [empresas, setEmpresas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        if(operatorToEdit){
            setFormData({
                nombre: operatorToEdit.nombre,
                rut: operatorToEdit.rut,
                rol:operatorToEdit.rol.id,
                empresa: operatorToEdit.empresa || 1,
                maquinas: operatorToEdit.maquinas.map(m => m.id),
                activo: operatorToEdit.activo
            });
        } else {
            resetForm();
        }
    }, [operatorToEdit]);

    const loadInitialData = async () => {
        try{
            const [rolesData, machinesData, empresasData] = await Promise.all([
                getRoles(),
                getAllMachines(),
                getAllEmpresas()
            ]);
            setRoles(rolesData);
            setMachines(machinesData);
            setEmpresas(empresasData)
        } catch(error){
            console.error('Error al cargar datos iniciales:', error);
            setError('Error al cargar datos necesarios');
        }
    };

    const resetForm = () => {
        setFormData({
            nombre: '',
            rut: '',
            rol: '',
            empresa: 1,
            maquinas: [],
            activo: true
        });
        setError('');
    };

    const validateRut = (rut) => {
        //Expresión regultar para validar formato RUT (XX.XXX.XXX-X)
        const rutRegex = /^\d{1,2}\.\d{3}\.\d{3}[-][0-9kK]{1}$/;
        return rutRegex.test(rut);
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        //Validaciones
        if(!formData.nombre.trim()){
            setError('El nombre es requerido');
            return;
        }

        if(!validateRut(formData.rut)){
            setError('El formato del RUT no es válido (XX.XXX.XXX-X)');
            return;
        }

        if(!formData.rol){
            setError('Debe seleccionar un rol');
            return;
        }

        if(formData.maquinas.length === 0){
            setError('Debe seleccionar al menos una máquina');
            return
        }

        setLoading(true);
        try{
            const dataToSend = {
                ...formData, 
                maquinas: formData.maquinas.map(id => parseInt(id)),
                rol: parseInt(formData.rol),
                empresa: parseInt(formData.empresa)
            };

            console.log('Datos a enviar:', dataToSend);

            if(operatorToEdit){
                await updateOperator(operatorToEdit.id, formData);
                toast.success('Operador actualizado exitosamente');
            }else{
                await createOperator(formData);
                toast.success('Operador creado exitosamente');
            }
            onOperatorSaved();
            handleClose();
            resetForm();
        } catch (error) {
            console.error('Error:', error);
            const errorMessage = error.response?.data?.detail || error.response?.data?.message || 'Error al guardar el operador';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const {name, value, type, checked} = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleMachineSelect = (e) => {
        const selectedOptions = Array.from(e.target.selectedOptions, option => parseInt(option.value));
        setFormData(prev => ({
            ...prev,
            maquinas: selectedOptions
        }));
    };

    return (
        <Modal show={show} onHide={handleClose} backdrop="static" keyboard={false}>
            <Form onSubmit={handleSubmit}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        {operatorToEdit ? 'Editar Operador' : 'Nuevo Operador'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {error && <Alert variant="danger">{error}</Alert>}

                    <Form.Group className='mb-3'>
                        <Form.Label>Nombre</Form.Label>
                        <Form.Control
                        type='text'
                        name='nombre'
                            value={formData.nombre}
                            onChange={handleChange}
                            placeholder='Ingrese el nombre completo'
                            required
                        />
                    </Form.Group>
                    <Form.Group className='mb-3'>
                        <Form.Label>RUT</Form.Label>
                        <Form.Control 
                            type='text'                        
                            name='rut'
                            value={formData.rut}
                            onChange={handleChange}
                            placeholder='XX.XXX.XXX-X'
                            required                        
                        />
                        <Form.Text className='text-muted'>
                            Formato: XX.XXX.XXX-X
                        </Form.Text>
                    </Form.Group>

                    <Form.Group className='mb-3'>
                        <Form.Label>Rol</Form.Label>
                        <Form.Select
                            name='rol'
                            value={formData.rol}
                            onChange={handleChange}
                            placeholder="XX.XXX.XXX-X"
                        >
                            <option value="">Seleccione un rol...</option> 
                            {roles.map(rol => (
                                <option key={rol.id} value={rol.id}>
                                    {rol.nombre}
                                </option>
                            ))}
                        </Form.Select>
                    </Form.Group>

                    <Form.Group className='mb-3'>
                        <Form.Label>Empresa</Form.Label>
                        <Form.Select
                            name='empresa'
                            value={formData.empresa}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Seleccione una empresa...</option>
                            {empresas.map(empresa => (
                                <option key={empresa.id} value={empresa.id}>
                                    {empresa.nombre}
                                </option>
                            ))}
                        </Form.Select>
                    </Form.Group>

                    <Form.Group className='mb-3'>
                        <Form.Label>Máquinas</Form.Label>
                        <Form.Select 
                            multiple
                            name='maquinas'
                            value={formData.maquinas}
                            onChange={handleMachineSelect}
                            style={{ height: '120px' }}
                        >
                            {machines.map(machine => (
                                <option key={machine.id} value={machine.id}>
                                    {machine.codigo_maquina} - {machine.descripcion}
                                </option>
                            ))}
                        </Form.Select>
                        <Form.Text className="text-muted">
                            Mantenga presionado Ctrl para seleccionar múltiples máquinas
                        </Form.Text>
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Check 
                            type="checkbox"
                            name="activo"
                            label="Activo"
                            checked={formData.activo}
                            onChange={handleChange}
                        />

                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button variant="primary" type="submit" disabled={loading}>
                        {loading ? 'Guardando...' : (operatorToEdit ? 'Actualizar' : 'Crear')}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    )
};