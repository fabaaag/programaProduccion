from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError
from Client.models import Cliente
from Product.models import Producto, Pieza, MateriaPrima, MeasurementUnit
import uuid


# Create your models here.


class Maquina(models.Model):
    codigo_maquina = models.CharField(max_length=10, null=False, blank=False)
    descripcion = models.CharField(max_length=100, null=False, blank=False)
    sigla = models.CharField(max_length=10, null=False, blank=False, default='')
    carga = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    golpes = models.IntegerField(default=0)
    empresa = models.ForeignKey('EmpresaOT', on_delete=models.CASCADE, null=True)

    class Meta:
        unique_together = ('empresa', 'codigo_maquina')

    def __str__(self):
        return f'{self.codigo_maquina} - {self.descripcion}'
    
class Proceso(models.Model):
    codigo_proceso = models.CharField(max_length=10, null=False, blank=False)
    sigla = models.CharField(max_length=10, null=True, blank=True)
    descripcion = models.CharField(max_length=100, null=False, blank=False)
    carga = models.DecimalField(max_digits=10, decimal_places=4, default=0.0000)
    empresa = models.ForeignKey('EmpresaOT', on_delete=models.CASCADE, null=True, blank=True)

    class Meta:
        unique_together = ('empresa', 'codigo_proceso')

    def __str__(self):
        return f'{self.codigo_proceso} - {self.descripcion}'
    
class Ruta(models.Model):
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE, related_name='rutas')
    nro_etapa = models.PositiveIntegerField()
    proceso = models.ForeignKey(Proceso, on_delete=models.CASCADE)
    maquina = models.ForeignKey(Maquina, on_delete=models.CASCADE)
    estandar = models.IntegerField(default=0)

    class Meta:
        unique_together = ('producto', 'nro_etapa', 'proceso', 'maquina')

    def __str__(self):
        return f'{self.producto.codigo_producto} - Etapa {self.nro_etapa} - {self.proceso.codigo_proceso}'
    
class RutaPieza(models.Model):
    pieza = models.ForeignKey(Pieza, on_delete=models.CASCADE, related_name='rutas')
    nro_etapa = models.PositiveIntegerField()
    proceso = models.ForeignKey(Proceso, on_delete=models.CASCADE)
    maquina = models.ForeignKey(Maquina, on_delete=models.CASCADE)
    estandar = models.IntegerField(default=0)

    class Meta:
        unique_together = ('pieza', 'nro_etapa', 'proceso', 'maquina')

    def __str__(self):
        return f'{self.pieza.codigo_pieza} - Etapa {self.nro_etapa} - {self.proceso.codigo_proceso}'
    
class TipoOT(models.Model):
    codigo_tipo_ot = models.CharField(max_length=2, unique=True)
    descripcion = models.CharField(max_length=50, blank=True, null=True)

    def __str__(self):
        return f'{self.codigo_tipo_ot}: {self.descripcion}' or 'Unnamed'
    
class SituacionOT(models.Model):
    codigo_situacion_ot = models.CharField(max_length=2, unique=True)
    descripcion = models.CharField(max_length=50, blank=True, null=True)

    def __str__(self):
        return f'{self.codigo_situacion_ot}: {self.descripcion}' or 'Unnamed'
    
class EmpresaOT(models.Model):
    nombre = models.CharField(max_length=50, blank=False, null=False)
    apodo = models.CharField(max_length=50, blank=False, null=False, unique=True)
    codigo_empresa = models.CharField(max_length=50, blank=False, null=False, unique=True)

    def __str__(self):
        return f'{self.apodo} - {self.codigo_empresa}'
    
class ItemRuta(models.Model):
    item = models.PositiveIntegerField()
    maquina = models.ForeignKey(Maquina, on_delete=models.CASCADE)
    proceso = models.ForeignKey(Proceso, on_delete=models.CASCADE)
    estandar = models.IntegerField(default=0)
    cantidad_pedido = models.DecimalField(max_digits=14, decimal_places=2, default=0.00)
    cantidad_terminado_proceso = models.DecimalField(max_digits=14, decimal_places=2, default=0.00)
    cantidad_perdida_proceso = models.DecimalField(max_digits=14, decimal_places=2, default=0.00)
    terminado_sin_actualizar = models.DecimalField(max_digits=14, decimal_places=2, default=0.00)
    ruta = models.ForeignKey('RutaOT', on_delete=models.CASCADE, related_name='items')

    class Meta:
        unique_together = ('ruta', 'item', 'maquina', 'proceso')

    def __str__(self):
        return f'Item {self.item} de Ruta de Orden: {self.ruta.orden_trabajo}'
    
class RutaOT(models.Model):
    
    orden_trabajo = models.OneToOneField('OrdenTrabajo', on_delete=models.CASCADE, related_name='ruta_ot', null=True, blank=True)

    def __str__(self):
        if hasattr(self, 'orden_trabajo') and self.orden_trabajo:
            return f'Ruta asociada a la Orden de Trabajo: {self.orden_trabajo.codigo_ot}'
        return 'Ruta sin Orden de Trabajo asociada'
    
