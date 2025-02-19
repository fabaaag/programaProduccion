from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Operador, DisponibilidadOperador, AsignacionOperador, RolOperador
from .serializers import (
    OperadorSerializer,
    DisponibilidadOperadorSerializer,
    DisponibilidadCreateSerializer,
    AsignacionOperadorProgramaSerializer,
    RolOperadorSerializer
)
from datetime import datetime, timedelta
from JobManagement.models import ProgramaProduccion, EmpresaOT, Proceso, Maquina
from JobManagement.serializers import MaquinaSerializer
from django.shortcuts import get_object_or_404


class OperadorListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        operadores = Operador.objects.select_related('rol', 'empresa').prefetch_related('maquinas').all()
        serializer = OperadorSerializer(operadores, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        try: 
            empresa_id = request.data.get('empresa')
            EmpresaOT.objects.get(id=empresa_id)
        except EmpresaOT.DoesNotExist:
            return Response(
                {'error': f'La empresa con ID {empresa_id} no existe'},
                status=status.HTTP_400_BAD_REQUEST
            )
        print('Datos recibidos: ', request.data)
        serializer = OperadorSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(creado_por=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        print('Errores de validacion:', serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

class OperadorDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        return get_object_or_404(Operador, pk=pk)
    
    def get(self, request, pk):
        operador = self.get_object(pk)
        serializer = OperadorSerializer(operador)
        return Response(serializer.data)
    
    def put(self, request, pk):
        """Actualizar operador exisente"""
        operador = self.get_object(pk)
        serializer = OperadorSerializer(operador, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save(modificado_por=request.user)
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, pk):
        """Eliminar operador"""
        operador = self.get_object(pk)
        operador.activo = False #Soft delete
        operador.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
    

class RolOperadorListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Obtener lista de roles de operador"""
        roles = RolOperador.objects.all()
        serializer = RolOperadorSerializer(roles, many=True)
        return Response(serializer.data)

    def post(self, request):
        """Crear nuevo rol de operador"""
        serializer = RolOperadorSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class OperadorMaquinasView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        """Obtener máquinas asignadas a un operador"""
        operador = get_object_or_404(Operador, pk=pk)
        maquinas = operador.maquinas.all()
        serializer = MaquinaSerializer(maquinas, many=True)
        return Response(serializer.data)
    
    def post(self, request, pk):
        """Asignar máquinas a un operador"""
        operador = get_object_or_404(Operador, pk=pk)
        maquinas_ids = request.data.get('maquinas', [])
        operador.maquinas.set(maquinas_ids)
        return Response({"message": "Máquinas asignadas correctamente"})


class DisponibilidadOperadorView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        #Obtener parámetros de fecha
        fecha_inicio = request.query_params.get('fecha_inicio')
        fecha_fin = request.query_params.get('fecha_fin')
        operador = request.query_params.get('operador_id')


from .services import AsignacionService
from .serializers import AsignacionOperadorProgramaSerializer

class AsignacionOperadorProgramaView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Crea una nueva asignación de tarea con verificación de disponibilidad
        Requiere fecha_inicio, fecha_fin y opcionalmente turno."""

        try:
            #Validar que todos los campos requeridos estén presentes
            required_fields = ['operador', 'maquina_id', 'proceso_id', 'programa_id', 'fecha_inicio', 'fecha_fin']

            for field in required_fields:
                if field not in request.data:
                    return Response(
                        {'error': f'El campo {field} es requerido'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
            #Obtener y validar objetos
            operador =  Operador.objects.get(id=request.data['operador_id'])
            maquina = Maquina.objects.get(id=request.data['maquina_id'])
            proceso = Proceso.objects.get(id=request.data['proceso_id'])
            programa = ProgramaProduccion.objects.get(id=request.data['programa_id'])

            #Convertir fechas
            try:
                fecha_inicio = datetime.strptime(request.data['fecha_inicio'], '%d-%m-%Y %H:$M:$S')
                fecha_fin = datetime.strptime(request.data['fecha_fin'], '%d-%m-%Y %H:$M:$S')
            except ValueError:
                return Response(
                    {'error': 'Formato de fecha inválido. Use el formato dd-mm-yyyy hh:mm:ss'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            #Validar que fecha_fin sea posterior a fecha_inicio
            if fecha_fin <= fecha_inicio:
                return Response(
                    {'error': 'La fecha de fin debe ser posterior a la fecha de inicio'},
                    status=status.HTTP_400_BAD_REQUEST
                )
    
            turno = request.data.get('turno')

            #Crear la asignacion
            asignacion_operador, asignacion_job = AsignacionService.asignar_tarea_completa(
                operador=operador,
                maquina=maquina,
                proceso=proceso,
                programa=programa,
                fecha_inicio=fecha_inicio,
                fecha_fin=fecha_fin,
                turno=turno
            )

            #Serializar la respuesta
            serializer = AsignacionOperadorProgramaSerializer(asignacion_operador)

            return Response({
                'message': 'Asignación creada exitósamente',
                'asignacion': serializer.data
            }, status=status.HTTP_201_CREATED)
        
        except (Operador.DoesNotExist, Maquina.DoesNotExist, Proceso.DoesNotExist, ProgramaProduccion.DoesNotExist) as e:
            return Response(
                {'error': 'Objeto no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'Error inesperado: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def get(self, request, programa_id=None):
        """Obtiene las asignaciones de un programa específico o de un operador especifico"""
        try:
            if programa_id:
                programa = ProgramaProduccion.objects.get(id=programa_id)
                asignaciones = AsignacionService.obtener_asignaciones_programa(programa)
            else:
                #Si se proporciona operador_id en query_params
                operador_id = request.query_params.get('operador_id')
                if operador_id: 
                    operador = Operador.objects.get(id=operador_id)
                    asignaciones = AsignacionService.obtener_asignaciones_operador(operador)
                else:
                    return Response(
                        {'error': 'se requiere programa_id u operador_id'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            serializer = AsignacionOperadorProgramaSerializer(asignaciones, many=True)
            return Response(serializer.data)
        
        except(ProgramaProduccion.DoesNotExist, Operador.DoesNotExist):
            return Response(
                {'error': 'Objecto no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Error inesperado: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def delete(self, request, asignacion_id):
        """Cancela una asignacion existente"""
        try:
            AsignacionService.cancelar_asignacion(asignacion_id)
            return Response({
                'message': 'Asignacion cancelada exitósamente'
            })
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_404_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'Error inesperadro: {str(e)}'},
                status=status.HTPP_500_INTERNAL_SERVER_ERROR
            )