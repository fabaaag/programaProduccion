from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone

class Operador(models.Model):
    """Representa un operador que puede trabajar en diferentes máquinas
        Mantiene información básica y sus habilitaciones.
    """
    nombre = models.CharField(max_length=100)
    rut = models.CharField(max_length=12, unique=True)
    activo = models.BooleanField(default=True)
    empresa = models.ForeignKey('JobManagement.EmpresaOT', on_delete=models.PROTECT)
    maquinas_habilitadas = models.ManyToManyField('JobManagement.Maquina', through='OperadorMaquina', related_name='operadores_habilitados')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.nombre} ({self.rut})"
    
    def puede_operar_maquina(self, maquina):
        """Verifica si el operador está habilitado para operar una máquina específica"""
        return self.maquinas_habilitadas.filter(id=maquina.id).exists()

class OperadorMaquina(models.Model):
    """Relaciona operadores con máquinas y mantiene un registro de habiliaciones.
    Incluye fecha de habilitacion y estado activo.
    """
    operador = models.ForeignKey(Operador, on_delete=models.CASCADE)
    maquina = models.ForeignKey('JobManagement.Maquina', on_delete=models.CASCADE)
    fecha_habilitacion = models.DateField(auto_now_add=True)
    activo = models.BooleanField(default=True)

    class Meta:
        unique_together = ['operador', 'maquina']
        verbose_name="Habilitación de máquina"
        verbose_name_plural = "Habilitaciónes de máquinas"

    def __str__(self):
        return f'{self.operador.nombre} - {self.maquina.codigo_maquina}'
    
class AsignacionOperador(models.Model):
    """Registra la asignacion de un operador a un ItemRuta específico dentro de un programa
    Incluye validaciones de tiempo y permisos
    """
    operador = models.ForeignKey(Operador, on_delete=models.CASCADE, related_name='asignaciones')
    item_ruta = models.ForeignKey('JobManagement.ItemRuta', on_delete=models.CASCADE)
    programa = models.ForeignKey('JobManagement.ProgramaProduccion', on_delete=models.CASCADE)
    fecha_inicio = models.DateTimeField()
    fecha_fin = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.CheckConstraint(
                check=models.Q(fecha_fin__gt=models.F('fecha_inicio')),
                name='check_fecha_fin_mayor_inicio'
            )
        ]
    
    def clean(self):
        # Verificar que operador_id y item_ruta_id existan
        if hasattr(self, 'operador_id') and self.operador_id and hasattr(self, 'item_ruta_id') and self.item_ruta_id:
            # Obtener el operador y el item_ruta manualmente
            from Operator.models import Operador
            from JobManagement.models import ItemRuta
            
            try:
                operador = Operador.objects.get(id=self.operador_id)
                item_ruta = ItemRuta.objects.get(id=self.item_ruta_id)
                
                # Verificar si el operador puede operar la máquina
                if not operador.puede_operar_maquina(item_ruta.maquina):
                    raise ValidationError('El operador no está habilitado para esta máquina')
                    
                # Verificar superposición de horarios
                superposicion = AsignacionOperador.objects.filter(
                    operador_id=self.operador_id,
                    fecha_inicio__lt=self.fecha_fin,
                    fecha_fin__gt=self.fecha_inicio
                ).exclude(id=self.id)
                
                if superposicion.exists():
                    raise ValidationError('El operador ya tiene una asignación en este horario')
                    
            except (Operador.DoesNotExist, ItemRuta.DoesNotExist):
                raise ValidationError('Operador o ItemRuta no encontrado')

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.operador.nombre} - {self.item_ruta} ({self.fecha_inicio})"