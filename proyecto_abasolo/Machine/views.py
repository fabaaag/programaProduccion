from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from .models import TipoMaquina, EstadoOperatividad, EstadoMaquina
from JobManagement.models import Maquina, Proceso, OrdenTrabajo
from django.shortcuts import get_object_or_404
from .serializers import TipoMaquinaSerializer

class MachineListView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        """Obtener lista de máquinas con su estado y tipos"""
        try:
            # Obtener todas las máquinas existentes
            maquinas = Maquina.objects.all()

            # Obtener o crear el estado operativo por defecto
            estado_operativo, _ = EstadoOperatividad.objects.get_or_create(
                estado='OP',
                defaults={'descripcion': 'Operativa'}
            )

            # Para cada máquina, verificar si tiene estado y crearlo si no existe
            for maquina in maquinas:
                EstadoMaquina.objects.get_or_create(
                    maquina=maquina,
                    defaults={
                        'estado_operatividad': estado_operativo,
                        'disponible': True,
                        'capacidad_maxima': 0
                    }
                )
            
            # Obtener todas las máquinas con sus relaciones
            maquinas = Maquina.objects.select_related(
                'estado',
                'estado__estado_operatividad'
            ).prefetch_related(
                'estado__tipos_maquina'  # Cambio aquí para cargar los tipos
            ).all()

            # Formatear la respuesta
            data = []
            for maquina in maquinas:
                maquina_data = {
                    'id': maquina.id,
                    'codigo': maquina.codigo_maquina,
                    'descripcion': maquina.descripcion,
                    'tipos_maquina': [],  # Cambio aquí para manejar múltiples tipos
                    'estado': None,
                    'disponible': False,
                    'capacidad_maxima': 0
                }

                if hasattr(maquina, 'estado') and maquina.estado:
                    # Manejar múltiples tipos de máquina
                    maquina_data['tipos_maquina'] = [{
                        'id': tipo.id,
                        'codigo': tipo.codigo,
                        'descripcion': tipo.descripcion,
                    } for tipo in maquina.estado.tipos_maquina.all()]
                    
                    if maquina.estado.estado_operatividad:
                        maquina_data['estado'] = {
                            'id': maquina.estado.estado_operatividad.id,
                            'estado': maquina.estado.estado_operatividad.get_estado_display(),
                            'descripcion': maquina.estado.estado_operatividad.descripcion
                        }

                    maquina_data['disponible'] = maquina.estado.disponible
                    maquina_data['capacidad_maxima'] = maquina.estado.capacidad_maxima
                
                data.append(maquina_data)
            return Response(data)
        except Exception as e:
            print(f"Error en MachineListView: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class MachineDetailView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, pk):
        try:
            maquina = Maquina.objects.select_related(
                'estado',
                'estado__estado_operatividad',
                'empresa'
            ).prefetch_related(
                'estado__tipos_maquina'  # Cambio aquí
            ).get(pk=pk)

            # Obtener procesos asociados a cualquiera de los tipos de máquina
            tipos_maquina_ids = maquina.estado.tipos_maquina.values_list('id', flat=True)
            procesos_asociados = Proceso.objects.filter(
                tipos_maquina_compatibles__in=tipos_maquina_ids
            ).distinct().values('id', 'codigo_proceso', 'descripcion')

            data = {
                'id': maquina.id,
                'codigo_maquina': maquina.codigo_maquina,
                'descripcion': maquina.descripcion,
                'sigla': maquina.sigla,
                'carga': float(maquina.carga),
                'golpes': maquina.golpes,
                'empresa': {
                    'id': maquina.empresa.id,
                    'nombre': maquina.empresa.nombre
                } if maquina.empresa else None,
                'estado': {
                    'tipos_maquina': [{
                        'id': tipo.id,
                        'codigo': tipo.codigo,
                        'descripcion': tipo.descripcion,
                    } for tipo in maquina.estado.tipos_maquina.all()],
                    'estado_operatividad': {
                        'id': maquina.estado.estado_operatividad.id,
                        'estado': maquina.estado.estado_operatividad.estado,
                        'descripcion': maquina.estado.estado_operatividad.get_estado_display()
                    } if maquina.estado.estado_operatividad else None,
                    'disponible': maquina.estado.disponible,
                    'capacidad_maxima': maquina.estado.capacidad_maxima,
                    'observaciones': maquina.estado.observaciones
                },
                'procesos_asociados': list(procesos_asociados)
                # ... resto del código para ordenes_trabajo ...
            }
            return Response(data)
        except Maquina.DoesNotExist:
            return Response(
                {'error': 'Máquina no encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    
        
class TipoMaquinaView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        """Obtener todos los tipos de máquina con su información completa"""
        try:
            tipos = TipoMaquina.objects.all()
            serializer = TipoMaquinaSerializer(tipos, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DiagnosticoMaquinasView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        try:
            diagnostico = {
                'maquinas_sin_tipo': [],
                'maquinas_sin_procesos': [],
                'maquinas_con_procesos': [],
                'maquinas_en_ot': []
            }

            # Obtener todas las máquinas con sus relaciones
            maquinas = Maquina.objects.select_related(
                'estado',
                'empresa'
            ).prefetch_related(
                'estado__tipos_maquina'
            ).all()

            for maquina in maquinas:
                maquina_info = {
                    'id': maquina.id,
                    'codigo': maquina.codigo_maquina,
                    'descripcion': maquina.descripcion,
                    'empresa': maquina.empresa.nombre if maquina.empresa else 'Sin empresa',
                    'tipos': [],
                    'procesos': [],
                    'ordenes_trabajo': []
                }

                # Verificar tipos de máquina
                if hasattr(maquina, 'estado'):
                    tipos = maquina.estado.tipos_maquina.all()
                    maquina_info['tipos'] = [{
                        'id': tipo.id,
                        'codigo': tipo.codigo,
                    } for tipo in tipos]

                    # Obtener procesos asociados a los tipos
                    if tipos:
                        procesos = Proceso.objects.filter(
                            tipos_maquina_compatibles__in=tipos
                        ).distinct()
                        maquina_info['procesos'] = [{
                            'id': proceso.id,
                            'codigo': proceso.codigo_proceso,
                            'descripcion': proceso.descripcion
                        } for proceso in procesos]

                # Obtener órdenes de trabajo asociadas
                ots = OrdenTrabajo.objects.filter(
                    ruta_ot__items__maquina=maquina
                ).distinct()
                maquina_info['ordenes_trabajo'] = [{
                    'codigo_ot': ot.codigo_ot,
                    'situacion': ot.situacion_ot.descripcion,
                    'descripcion': ot.descripcion_producto_ot
                } for ot in ots]

                # Clasificar la máquina según su estado
                if not maquina_info['tipos']:
                    diagnostico['maquinas_sin_tipo'].append(maquina_info)
                elif not maquina_info['procesos']:
                    diagnostico['maquinas_sin_procesos'].append(maquina_info)
                else:
                    diagnostico['maquinas_con_procesos'].append(maquina_info)

                if maquina_info['ordenes_trabajo']:
                    diagnostico['maquinas_en_ot'].append(maquina_info)

            return Response(diagnostico)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def put(self, request, pk):
        try:
            # Obtener o crear el estado de la máquina
            maquina = get_object_or_404(Maquina, pk=pk)
            estado_maquina, created = EstadoMaquina.objects.get_or_create(
                maquina=maquina,
                defaults={
                    'estado_operatividad': EstadoOperatividad.objects.get_or_create(
                        estado='OP',
                        defaults={'descripcion': 'Operativa'}
                    )[0]
                }
            )

            # Obtener los tipos de máquina
            tipos_maquina_ids = request.data.get('tipos_maquina_ids', [])
            
            if tipos_maquina_ids:
                # Actualizar los tipos de máquina
                estado_maquina.tipos_maquina.set(tipos_maquina_ids)
                
                return Response({
                    'message': 'Tipos de máquina actualizados correctamente',
                    'tipos_maquina': list(estado_maquina.tipos_maquina.values('id', 'codigo', 'descripcion'))
                })
            else:
                return Response(
                    {'error': 'tipos_maquina_ids es requerido'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        

"""
def put(self, request, pk):
        try:
            estado_maquina = EstadoMaquina.objects.get(maquina_id=pk)
            tipos_maquina_ids = request.data.get('tipos_maquina_ids', [])  # Cambio aquí

            if tipos_maquina_ids:
                # Verificar que todos los tipos existan
                tipos_maquina = TipoMaquina.objects.filter(id__in=tipos_maquina_ids)
                if len(tipos_maquina) != len(tipos_maquina_ids):
                    return Response(
                        {'error': 'Uno o más tipos de máquina no existen'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Actualizar los tipos de máquina
                estado_maquina.tipos_maquina.set(tipos_maquina)
                
                return Response({
                    'message': 'Tipos de máquina actualizados correctamente',
                    'tipos_maquina': [{
                        'id': tipo.id,
                        'codigo': tipo.codigo,
                        'descripcion': tipo.descripcion,
                    } for tipo in tipos_maquina]
                })
            else:
                return Response(
                    {'error': 'tipos_maquina_ids es requerido'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except EstadoMaquina.DoesNotExist:
            return Response(
                {'error': 'Estado de máquina no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

"""