class OrdenTrabajo(models.Model):

    codigo_ot = models.IntegerField(unique=True)
    tipo_ot = models.ForeignKey(TipoOT, on_delete=models.PROTECT)
    situacion_ot = models.ForeignKey(SituacionOT, on_delete=models.PROTECT)
    fecha_emision = models.DateField(null=True, blank=True)
    fecha_proc = models.DateField(null=True, blank=True)
    fecha_termino = models.DateField(null=True, blank=True)
    cliente = models.ForeignKey(Cliente, on_delete=models.PROTECT, null=True, blank=True)
    nro_nota_venta_ot = models.CharField(max_length=12, null=True, blank=True)
    item_nota_venta = models.IntegerField()
    referencia_nota_venta = models.IntegerField(null=True, blank=True)
    codigo_producto_inicial = models.CharField(max_length=12, null=True, blank=True)
    codigo_producto_salida = models.CharField(max_length=12, null=True, blank=True)
    descripcion_producto_ot = models.CharField(max_length=255, null=True, blank=True)
    cantidad = models.DecimalField(max_digits=14, decimal_places=2, default=0.00)
    unidad_medida = models.ForeignKey(MeasurementUnit, on_delete=models.PROTECT, null=True, blank=True)
    cantidad_avance = models.DecimalField(max_digits=14, decimal_places=2, default=0.00)
    peso_unitario = models.DecimalField(max_digits=19, decimal_places=5, default=0.00000)
    materia_prima = models.ForeignKey(MateriaPrima, on_delete=models.PROTECT, null=True, blank=True)
    cantidad_mprima = models.DecimalField(max_digits=14, decimal_places=2, default=0.00000)
    unidad_medida_mprima = models.ForeignKey(MeasurementUnit, related_name='unidad_of_medida_materia_prima', on_delete=models.PROTECT, null=True, blank=True) #column 19
    observacion_ot = models.CharField(max_length=150, null=True, blank=True)
    empresa = models.ForeignKey(EmpresaOT, on_delete=models.PROTECT, null=True, blank=True)
    multa = models.BooleanField(default=False)

    def __str__(self):
        return f'{self.codigo_ot}'

    def update_item_rutas(self, items_data):
        print("Items data:", items_data)
        # Si recibes el listado de máquinas en el frontend, sería ideal cargar estas previamente
        maquinas_dict = {maquina.id: maquina for maquina in Maquina.objects.all()}
        
        for item_data in items_data:
            try:
                # Intenta obtener el ítem de la ruta correspondiente
                item = self.ruta_ot.items.get(item=item_data['item'])
                print("Item instance:", item)

                # Validar y actualizar la máquina si se proporciona
                if 'maquina' in item_data:
                    maquina = maquinas_dict.get(item_data['maquina'])
                    if maquina:
                        item.maquina = maquina
                    else:
                        print(f"Máquina con ID {item_data['maquina']} no encontrada.")
                
                # Actualizar el estándar de producción si se proporciona
                if 'estandar' in item_data:
                    item.estandar = item_data['estandar']
                
                item.save()  # Guardar los cambios en el ítem

            except ItemRuta.DoesNotExist:
                print(f"Ítem con el número {item_data['item']} no encontrado en la ruta.")
            except Exception as e:
                print(f"Error al actualizar ItemRuta: {e}")



####Crear el modelo para programa produccion aqui

class ProgramaProduccion(models.Model):
    nombre = models.CharField(max_length=100, unique=True, blank=True)
    #Fecha de inicio será determinada por la fecha de la ot en primera posición, y la fecha de fin se determinará por el cálculo de cuando termine el último proceso de la ultima ot
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, null=True)

    class Meta:
        verbose_name = "Programa Producción"
        verbose_name_plural = "Programas Producción"

    def __str__(self):
        return self.nombre
    
    def save(self, *args, **kwargs):
        if not self.nombre:
            timestamp = timezone.now().strftime("%Y%m%d%H%M%S")
            random_string = uuid.uuid4().hex[:6]
            self.nombre = f"Programa_{timestamp}_{random_string}"
        super().save(*args, **kwargs)
        
    @property
    def dias_programa(self):
        return (self.fecha_fin - self.fecha_inicio).days + 1

    #Crear métodos para disponibilidad de operadores y maquinas
    #Disponibilidad horaria más adelante

class ProgramaOrdenTrabajo(models.Model):
    programa =  models.ForeignKey(ProgramaProduccion, on_delete=models.CASCADE)
    orden_trabajo = models.ForeignKey(OrdenTrabajo, on_delete=models.CASCADE)
    prioridad = models.PositiveIntegerField()

    class Meta:
        unique_together = ('programa', 'orden_trabajo')

    def save(self, *args, **kwargs):
        if not self.id:
            if self.orden_trabajo.situacion_ot.codigo_situacion_ot not in ['P', 'S']:
                raise ValidationError("La OT debe estar en situación 'Pendiente' o 'Sin imprimir'")
        super(ProgramaOrdenTrabajo, self).save(*args, **kwargs)

    def __str__(self):
        return f'{self.programa.nombre} - {self.orden_trabajo.codigo_ot} - Prioridad: {self.prioridad}'

