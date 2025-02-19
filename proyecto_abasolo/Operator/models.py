from django.db import models
from django.contrib.auth.models import User
from datetime import time, datetime, timedelta
import holidays
from pytz import timezone
from django.conf import settings
from django.core.validators import RegexValidator
from JobManagement.models import EmpresaOT, Maquina, Proceso, ItemRuta, ProgramaProduccion

class RolOperador(models.Model):
    nombre = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.nombre

class Operador(models.Model):
    nombre = models.CharField(max_length=100)
    rut = models.CharField(
        max_length=12,
        unique=True,
        null=True,
        blank=True,
        validators=[RegexValidator(regex=r'^\d{1,2}\.\d{3}\.\d{3}[-][0-9kK]{1}$')]
    )
    rol = models.ForeignKey(RolOperador, on_delete=models.PROTECT)
    empresa = models.ForeignKey(EmpresaOT, on_delete=models.CASCADE)
    activo = models.BooleanField(default=True)
    maquinas = models.ManyToManyField(Maquina, through='OperadorMaquina')
    creado_por = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='operadores_creados', on_delete=models.CASCADE, blank=True, null=True)
    modificado_por = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='operadores_modificados', on_delete=models.CASCADE, blank=True, null=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True, null=True)
    fecha_modificacion = models.DateField(auto_now=True, null=True)

    class Meta:
        unique_together = ('nombre', 'rol', 'empresa')

    def __str__(self):
        return f'{self.nombre} - {self.rol.nombre}'
    
    def get_asignaciones_programa(self, programa):
        """Obtiene las asignaciones del operador de un programa específico"""
        return self.asignaciones_set.filter(
            programa=programa
        ).select_related('maquina', 'proceso')
    
class OperadorMaquina(models.Model):
    operador = models.ForeignKey(Operador, on_delete=models.CASCADE)
    maquina = models.ForeignKey(Maquina, on_delete=models.CASCADE)

    def __str__(self):
        return f'{self.operador} opera {self.maquina}'
    
class AsignacionOperador(models.Model):
    from JobManagement.models import ProgramaProduccion
    operador = models.ForeignKey(Operador, on_delete=models.CASCADE)
    maquina = models.ForeignKey(Maquina, on_delete=models.CASCADE)
    proceso = models.ForeignKey(Proceso, on_delete=models.CASCADE)
    fecha_asignacion = models.DateField()
    programa = models.ForeignKey(ProgramaProduccion, on_delete=models.CASCADE, related_name='asignaciones_operadores', null=True)

    class Meta:
        unique_together = ('operador', 'maquina', 'proceso', 'fecha_asignacion')

    def __str__(self):
        return f'{self.operador.nombre} asignado a {self.maquina.codigo_maquina} para {self.proceso.codigo_proceso} en {self.fecha_asignacion}'
    
    def verificar_conflictos(self):
        """Verifica si hay conflictos con otras asignaciones del operador"""
        conflictos = AsignacionOperador.objects.filter(
            operador=self.operador,
            fecha_asignacion=self.fecha_asignacion,
        ).exclude(id=self.id)

        return conflictos.exists()
    
    def save(self, *args, **kwargs):
        if self.verificar_conflictos():
            raise ValueError("El operador ya tiene una asignación en este horario")
        super().save(*args, **kwargs)
    
class DisponibilidadOperador(models.Model):
    TURNO_CHOICES = [
        ('MAÑANA', 'Turno Mañana'),
        ('TARDE', 'Turno Tarde'),
    ]

    operador = models.ForeignKey(Operador, on_delete=models.CASCADE)
    fecha_inicio = models.DateTimeField()
    fecha_fin = models.DateTimeField()
    ocupado = models.BooleanField(default=False)
    programa = models.ForeignKey(ProgramaProduccion, on_delete=models.CASCADE, related_name='disponibilidades_operadores', null=True)
    turno = models.CharField(max_length=10, choices=TURNO_CHOICES, null=True)
    proceso_asignado = models.ForeignKey('JobManagement.Proceso', on_delete=models.SET_NULL, null=True, blank=True)


    def __str__(self):
        estado = "ocupado" if self.ocupado else "disponible"
        return f"{self.operador.nombre} {estado} desde {self.fecha_inicio} hasta {self.fecha_fin}"

    class Meta:
        verbose_name = "Disponibilidad de Operador"
        verbose_name_plural = "Disponibilidades de Operadores"
        constraints = [
            models.CheckConstraint(
                check=models.Q(fecha_fin__gt=models.F('fecha_inicio')),
                name='fecha_fin_posterior_inicio'
            )
        ]
    
    @classmethod
    def crear_turnos_para_horizonte(cls, operador, dias_habiles=20):
        if fecha_inicio is None:
            fecha_inicio = datetime.now().date()
                
        chile_holidays = holidays.Chile()
        turnos = []
        dias_laborables = 0
        fecha_actual = fecha_inicio

        while dias_laborables < dias_habiles:
            if fecha_actual.weekday() < 5 and fecha_actual not in chile_holidays:
                dias_laborables += 1
                turnos.extend(cls._crear_turnos_diarios(operador, fecha_inicio))
            fecha_actual += timedelta(days=1)

        return cls.objects.bulk_create(turnos)

    @classmethod
    def _crear_turnos_diarios(cls, operador, dia, programa):
        horarios = {
            'MAÑANA': ('08:00', '13:00'),
            'TARDE': ('14:00', '18:00' if dia.weekday() < 4 else '17:00')
        }
        turnos = []
        chile_tz = timezone('')

        for turno, (hora_inicio, hora_fin) in horarios.items():
            inicio = chile_tz.localize(
                datetime.combine(dia, datetime.strptime(hora_inicio, '%H:%M').time())
            )
            fin = chile_tz.localize(
                datetime.combine(dia, datetime.strptime(hora_fin, '%H:%M').time())
            )

            turnos.append(cls(
                operador=operador,
                fecha_inicio=inicio,
                fecha_fin=fin,
                turno=turno
            ))
        
        return turnos

    def asignar_programa(self, programa, proceso):
        """Asigna un programa y proceso a un turno disponible"""

        if self.ocupado:
            raise ValueError("Este turno ya está ocupado")
        
        #Verificar que el horario del proceso coincida con el turno
        if not (self.fecha_inicio <= programa.fecha_inicio and programa.fecha_fin <= self.fecha_fin):
            raise ValueError("El horario del programa no coincide con el turno")
        
        self.programa = programa
        self.proceso_asignado = proceso
        self.ocupado = True
        self.save()

    def verificar_disponibilidad(self, fecha_inicio, fecha_fin):
        """Verifica si el operador está disponible en el rango de fechas dado"""
        return (
            not self.ocupado and
            self.fecha_inicio <= fecha_inicio and
            self.fecha_fini >= fecha_fin
        )

    