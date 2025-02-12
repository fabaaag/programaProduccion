from django.db import models
from django.contrib.auth.models import User
from datetime import time, datetime, timedelta
import holidays
from pytz import timezone
from django.conf import settings

# Create your models here.
from JobManagement.models import EmpresaOT, Maquina, Proceso #ItemRuta, ProgramaProduccion

class RolOperador(models.Model):
    nombre = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.nombre

class Operador(models.Model):
    nombre = models.CharField(max_length=100)
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
    
class DisponibilidadOperador(models.Model):
    """
    Representa los intervalos de tiempo durante los cuales un operador está disponible o asignado a una tarea.
    
    Atributos:
        operador (ForeignKey): Referencia al operador cuya disponibilidad se está registrando.
        fecha_inicio (DateTimeField): Fecha y hora en que comienza el periodo de disponibilidad o asignación.
        fecha_fin (DateTimeField): Fecha y hora en que termina el periodo de disponibilidad o asignación.
        ocupado (BooleanField): Indica si el operador está ocupado (True) o disponible (False) durante el intervalo especificado.

    Métodos:
        __str__(self): Devuelve una representación en cadena que muestra el operador y el intervalo de tiempo durante el cual está ocupado o disponible.
    """
    from JobManagement.models import ProgramaProduccion
    operador = models.ForeignKey(Operador, on_delete=models.CASCADE)
    fecha_inicio = models.DateTimeField()
    fecha_fin = models.DateTimeField()
    ocupado = models.BooleanField(default=False)
    programa = models.ForeignKey(ProgramaProduccion, on_delete=models.CASCADE, related_name='disponibilidades_operadores', null=True)


    def __str__(self):
        estado = "ocupado" if self.ocupado else "disponible"
        return f"{self.operador.nombre} {estado} desde {self.fecha_inicio} hasta {self.fecha_fin}"

    class Meta:
        verbose_name = "Disponibilidad de Operador"
        verbose_name_plural = "Disponibilidades de Operadores"
    
    @classmethod
    def crear_turnos_para_horizonte(cls, operador, dias_habiles=20):
        fecha_inicio = datetime.now().date()
        chile_holidays = holidays.Chile()
        turnos = []


        # Encuentra los días hábiles dentro del horizonte especificado
        dias_laborables = 0
        while dias_laborables < dias_habiles:
            if fecha_inicio.weekday() < 5 and fecha_inicio not in chile_holidays:
                dias_laborables += 1
                turnos += cls._crear_turnos_diarios(operador, fecha_inicio)
            fecha_inicio += timedelta(days=1)

        # Crear todos los turnos en un solo comando
        cls.objects.bulk_create(turnos)

    @classmethod
    def _crear_turnos_diarios(cls, operador, dia, programa):
        turnos = []
        if dia.weekday() < 4:  # De lunes a jueves
            turnos.extend(cls._crear_turno_diario(operador, dia, "08:00", "13:00", "14:00", "18:00", programa))
        else:  # Viernes
            turnos.extend(cls._crear_turno_diario(operador, dia, "08:00", "13:00", "14:00", "17:00", programa))
        return turnos

    @staticmethod
    def _crear_turno_diario(operador, dia, manana_inicio, manana_fin, tarde_inicio, tarde_fin, programa):
        chile_timezone = timezone('America/Santiago')
        manana_inicio = chile_timezone.localize(datetime.combine(dia, datetime.strptime(manana_inicio, '%H:%M').time()))
        manana_fin = chile_timezone.localize(datetime.combine(dia, datetime.strptime(manana_fin, '%H:%M').time()))
        tarde_inicio = chile_timezone.localize(datetime.combine(dia, datetime.strptime(tarde_inicio, '%H:%M').time()))
        tarde_fin = chile_timezone.localize(datetime.combine(dia, datetime.strptime(tarde_fin, '%H:%M').time()))
        return [
            DisponibilidadOperador(operador=operador, fecha_inicio=manana_inicio, fecha_fin=manana_fin, programa=programa),
            DisponibilidadOperador(operador=operador, fecha_inicio=tarde_inicio, fecha_fin=tarde_fin, programa=programa)
        ]