class ItemRutaOperador(models.Model):
    from Operator.models import Operador

    item_ruta = models.ForeignKey(ItemRuta, on_delete=models.CASCADE, related_name='operador_assignments')
    operador = models.ForeignKey(Operador, on_delete=models.CASCADE, related_name='ruta_assignments')
    programa_produccion = models.ForeignKey(ProgramaProduccion, on_delete=models.CASCADE, related_name='operador_assignments')
    created_at = models.DateTimeField(auto_now_add=True)
    modified_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('item_ruta', 'operador', 'programa_produccion')  # Ensures unique assignments per program

    def __str__(self):
        return f"{self.operador.nombre} assigned to {self.item_ruta} for {self.programa_produccion.nombre}"
    
class DisponibilidadMaquina(models.Model):
    """
    Representa los intervalos de tiempo durante los cuales una máquina específica está ocupada o disponible para producción.

    Este modelo es crucial para gestionar la planificación y asignación de máquinas en el entorno de producción, permitiendo
    registrar no solo los periodos en la que la máquina se encuentr asignada, sino que también asegura que las asignaciones
    no se solapen y que se respeten los tiempos de mantenimiento o inactividad.

    Atributos:
        maquina (ForeignKey): Referencia a la máquina cuya disponibilidad se está registrando.
        fecha_inicio (DateTimeField): Fecha y hora en que comienza el periodo de ocupación de la máquina.
        fecha_fin (DateTimeField): Fecha y hora en que finaliza el periodo de ocupación.
        ocupado (BooleanField): Indica si la máquina está ocupada (True) o disponible (False) durante el intervalo especificado.
        programa (ForeignKey): Referencia al programa de producción asociado.

    Métodos:
        __str__(self): Devuelve una representación en cadena que muestra la máquina y el intervalo de tiempo durante el cual está ocupada.
    """
    maquina = models.ForeignKey(Maquina, on_delete=models.CASCADE)
    fecha_inicio = models.DateTimeField()
    fecha_fin = models.DateTimeField()
    ocupado = models.BooleanField(default=False)
    programa = models.ForeignKey('JobManagement.ProgramaProduccion', on_delete=models.CASCADE, related_name='disponibilidades_maquina', null=True)

    def __str__(self):
        return f"{self.maquina.codigo_maquina} ocupada desde {self.fecha_inicio} hasta {self.fecha_fin}"
    
class Asignacion(models.Model):
    """
    Gestiona la asignación de recursos a las órdenes de trabajo, asegurando el uso eficiente de máquinas y operadores.
    
    Atributos:
        maquina (ForeignKey): La máquina asignada.
        orden_trabajo (ForeignKey): La orden de trabajo a la que se asigna la máquina.
        fecha_inicio (DateTimeField): Fecha y hora de inicio de la asignación.
        fecha_fin (DateTimeField): Fecha y hora en que termina la asignación.
        ocupado (BooleanField): Estado que indica si la máquina está ocupada en este intervalo.
        programa (ForeignKey): Referencia al programa de producción asociado.

    """
    maquina = models.ForeignKey(Maquina, on_delete=models.CASCADE, related_name="asignaciones")
    orden_trabajo = models.ForeignKey(OrdenTrabajo, on_delete=models.CASCADE, related_name="asignaciones")
    disponibilidad_maquina = models.ForeignKey(DisponibilidadMaquina, on_delete=models.CASCADE, related_name="asignaciones", null=True)
    ocupado = models.BooleanField(default=True)
    programa = models.ForeignKey('JobManagement.ProgramaProduccion', on_delete=models.CASCADE, related_name='asignaciones', null=True)

    class Meta:
        verbose_name = "Asignación de Recurso"
        verbose_name_plural = "Asignaciones de Recursos"

    def __str__(self):
        return f"{self.maquina.codigo_maquina} assigned to {self.orden_trabajo} from {self.disponibilidad_maquina.fecha_inicio} to {self.disponibilidad_maquina.fecha_fin}"

class AtrasoDiarioOT(models.Model):
    """
    Modelo que registra diariamente los días de atrasos acumulados para las OT con situación Pendiente (P) y Sin imprimir.

    Atributos:
        fecha (DateField): Fecha de registro del atraso.
        dias_acumulados_atraso (IntegerField): Total de días de atraso acumulados del día.
    """
    fecha = models.DateField(auto_now_add=True, unique=True)
    dias_acumulados_atraso = models.IntegerField()
    dias_acumulados_atraso_stock = models.IntegerField(default=0)
    dias_acumulados_atraso_pedido = models.IntegerField(default=0)


    def __str__(self):
        return f'Fecha: {self.fecha} - Días Atraso: {self.dias_acumulados_atraso}'