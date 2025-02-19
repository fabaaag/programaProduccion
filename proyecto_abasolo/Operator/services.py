from django.db import transaction
from datetime import datetime, timedelta
from .models import AsignacionOperador, DisponibilidadOperador
from JobManagement.models import Asignacion, DisponibilidadMaquina

class DisponibilidadService:
    @staticmethod
    def verificar_disponibilidad_completa(operador, maquina, fecha_inicio, fecha_fin, turno=None):
        """
        Verifica la disponibilidad  tanto de un operador como de una maquina para un periodo especifico
        """

        #Verificar disponibilidad del operador
        disp_operador = DisponibilidadOperador.objects.filter(
            operador=operador,
            fecha_inicio__lte=fecha_inicio,
            fecha_fin__gte=fecha_fin,
            ocupado=False
        )

        if turno:
            disp_operador = disp_operador.filter(turno=turno)

        if not disp_operador.exists():
            return False, "Operador no disponible en el horario especificado"
        
        return True, "Disponibilidad confirmada"
    
    @staticmethod
    @transaction.atomic
    def reservar_disponibilidad(operador, maquina, fecha_inicio, fecha_fin, programa, proceso, turno=None):
        """
        Marca como ocupado el periodo de disponibilidad tanto para el operador como para la maquina
        """
        try:
            #Reservar disponibilidad del operador
            disp_operador = DisponibilidadOperador.objects.filter(
                operador=operador,
                fecha_inicio__lte=fecha_inicio,
                fecha_fin__gte=fecha_fin,
                ocupado=False
            )
            if turno:
                disp_operador = disp_operador.filter(turno=turno)

            disp_operador = disp_operador.first()
            if disp_operador:
                disp_operador.ocupado = True
                disp_operador.programa = programa
                disp_operador.proceso_asignado = proceso
                disp_operador.save()

            # Reservar disponibilidad de la máquina
            disp_maquina = DisponibilidadMaquina.objects.filter(
                maquina=maquina,
                fecha_inicio__lte=fecha_inicio,
                fecha_fin__gte=fecha_fin,
                ocupada=False
            ).first()

            if disp_maquina:
                disp_maquina.ocupada = True
                disp_maquina.programa = programa
                disp_maquina.proceso = proceso
                disp_maquina.save()

            return True
        except Exception as e:
            raise ValueError(f"Error al reservar disponibilidad: {str(e)}")
        

class AsignacionService:
    @staticmethod
    def verificar_disponibilidad(operador, fecha_asignacion):
        """Verifica si el operador está disponible en la fecha especificada"""

        asignaciones_existentes = AsignacionOperador.objects.filter(
            operador=operador,
            fecha_asignacion=fecha_asignacion
        )

        return not asignaciones_existentes.exists()
    

    @staticmethod
    def obtener_asignaciones_programa(programa):
        """Obtiene todas las asignaciones relacionadas con un programa específico"""
        return AsignacionOperador.objects.filter(
            programa=programa
        ).select_related('operador', 'maquina', 'proceso')
    

    @staticmethod
    @transaction.atomic
    def asignar_tarea_simple(operador, maquina, proceso, programa, fecha_asignacion=None):
        """Crea una asignación básica sin verificar disponibilidad"""
        if fecha_asignacion is None:
            fecha_asignacion = datetime.now().date()

        try:
            #Crear AsignacionOperador
            asignacion_operador = AsignacionOperador.objects.create(
                operador=operador,
                maquina=maquina,
                proceso=proceso,
                fecha_asignacion=fecha_asignacion,
                programa=programa
            )

            #Crear Asignacion en JobManagement
            asignacion_job = Asignacion.objects.create(
                programa=programa,
                maquina=maquina,
                proceso=proceso,
                operador=operador,
                fecha_asignacion=fecha_asignacion
            )

            return asignacion_operador, asignacion_job
        
        except Exception as e:
            raise ValueError(f"Error al crear las asignaciones: {str(e)}")
        
    @staticmethod
    @transaction.atomic
    def asignar_tarea_completa(operador, maquina, proceso, programa, fecha_inicio, fecha_fin, turno=None):
        """Crear una nueva asignacion verificando y reservando disponibilidad"""

        #Verificar disponibilidad
        disponible, mensaje = DisponibilidadService.verificar_disponibilidad_completa(
            operador, maquina, fecha_inicio, fecha_fin, turno
        )

        if not disponible:
            raise ValueError(mensaje)
        
        try:
            #Reservar disponibilidad
            DisponibilidadService.reservar_disponibilidad(
                operador, maquina, fecha_inicio, fecha_fin, programa, proceso, turno
            )

            #Crear las asignaciones
            return AsignacionService.asignar_tarea_simple(
                operador=operador,
                maquina=maquina,
                proceso=proceso,
                programa=programa,
                fecha_asignacion=fecha_inicio.date()
            )
        
        except Exception as e:
            raise ValueError(f"Error al crear la asignación: {str(e)}")
        
    @staticmethod
    @transaction.atomic
    def cancelar_asignacion(asignacion_operador_id):
        """Cancela una asignacion y libera la disponibilidad"""

        try:
            asignacion = AsignacionOperador.objects.get(id=asignacion_operador_id)


            #Liberar disponibilidad del operador
            DisponibilidadOperador.objects.filter(
                operador=asignacion.operador,
                programa=asignacion.programa,
                proceso_asignado=asignacion.proceso,
            ).update(ocupado=False, programa=None, proceso_asignado=None)


            #Liberar disponibilidad de la máquina
            DisponibilidadMaquina.objects.filter(
                maquina=asignacion.maquina,
                programa=asignacion.programa,
                proceso=asignacion.proceso
            ).update(ocupada=False, programa=None, proceso=None)


            #Eliminar asignaciones
            Asignacion.objects.filter(
                programa=asignacion.programa,
                maquina=asignacion.maquina,
                operador=asignacion.operador,
                proceso=asignacion.proceso,
                fecha_asignacion=asignacion.fecha_asignacion
            ).delete()

            asignacion.delete()

        except AsignacionOperador.DoesNotExist:
            raise ValueError("Asignacion no encontrada")
        except Exception as e:
            raise ValueError(f"Error al cancelar la asignacion: {str(e)}")
        