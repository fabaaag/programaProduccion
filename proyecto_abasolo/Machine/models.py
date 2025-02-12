from django.db import models
from JobManagement.models import Maquina
from datetime import timezone
from django.conf import settings

# Create your models here.
class TipoMaquina(models.Model):
    codigo = models.CharField(max_length=10, unique=True)
    descripcion = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.codigo} - {self.descripcion}"

class EstadoOperatividad(models.Model):
    ESTADO_CHOICES = [
        ('OP', 'Operativa'),
        ('MN', 'En Mantención'),
        ('IN', 'Inoperativa'),
    ]

    estado = models.CharField(max_length=2, choices=ESTADO_CHOICES)
    descripcion = models.CharField(max_length=100)

    def __str__(self):
        return self.get_estado_display()
    
class EstadoMaquina(models.Model):
    maquina = models.OneToOneField(Maquina, on_delete=models.CASCADE, related_name='estado')
    tipo_maquina = models.ForeignKey(TipoMaquina, on_delete=models.PROTECT)
    estado_operatividad = models.ForeignKey(EstadoOperatividad, on_delete=models.PROTECT)
    motiov_estado = models.TextField(blank=True, null=True)
    fecha_ultimo_cambio = models.DateTimeField(auto_now=True)
    disponible = models.BooleanField(default=True)
    capacidad_maxima = models.IntegerField(default=0)
    observaciones = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.maquina} - {self.estado_operatividad}"

class HistorialEstadoMaquina(models.Model):
    maquina = models.ForeignKey(Maquina, on_delete=models.CASCADE, related_name='historial_estados')
    estado_anterior = models.ForeignKey(EstadoOperatividad, on_delete=models.PROTECT, related_name='historial_anterior')
    estado_nuevo = models.ForeignKey(EstadoOperatividad, on_delete=models.PROTECT, related_name='historial_nuevo')
    fecha_cambio = models.DateTimeField(auto_now_add=True)
    motivo_cambio = models.TextField()
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)

    def __str__(self):
        return f"{self.maquina} - {self.estado_anterior} -> {self.estado_nuevo}"
    
class MantenimientoMaquina(models.Model):
    TIPO_MANTENIMIENTO = [
        ('PR', 'Preventivo'),
        ('CR', 'Correctivo'),
        ('PD', 'Predictivo')
    ]

    PRIORIDAD_CHOICES = [
        ('AL', 'Alta'),
        ('MD', 'Media'),
        ('BJ', 'Baja'),
    ]

    ESTADO_MANTENIMIENTO = [
        ('PG', 'Programado'),
        ('EP', 'En Proceso'),
        ('CM', 'Completado'),
        ('CN', 'Cancelado')
    ]

    maquina = models.ForeignKey(Maquina, on_delete=models.CASCADE, related_name='mantenimientos')
    tipo_mantenimiento = models.CharField(max_length=2, choices=TIPO_MANTENIMIENTO)
    prioridad = models.CharField(max_length=2, choices=PRIORIDAD_CHOICES, default='MD')
    estado = models.CharField(max_length=2, choices=ESTADO_MANTENIMIENTO, default='PG')

    #Fechas
    fecha_programada = models.DateTimeField()
    fecha_inicio = models.DateTimeField(null=True, blank=True)
    fecha_fin = models.DateTimeField(null=True, blank=True)
    duracion_estimada = models.DurationField(help_text="Duración estimada del mantenimiento")

    descripcion  = models.TextField(help_text="Descripción del mantenimiento")
    

    #Seguimiento
    completado = models.BooleanField(default=False)
    observaciones = models.TextField(blank=True, null=True)
    resultado = models.TextField(
        blank=True,
        null=True,
        help_text="Resultados y observaciones post-mantenimiento"
    )

    creado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='mantenimientos_creados'
    )

    fecha_creacion = models.DateTimeField(auto_now_add=True)
    ultima_modificacion = models.DateTimeField(auto_now=True)
    

    def __str__(self):
        return f"{self.maquina} - {self.get_tipo_mantenimiento_display()} - {self.fecha_programada}"
    
    def save(self, *args, **kwargs):
        if self.completado and not self.fecha_fin:
            self.fecha_fin = timezone.now()
        super().save(*args, **kwargs)

    class Meta:
        ordering = ['-fecha_programada']
        verbose_name = "Mantenimiento de Máquina"
        verbose_name_plural = "Mantenimientos de Máquinas"
