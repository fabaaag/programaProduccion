from django.http import JsonResponse
from django.db import IntegrityError, transaction
from django.core.exceptions import MultipleObjectsReturned, ObjectDoesNotExist
from rest_framework import generics
from rest_framework.response import Response

from .serializers import OrdenTrabajoSerializer, ProgramaProduccionSerializer
from .models import OrdenTrabajo, RutaOT, TipoOT, SituacionOT, EmpresaOT, Proceso, Maquina, ItemRuta, ProgramaOrdenTrabajo, ProgramaProduccion, ItemRutaOperador
from Product.models import MeasurementUnit, MateriaPrima
from Client.models import Cliente
from Operator.models import Operador, DisponibilidadOperador

from datetime import datetime, timedelta, date, time
import csv, chardet, pytz


############# Importes de RutaOT y OrdenTrabajo que tengan situación Pendiente o Sin terminar ###############
from datetime import datetime, timedelta, date
import csv, chardet

def importar_ordenes_trabajo(path_file):
    created_count = 0
    updated_count = 0
    failed_count = 0
    errors = []

    with open(path_file, 'rb') as f:
        result = chardet.detect(f.read())
        encoding = result['encoding']

    print(f'Usando la codificación detectada: {encoding}')
    try:
        with open(path_file, 'r', encoding=encoding) as file:
            reader = csv.reader(file, delimiter='$')
            next(reader)

            for row in reader:
                #if row[2].strip() in ['P', 'S']:
                try:
                    if len(row) != 24:
                        print(f"Fila inválida: {row}")
                        continue
                    
                    codigo_ot = int(row[0].strip())
                    tipo_ot_codigo = row[1].strip()
                    situacion_ot_codigo = row[2].strip()
                    try:
                        fecha_emision = datetime.strptime(row[3].strip(), '%Y/%m/%d')
                    except ValueError:
                        fecha_emision = None

                    try:
                        fecha_proc = datetime.strptime(row[4].strip(), '%Y/%m/%d')
                    except ValueError:
                        fecha_proc = None

                    try:
                        fecha_termino = datetime.strptime(row[5].strip(), '%Y/%m/%d')
                    except ValueError:
                        fecha_termino = None

                    cliente_codigo = row[7].strip()
                    nro_nota_venta_ot = row[8].strip()
                    item_nota_venta = int(row[9].strip())
                    referencia_nota_venta = int(row[10].strip())
                    codigo_producto_inicial = row[11].strip()
                    codigo_producto_salida = row[12].strip()
                    descripcion_producto_ot = row[13].strip()

                    try:
                        cantidad_str = row[14].strip()
                        puntos = puntos = ['', ' ', '.', '. ',' .']

                        if cantidad_str in puntos:
                            cantidad = 0.0
                        else:
                            cantidad = float(cantidad_str)
                    except (ValueError, IndexError) as e:
                        print(f'Error al convertir la cantidad en la fila: {row}: {str(e)}')
                        cantidad = 0.0

                    unidad_medida_codigo = row[15].strip()

                    try:
                        cantidad_avance_str = row[16].strip()
                        puntos = ['', ' ', '.', '. ',' .']
                        if cantidad_avance_str in puntos:
                            cantidad_avance = 0.0
                        else:
                            cantidad_avance = float(cantidad_avance_str)
                    except(ValueError, IndexError):
                        print(f'Error al convertir la cantidad_avance en la fila: {row} : {str(e)}')
                        cantidad_avance = 0.0

                    try:
                        peso_unitario_str = row[17].strip()
                        puntos = ['', ' ', '.', '. ',' .']
                        if peso_unitario_str in puntos:
                            peso_unitario = 0.0
                        else: 
                            peso_unitario = float(peso_unitario_str)
                    except(ValueError, IndexError) as e:
                        print(f'Error al convertir el peso unitario en la fila: {row} : {str(e)}')
                        peso_unitario = 0.0

                    materia_prima_codigo = row[18].strip()

                    try:
                        cantidad_materia_prima_str = row[17].strip()
                        puntos = ['', ' ', '.', '. ',' .']
                        if cantidad_materia_prima_str in puntos:
                            cantidad_materia_prima = 0.0
                        else:
                            cantidad_materia_prima = float(cantidad_materia_prima_str)
                    
                    except(ValueError, IndexError) as e:
                        print(f'Error al convertir la cantidad de materia prima en la fila: {row} : {str(e)}')
                        cantidad_materia_prima = 0.0

                    unidad_materia_prima_codigo = row[20].strip()

                    observacion_ot = row[21].strip()
                    empresa_codigo = row[22].strip()

                    multa_valor = row[23].strip()
                    
                    tipo_ot, _ = TipoOT.objects.get_or_create(codigo_tipo_ot=tipo_ot_codigo)

                    situacion_ot, _ = SituacionOT.objects.get_or_create(codigo_situacion_ot=situacion_ot_codigo)

                    if cliente_codigo != '000000' and len(cliente_codigo) < 7 and cliente_codigo != '':
                        cliente, _ = Cliente.objects.get_or_create(codigo_cliente=cliente_codigo)
                    else:
                        cliente = None

                    unidad_medida, _ = MeasurementUnit.objects.get_or_create(codigo_und_medida=unidad_materia_prima_codigo)

                    materia_prima, _ = MateriaPrima.objects.get_or_create(codigo=materia_prima_codigo)

                    unidad_medida_mprima, _ = MeasurementUnit.objects.get_or_create(codigo_und_medida=unidad_materia_prima_codigo)

                    empresa, _ = EmpresaOT.objects.get_or_create(codigo_empresa=empresa_codigo)

                    multa = multa_valor == 'M'

                    if situacion_ot.codigo_situacion_ot in ['P', 'S']:
                        orden_trabajo, created = OrdenTrabajo.objects.update_or_create(
                        codigo_ot=codigo_ot,
                        defaults={
                            'tipo_ot': tipo_ot,
                            'situacion_ot': situacion_ot,
                            'fecha_emision': fecha_emision,
                            'fecha_proc': fecha_proc,
                            'fecha_termino': fecha_termino,
                            'cliente': cliente,
                            'nro_nota_venta_ot': nro_nota_venta_ot,
                            'item_nota_venta': item_nota_venta,
                            'referencia_nota_venta': referencia_nota_venta,
                            'codigo_producto_inicial': codigo_producto_inicial,
                            'codigo_producto_salida': codigo_producto_salida,
                            'descripcion_producto_ot': descripcion_producto_ot,
                            'cantidad': cantidad,
                            'unidad_medida': unidad_medida,
                            'cantidad_avance': cantidad_avance,
                            'peso_unitario': peso_unitario,
                            'materia_prima': materia_prima,
                            'cantidad_mprima': cantidad_materia_prima,
                            'unidad_medida_mprima': unidad_medida_mprima,
                            'observacion_ot': observacion_ot,
                            'empresa': empresa,
                            'multa': multa,
                        }
                        )
                        if created:
                            print(f'Orden de trabajo {codigo_ot} creada.')
                            created_count+=1
                        else:
                            print(f'Orden de trabajo {codigo_ot} actualizada.')
                            updated_count+=1
                    else:
                        print('Situación no correspondiente. Saltando...')
                        continue
                    

                except (ValueError, IntegrityError) as e:
                    print(f'Error al procesar la fila {row}: {str(e)}')
                    failed_count += 1
                    errors.append(str(e))

                except Exception as e:
                    print(f'Error inesperado al procesar la fila {row}: {str(e)}')
                    failed_count += 1
                    errors.append(str(e))
    except UnicodeDecodeError:
        print(f'Error de codificación con {encoding}')
    
    return {
        'success': True,
        'created_count': created_count,
        'updated_count': updated_count,
        'failed_count': failed_count,
        'errors': errors
    }

def importar_ots_from_file(request):
    path_file = 'W:\\ot.txt'
    result = importar_ordenes_trabajo(path_file)
    if result['success']:
        return JsonResponse({
            'message': 'OrdenTrabajo instances imported successfully',
            'created_count': result['created_count'],
            'updated_count': result['updated_count'],
            'failed_count': result['failed_count'],
            'errors': result['errors'],
        }, status=200)
    else:
        return JsonResponse({'error': result['errors']}, status=500)

def importar_rutas_ot(path_file):
    created_count = 0
    updated_count = 0
    failed_count = 0
    errors = []
    ordenes = OrdenTrabajo.objects.all()
    codigos_ot = []
    for orden in ordenes:
        codigos_ot.append(orden.codigo_ot)

    with open(path_file, 'rb') as f:
        resultado = chardet.detect(f.read())
        encoding = resultado['encoding']
    print(f'Usando la codificación detectada: {encoding}')
    try:
        with open(path_file, 'r', encoding=encoding) as file:
            reader = csv.reader(file, delimiter='@')
            next(reader)

    
            for idx, row in enumerate(reader):
                try:
                    if len(row) != 9:
                        print(f'Fila inválida: {idx}')
                        continue
                    
                    codigo_ot = int(row[0].strip())
                    if codigo_ot in codigos_ot:
                        item = int(row[1].strip())

                        codigo_proceso = row[2].strip()
                        codigo_maquina = row[3].strip()

                        estandar = int(row[4].strip())
                        try:
                            cantidad_pedido_str = row[5].strip()
                            puntos = ['', ' ', '.', '. ',' .']

                            if cantidad_pedido_str in puntos:
                                cantidad_pedido = 0.0
                            else:
                                cantidad_pedido = float(cantidad_pedido_str)
                        except(ValueError, IndexError) as e:
                            print(f'Error al convretir la cantidad_pedido en la fila: {idx} - {str(e)}')

                        try:
                            cantidad_terminado_str = row[6].strip()
                            puntos = ['', ' ', '.', '. ',' .']

                            if cantidad_terminado_str in puntos:
                                cantidad_terminado = 0.0
                            else:
                                cantidad_terminado = float(cantidad_terminado_str)
                        except(ValueError, IndexError) as e:
                            print(f'Error al convertir la cantidad_terminado en la fila: {idx} - {str(e)}')

                        try:
                            cantidad_terminado_str = row[6].strip()
                            puntos = ['', ' ', '.', '. ',' .']

                            if cantidad_terminado_str in puntos:
                                cantidad_terminado = 0.0
                            else:
                                cantidad_terminado = float(cantidad_terminado_str)
                        except(ValueError, IndexError) as e:
                            print(f'Error al convertir la cantidad_terminado en la fila: {idx} - {str(e)}')

                        try:
                            cantidad_perdida_str = row[7].strip()
                            puntos = ['', ' ', '.', '. ',' .']

                            if cantidad_perdida_str in puntos:
                                cantidad_perdida = 0.0
                            else:
                                cantidad_perdida = float(cantidad_perdida_str)

                        except(ValueError, IndexError) as e:
                            print(f'Error al convertir la cantidad_perdida en la fila: {row} - {str(e)}')

                        try:
                            terminado_sin_actualizar_str = row[8].strip()
                            puntos = ['', ' ', '.', '. ', ' .']

                            if terminado_sin_actualizar_str in puntos:
                                terminado_sin_actualizar = 0.0
                            else:
                                terminado_sin_actualizar = float(terminado_sin_actualizar_str)
                        
                        except(ValueError, IndexError) as e: 
                            print(f'Error al convertir el campo terminado_sin_actualizar en la fila: {idx} - {str(e)}')

                        try:
                            three_months_ago = datetime.now().date() - timedelta(days=90)
                        except:
                            continue
                        
                        
                        orden_trabajo = ordenes.get(codigo_ot=codigo_ot)

                        situacion_ot = orden_trabajo.situacion_ot.codigo_situacion_ot
                        fecha_termino = orden_trabajo.fecha_termino
                        

                        ruta_ot, created_ruta = RutaOT.objects.get_or_create(orden_trabajo=orden_trabajo)
                        ### crear rutas que matcheen con la ots existentes en el sistema.
                        try:
                            maquina = Maquina.objects.get(codigo_maquina=codigo_maquina)
                        except Maquina.DoesNotExist:
                            continue

                        try:
                            proceso = Proceso.objects.get(codigo_proceso=codigo_proceso)
                        except Proceso.DoesNotExist:
                            continue
                        except MultipleObjectsReturned:
                            proceso = Proceso.objects.filter(codigo_proceso=codigo_proceso).first()

                        try:
                            with transaction.atomic():
                                item_ruta, created_item = ItemRuta.objects.get_or_create(
                                    ruta=ruta_ot,
                                    item=item,
                                    defaults={
                                        'maquina': maquina,
                                        'proceso': proceso,
                                        'estandar': estandar,
                                        'cantidad_pedido': cantidad_pedido,
                                        'cantidad_terminado_proceso': cantidad_terminado,
                                        'cantidad_perdida_proceso': cantidad_perdida,
                                        'terminado_sin_actualizar' : terminado_sin_actualizar,

                                    }
                                )

                                if not created_item:
                                    if situacion_ot in ['C', 'A']:
                                        pass
                                    elif situacion_ot == 'T' and fecha_termino <= three_months_ago and fecha_termino is not None:
                                        item_ruta.cantidad_pedido = cantidad_pedido
                                        item_ruta.cantidad_terminado_proceso = cantidad_terminado
                                        item_ruta.cantidad_perdida_proceso = cantidad_perdida
                                        item_ruta.terminado_sin_actualizar = terminado_sin_actualizar
                                        item_ruta.save()

                                    elif situacion_ot not in ['C', 'A', 'T']:
                                        item_ruta.cantidad_pedido = cantidad_pedido
                                        item_ruta.cantidad_terminado_proceso = cantidad_terminado
                                        item_ruta.cantidad_perdida_proceso = cantidad_perdida
                                        item_ruta.terminado_sin_actualizar = terminado_sin_actualizar
                                        item_ruta.save()

                                    print(f'ItemRuta de OT {item_ruta} actualizado.')
                                    updated_count +=1
                                else:
                                    print(f'ItemRuta de OT {item_ruta} creada.')
                                    created_count +=1
                        except Exception as e:
                            print(f'Error inesperado al procesar la fila {row}: {str(e)}')
                            failed_count += 1
                            errors.append(str(e))
                    else:
                        print(f'Orden {codigo_ot} no válida.')
                        continue
                    
                except (ValueError, IntegrityError) as e:
                    print(f'Error al procesar la fila: {row} : {str(e)}')
                    failed_count += 1
                    errors.append(str(e))
                except Exception as e:
                    print(f'Error inesperado al procesar la fila {row}: {str(e)}')
                    failed_count += 1
                    errors.append(str(e))
    except UnicodeDecodeError:
        print(f'Error de codificación con {encoding}')

    return {
        'success': True,
        'created_count': created_count,
        'updated_count': updated_count,
        'failed_count': failed_count,
        'errors': errors
    }

def importar_rutaot_file(request):
    path_file = 'W:\\ruta_ot.txt'
    result = importar_rutas_ot(path_file)
    if result['success']:
        return JsonResponse({
            'message': 'RutaOT instances imported successfully',
            'created_count': result['created_count'],
            'updated_count': result['updated_count'],
            'failed_count': result['failed_count'],
            'errors': result['errors'],
        }, status=200)
    else:
        return JsonResponse({'error': result['errors']}, status=500)



# Create your views here.
class OTView(generics.ListAPIView):
    serializer_class = OrdenTrabajoSerializer
    queryset = OrdenTrabajo.objects.all()

    
from rest_framework.views import APIView

class ProgramListView(generics.ListAPIView):
    queryset = ProgramaProduccion.objects.all()
    serializer_class = ProgramaProduccionSerializer


from django.utils.dateparse import parse_date, parse_datetime
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from django.utils.dateparse import parse_date
from django.core.exceptions import ObjectDoesNotExist, ValidationError
from rest_framework.exceptions import NotFound
from .models import ProgramaProduccion, ProgramaOrdenTrabajo, OrdenTrabajo
from .serializers import ProgramaProduccionSerializer

class ProgramCreateView(APIView):
    def post(self, request, *args, **kwargs):
        data = request.data
        print(data)
        for ot_id in data.get('ordenes', []):
            print(f"Verificando OT con ID: {ot_id}")  # Log
            try:
                orden_trabajo = OrdenTrabajo.objects.get(id=ot_id)
                print(f"OT encontrada: {orden_trabajo}")
            except OrdenTrabajo.DoesNotExist:
                print(f"OT con ID {ot_id} no encontrada")
                raise NotFound(f"Orden de trabajo con ID {ot_id} no encontrada.")

        try:
            with transaction.atomic():
                # Crear ProgramaProduccion
                fecha_inicio = parse_date(data.get('fecha_inicio'))
                fecha_fin = parse_date(data.get('fecha_termino'))

                if not fecha_inicio or not fecha_fin:
                    return Response(
                        {"detail": "Fechas de inicio o fin no válidas."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                print("fecha pasa")

                programa = ProgramaProduccion.objects.create(
                    nombre=data.get('nombre'),
                    fecha_inicio=fecha_inicio,
                    fecha_fin=fecha_fin
                )
                print("programa pasa")
                # Iterar sobre las órdenes de trabajo y crear relaciones
                for ot_data in data.get('ordenes', []):  # Cambiar 'ordenes_trabajo' a 'ordenes' si corresponde
                    print("entra en el bucle for ot_data in data.get")
                    try:
                        orden_trabajo = OrdenTrabajo.objects.get(id=ot_data)
                        print("encuentra la ot")
                    except ObjectDoesNotExist:
                        raise NotFound(f"Orden de trabajo con código {ot_data['codigo_ot']} no encontrada.")

                    # Actualizar la ruta de la OT si es necesario
                    """if 'ruta_ot' in ot_data and 'items' in ot_data['ruta_ot']:
                        print("entra en la ruta")
                        orden_trabajo.update_item_rutas(ot_data['ruta_ot']['items'])"""

                    # Crear la relación ProgramaOrdenTrabajo
                    pot = ProgramaOrdenTrabajo.objects.create(
                        programa=programa,
                        orden_trabajo=orden_trabajo,
                        prioridad=0,
                    )
                    print(f"Relacion creada: {pot}")
                    # Manejar asignaciones adicionales (opcional)
                    #self.handle_operador_assignments(ot_data, programa)
                    #self.handle_machine_availability(ot_data, programa)

                # Serializar y devolver respuesta
                serializer = ProgramaProduccionSerializer(programa)
                return Response(serializer.data, status=status.HTTP_201_CREATED)

        except ValidationError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response(
                {"detail": "Ha ocurrido un error en el servidor.", "error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def handle_operador_assignments(self, ot_data, programa):
        # Implementa esta lógica si es necesaria
        pass

    def handle_machine_availability(self, ot_data, programa):
        # Implementa esta lógica si es necesaria
        pass

        
    def update_ruta_ot_items(self, ruta_ot, items_data):
    #print("Items data:", items_data)

        for item_data in items_data:
            try:
                item = ruta_ot.items.get(item=item_data['item'])
                #print("Item instance:", item)
                # Update the machine if 'maquinaSelected' is provided
                if 'maquina' in item_data:
                    item.maquina = Maquina.objects.get(id=item_data['maquina'])
                # Update the standard if 'estandar' is provided
                if 'estandar' in item_data:
                    item.estandar = item_data['estandar']
                item.save()  # Save the changes to the database
            except Exception as e:
                print("Error updating ItemRuta:", e)


    def handle_operador_assignments(self, ot_data, programa):
        #print("handle_operador_assignments method called")
        #print("ot_data:", ot_data)
        #print("programa:", programa)
        inicio_tz = datetime.datetime.combine(self.fecha_inicio, datetime.time(0, 0, 0))
        fin_tz = datetime.datetime.combine(self.fecha_fin, datetime.time(0, 0, 0))

        inicio_tz = pytz.timezone('America/Santiago').localize(inicio_tz)
        fin_tz = pytz.timezone('America/Santiago').localize(fin_tz)


        ruta_ot = ot_data.get('ruta_ot', {})
        for item_data in ruta_ot.get('items', []):
            orden_trabajo = OrdenTrabajo.objects.get(codigo_ot=ot_data['codigo_ot'])
            # Get the RutaOT instance using the OrdenTrabajo instance

            ruta_ot = orden_trabajo.ruta_ot

            operador = item_data.get('operador', None)
            if not operador:
                continue

            operador = Operador.objects.get(id=item_data['operador'])
            item_ruta = ItemRuta.objects.filter(ruta=ruta_ot, item=item_data['item']).first()
            ItemRutaOperador.objects.update_or_create(
                item_ruta=item_ruta,
                programa_produccion=programa,
                operador=operador
            )
            #print("ItemRutaOperador created or updated successfully")

            
        for operador in Operador.objects.all():

            DisponibilidadOperador.objects.update_or_create(
                    operador=operador,
                    fecha_inicio=inicio_tz,
                    fecha_fin=fin_tz,
                    defaults={'ocupado': True, 'programa': programa}
            )



def is_working_day(date):
    """Determina si una fecha es día laboral (L-V)"""
    return date.weekday() < 5  # 0-4 son Lunes a Viernes

def get_next_working_day(date):
    """Obtiene el siguiente día laboral"""
    next_day = date + timedelta(days=1)
    while not is_working_day(next_day):
        next_day += timedelta(days=1)
    return next_day

def calculate_working_days(start_date, cantidad, estandar):
    """Calcula los intervalos de trabajo diarios considerando solo días laborales"""
    current_date = start_date
    # Si la fecha inicial no es día laboral, mover al siguiente día laboral
    while not is_working_day(current_date):
        current_date = get_next_working_day(current_date)
    
    remaining_units = cantidad
    intervals = []
    
    while remaining_units > 0:
        if is_working_day(current_date):
            units_today = min(remaining_units, estandar)
            # Crear fecha con hora de inicio (8:00) y fin (17:00) del día
            start_datetime = datetime.combine(current_date, time(7, 45))  # 8:00 AM
            end_datetime = datetime.combine(current_date, time(17, 45))   # 5:00 PM
            
            intervals.append({
                'fecha': current_date,
                'fecha_inicio': start_datetime,
                'fecha_fin': end_datetime,
                'unidades': units_today,
                'unidades_restantes': remaining_units - units_today
            })
            remaining_units -= units_today
        
        current_date = get_next_working_day(current_date)
    
    return {
        'start_date': intervals[0]['fecha'] if intervals else start_date,
        'end_date': intervals[-1]['fecha'] if intervals else start_date,
        'intervals': intervals
    }

def generate_routes_data(program):
    """Genera los datos de rutas para el timeline basado en un programa de producción."""
    program_ots = ProgramaOrdenTrabajo.objects.filter(
        programa=program
    ).select_related(
        'orden_trabajo',
        'orden_trabajo__ruta_ot'
    ).prefetch_related(
        'orden_trabajo__ruta_ot__items',
        'orden_trabajo__ruta_ot__items__proceso',
        'orden_trabajo__ruta_ot__items__maquina'
    ).order_by('prioridad')

    groups = []
    items = []

    for prog_ot in program_ots:
        ot = prog_ot.orden_trabajo
        ruta = getattr(ot, 'ruta_ot', None)

        if not ruta:
            continue

        ot_group = {
            "id": f"ot_{ot.id}",
            "orden_trabajo_codigo_ot": ot.codigo_ot,
            "descripcion": ot.descripcion_producto_ot,
            "procesos": []
        }

        ruta_items = ruta.items.all().order_by('item')
        
        fecha_inicio = ot.fecha_emision or ot.fecha_proc or program.fecha_inicio
        fecha_actual = fecha_inicio

        for item_ruta in ruta_items:
            proceso = item_ruta.proceso
            maquina = item_ruta.maquina

            proceso_id = f"proc_{item_ruta.id}"
            ot_group["procesos"].append({
                "id": proceso_id,
                "descripcion": f"{proceso.descripcion} - {maquina.descripcion}",
                "item": item_ruta.item
            })

            if item_ruta.estandar <= 0:
                item_ruta.estandar = 500

            # Calcular fechas e intervalos
            dates_data = calculate_working_days(
                fecha_actual,
                item_ruta.cantidad_pedido,
                item_ruta.estandar
            )

            # Crear un item por cada intervalo
            for idx, interval in enumerate(dates_data['intervals']):
                items.append({
                    "id": f'item_{item_ruta.id}_{idx}',
                    "ot_id": f"ot_{ot.id}",
                    "proceso_id": proceso_id,
                    "name": f"{proceso.descripcion} - {interval['unidades']} de {item_ruta.cantidad_pedido} unidades",
                    "start_time": interval['fecha_inicio'].strftime('%Y-%m-%d %H:%M:%S'),
                    "end_time": interval['fecha_fin'].strftime('%Y-%m-%d %H:%M:%S'),
                    "cantidad_total": float(item_ruta.cantidad_pedido),
                    "cantidad_intervalo": float(interval['unidades']),
                    "unidades_restantes": float(interval['unidades_restantes']),
                    "estandar": item_ruta.estandar
                })

            fecha_actual = get_next_working_day(dates_data['end_date'])

        groups.append(ot_group)

    return {
        "groups": groups,
        "items": items
    }


class UpdatePriorityView(APIView):
    def put(self, request, pk): 
        try:
            # Log de los datos recibidos
            print("Datos recibidos:", request.data)
            
            programa = ProgramaProduccion.objects.get(id=pk)
            order_data = request.data.get("order_ids", [])
            recalculate_dates = request.data.get("recalculate_dates", False)

            if not isinstance(order_data, list):
                return Response(
                    {"error": "Formato incorrecto. 'order_ids' debe ser una lista de IDs."}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            success = {'updated': 0, 'errors': 0}
            error_details = []
            
            with transaction.atomic():
                for order in order_data:
                    try:
                        print(f"Procesando orden: {order}")
                        prog_ot = ProgramaOrdenTrabajo.objects.get(
                            programa=programa,
                            orden_trabajo_id=order['id']
                        )
                        prog_ot.prioridad = order['priority']
                        prog_ot.save()
                        success['updated'] += 1

                        if 'procesos' in order:
                            for proceso in order['procesos']:
                                try:
                                    item_ruta = ItemRuta.objects.get(id=proceso['id'])
                                    item_ruta.estandar = proceso.get('estandar', item_ruta.estandar)
                                    item_ruta.save()
                                except ItemRuta.DoesNotExist as e:
                                    error_details.append(f"ItemRuta {proceso['id']} no encontrado")
                                    success['errors'] += 1
                                except Exception as e:
                                    error_details.append(f"Error al actualizar ItemRuta {proceso['id']}: {str(e)}")
                                    success['errors'] += 1

                    except ProgramaOrdenTrabajo.DoesNotExist as e:
                        error_details.append(f"ProgramaOrdenTrabajo no encontrado para orden {order['id']}")
                        success['errors'] += 1
                    except Exception as e:
                        error_details.append(f"Error procesando orden {order['id']}: {str(e)}")
                        success['errors'] += 1

                if recalculate_dates:
                    try:
                        routes_data = generate_routes_data(programa)
                        
                        # Obtener datos actualizados de las OTs
                        ordenes_trabajo = []
                        programa_ots = ProgramaOrdenTrabajo.objects.filter(
                            programa=programa
                        ).select_related(
                            'orden_trabajo',
                            'orden_trabajo__ruta_ot'
                        ).prefetch_related(
                            'orden_trabajo__ruta_ot__items',
                            'orden_trabajo__ruta_ot__items__proceso',
                            'orden_trabajo__ruta_ot__items__maquina'
                        ).order_by('prioridad')

                        for prog_ot in programa_ots:
                            ot = prog_ot.orden_trabajo
                            ot_data = {
                                'orden_trabajo': ot.id,
                                'orden_trabajo_codigo_ot': ot.codigo_ot,
                                'orden_trabajo_descripcion_producto_ot': ot.descripcion_producto_ot,
                                'procesos': []
                            }
                            
                            ruta = getattr(ot, 'ruta_ot', None)
                            if ruta:
                                for item in ruta.items.all().order_by('item'):
                                    ot_data['procesos'].append({
                                        'id': item.id,
                                        'item': item.item,
                                        'codigo_proceso': item.proceso.codigo_proceso,
                                        'descripcion': item.proceso.descripcion,
                                        'maquina_id': item.maquina.id if item.maquina else None,
                                        'cantidad': item.cantidad_pedido,
                                        'estandar': item.estandar
                                    })
                            
                            ordenes_trabajo.append(ot_data)

                        return Response({
                            "message": "Prioridades y estándares actualizados correctamente.",
                            "result": success,
                            "error_details": error_details,
                            "routes_data": routes_data,
                            "ordenes_trabajo": ordenes_trabajo
                        }, status=status.HTTP_200_OK)
                    
                    except Exception as e:
                        error_details.append(f"Error al recalcular fechas: {str(e)}")
                        return Response({
                            "message": "Error al recalcular fechas",
                            "result": success,
                            "error_details": error_details
                        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
                return Response({
                    "message": "Prioridades y estándares actualizados correctamente.",
                    "result": success,
                    "error_details": error_details
                }, status=status.HTTP_200_OK)

        except ProgramaProduccion.DoesNotExist:
            return Response(
                {"error": f"El programa con ID {pk} no existe."}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            print(f"Error inesperado: {str(e)}")
            return Response({
                "message": "Error al actualizar las prioridades y estándares.",
                "error": str(e),
                "error_details": error_details
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def update_prio(self, pk, order_ids):
        success = {'success': 0, 'updated': 0, 'errors': 0}
        try:
            programa = ProgramaProduccion.objects.get(id=pk)
        except ProgramaProduccion.DoesNotExist:
            return {"error": f"El programa con ID {pk} no existe."}

        # Obtener las órdenes de trabajo asociadas al programa
        programas_ot = ProgramaOrdenTrabajo.objects.filter(programa=programa, orden_trabajo__id__in=order_ids)

        for idx, order_id in enumerate(order_ids):
            # Verificar si la orden de trabajo está asociada al programa
            prog_ot = programas_ot.filter(orden_trabajo__id=order_id).first()
            if prog_ot:
                prog_ot.prioridad = idx + 1  # Actualizar prioridad
                prog_ot.save()
                success['updated'] += 1
            else:
                success['errors'] += 1  # Orden de trabajo no encontrada en el programa

        if success['errors']:
            return {"message": "Algunas prioridades no se actualizaron correctamente.", "result": success}
        
        return {"message": "Prioridades actualizadas correctamente.", "result": success}
    
    def delete(self, request, pk):
        order_ids = request.data.get("order_ids", [])
        print(f"Recibiendo solicitud de eliminación para order_ids: {order_ids}")
        
        if not isinstance(order_ids, list):
            return Response(
                {"error": "Formato incorrecto. 'order_ids' debe ser una lista de IDs."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            programa = ProgramaProduccion.objects.get(id=pk)
            print(f"Programa encontrado: {programa}")
        except ProgramaProduccion.DoesNotExist:
            return Response(
                {"error": f"El programa con ID {pk} no existe."}, 
                status=status.HTTP_404_NOT_FOUND
            )

        success = {'deleted': 0, 'errors': 0}
        errores = {'descripcion':''}
        for order_id in order_ids:
            try:
                print(f"Buscando ProgramaOrdenTrabajo con programa_id={pk} y orden_trabajo_id={order_id}")
                prog_ot = ProgramaOrdenTrabajo.objects.get(
                    programa=programa, 
                    orden_trabajo__id=order_id
                )
                print(f"ProgramaOrdenTrabajo encontrado: {prog_ot}")
                prog_ot.delete()
                print(f"ProgramaOrdenTrabajo eliminado exitosamente")
                success['deleted'] += 1
            except ProgramaOrdenTrabajo.DoesNotExist:
                print(f"No se encontró ProgramaOrdenTrabajo para orden_trabajo_id={order_id}")
                success['errors'] += 1
                errores['descripcion'] = f"No se encontró ProgramaOrdenTrabajo para orden_trabajo_id={order_id}"
            except Exception as e:
                print(f"Error inesperado al eliminar orden: {str(e)}")
                success['errors'] += 1
                errores['descripcion'] = f"Error inesperado al eliminar orden: {str(e)}"

        print(f"Resultado final: {success}")
        print(f"Errores: {errores}")
        return Response({
            "message": "Órdenes procesadas", 
            "result": success,
            "errors": errores
        }, status=status.HTTP_200_OK)



from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from datetime import timedelta
from collections import defaultdict
from JobManagement.models import ProgramaProduccion, RutaOT
from JobManagement.serializers import ProgramaProduccionSerializer
from django.views.decorators.csrf import csrf_exempt

class ProgramDetailView(APIView):
    def get(self, request, pk):
        try:
            program = ProgramaProduccion.objects.get(id=pk)
            serializer = ProgramaProduccionSerializer(program)

            program_ots = ProgramaOrdenTrabajo.objects.filter(
                programa=program
            ).select_related(
                'orden_trabajo',
                'orden_trabajo__ruta_ot'
            ).prefetch_related(
                'orden_trabajo__ruta_ot__items',
                'orden_trabajo__ruta_ot__items__proceso',
                'orden_trabajo__ruta_ot__items__maquina'
            ).order_by('prioridad')

            ordenes_trabajo = []
            for prog_ot in program_ots:
                ot = prog_ot.orden_trabajo
                ruta =getattr(ot, 'ruta_ot', None)

                if not ruta:
                    continue

                #Obtener y ordenar los items de la ruta
                ruta_items = ruta.items.all().order_by('item')

                #Preparar los datos de los procesos
                procesos = []
                for item_ruta in ruta_items:
                    procesos.append({
                        'id': item_ruta.id,
                        'item': item_ruta.item,
                        'codigo_proceso': item_ruta.proceso.codigo_proceso,
                        'descripcion': item_ruta.proceso.descripcion,
                        'maquina_id': item_ruta.maquina.id,
                        'maquina_descripcion': item_ruta.maquina.descripcion,
                        'cantidad': item_ruta.cantidad_pedido,
                        'estandar': item_ruta.estandar
                    })

                ot_data = {
                    'orden_trabajo': ot.id,
                    'orden_trabajo_codigo_ot': ot.codigo_ot,
                    'orden_trabajo_descripcion_producto_ot': ot.descripcion_producto_ot,
                    'orden_trabajo_fecha_termino': ot.fecha_termino,
                    'procesos': procesos,
                }

                ordenes_trabajo.append(ot_data)

            groups = []
            items = []         
            
            for prog_ot in program_ots:
                ot = prog_ot.orden_trabajo
                ruta = getattr(ot, 'ruta_ot', None)

                if not ruta:
                    continue

                ot_group = {
                    "id": f"ot_{ot.id}",
                    "orden_trabajo_codigo_ot": ot.codigo_ot,
                    "descripcion": ot.descripcion_producto_ot,
                    "procesos": []
                }

                ruta_items = ruta.items.all().order_by('item')

                fecha_inicio = ot.fecha_emision or ot.fecha_proc or program.fecha_inicio
                fecha_actual = fecha_inicio

                procesos = []

                for item_ruta in ruta_items:
                    proceso = item_ruta.proceso
                    maquina = item_ruta.maquina

                    #Añadir proceso al grupo de la OT
                    proceso_id = f"proc_{item_ruta.id}"
                    ot_group["procesos"].append({
                        "id": proceso_id,
                        "descripcion": f"{proceso.descripcion} - {maquina.descripcion}",
                        "item": item_ruta.item
                    })

                    if item_ruta.estandar <= 0:
                        item_ruta.estandar = 500

                    # Calcular fechas e intervalos
                    dates_data = calculate_working_days(
                        fecha_actual,
                        item_ruta.cantidad_pedido,
                        item_ruta.estandar
                    )

                    # Crear un item por cada intervalo
                    for idx, interval in enumerate(dates_data['intervals']):
                        items.append({
                            "id": f'item_{item_ruta.id}_{idx}',
                            "ot_id": f"ot_{ot.id}",
                            "proceso_id": proceso_id,
                            "name": f"{proceso.descripcion} - {interval['unidades']} de {item_ruta.cantidad_pedido} unidades",
                            "start_time": interval['fecha_inicio'].strftime('%Y-%m-%d %H:%M:%S'),
                            "end_time": interval['fecha_fin'].strftime('%Y-%m-%d %H:%M:%S'),
                            "cantidad_total": float(item_ruta.cantidad_pedido),
                            "cantidad_intervalo": float(interval['unidades']),
                            "unidades_restantes": float(interval['unidades_restantes']),
                            "estandar": item_ruta.estandar
                        })

                    fecha_actual = get_next_working_day(dates_data['end_date'])

                groups.append(ot_group)
            
            routes_data = {
                "groups": groups,
                "items": items
            }

            response_data = {
                "program": serializer.data,
                "ordenes_trabajo": ordenes_trabajo,
                "routes_data": routes_data
            }
            return Response(response_data, status=status.HTTP_200_OK)
        except ProgramaProduccion.DoesNotExist:
            return Response(
                {"error": "Programa no encontrado"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    def get_ordenes(self, program):
        """Obtiene las órdenes de trabajo del programa dado."""
        pot_srch = ProgramaOrdenTrabajo.objects.filter(programa=program).select_related('orden_trabajo')
        return [pot.orden_trabajo for pot in pot_srch]

    def get_items_data(self, ordenes):
        """Genera datos para representar las rutas e ítems de cada orden de trabajo."""
        response = {
            "groups": [],
            "items": []
        }

        for ot in ordenes:
            response["groups"].append({
                "id": ot.id,
                "title": f"{ot.codigo_ot} - {ot.descripcion_producto_ot or 'Sin descripción'}"
            })

            rutas = ot.ruta_ot  # Relación one-to-one definida en el modelo RutaOT
            if rutas:
                for item in rutas.items.all():
                    start_time = ot.fecha_emision 

                    end_time = ot.fecha_termino

                    response["items"].append({
                        "id": item.id,
                        "group": ot.id,
                        "title": item.proceso.descripcion,
                        "start_time": start_time,
                        "end_time": end_time,
                        "maquina": item.maquina.descripcion  # Suponiendo que `Maquina` tiene un campo `nombre`
                    })

        return response

    
    def transform_to_timeline_format(self, rutas):
        #Convierte las rutas en el formato esperado por Timeline
        tasks = []
        for idx, ruta in enumerate(rutas):
            task_id = idx + 1
            tasks.append({
                "id": task_id,
                "name":f"{ruta['proceso']} en {ruta['maquina']}",
                "start": ruta['fecha_inicio'],
                "end": ruta['fecha_termino'],
                "dependencies": [task_id -1] if task_id > 1 else [],
            })
        return tasks

    def get_rutas_planificadas(self, program):
        from collections import defaultdict
            #Procesa las rutas asociadas al programa y devuelve un dict con los resultados.
        rutas = []
        pot_srch = ProgramaOrdenTrabajo.objects.filter(programa=program)
        for programa_ot in pot_srch:
            ot = programa_ot.orden_trabajo
            rutas.extend(RutaOT.objects.filter(orden_trabajo=ot).prefetch_related('items'))
            
        resultados = []

        for ruta_ot in rutas:
            fecha_inicio_ruta = ruta_ot.orden_trabajo.fecha_emision or ruta_ot.orden_trabajo.fecha_proc
            item_rutas = ruta_ot.items.order_by('item')  # Asume que los ítems tienen un campo `item` para el orden
            dia_actual = fecha_inicio_ruta
            produccion_acumulada = defaultdict(int)

            for i, item in enumerate(item_rutas):
                # Determinar fecha de inicio del ítem
                dia_inicio = dia_actual if i == 0 else dia_actual + timedelta(days=1)

                # Validar estándar de producción
                if item.estandar <= 0:
                    item.estandar = 50

                # Calcular fechas de término y producción diaria
                cantidad_restante = item.cantidad_pedido
                dia_termino = dia_inicio
                dias_produccion = []

                while cantidad_restante > 0:
                    produccion_diaria = min(item.estandar, cantidad_restante)
                    dias_produccion.append({
                        'fecha': dia_termino.strftime('%Y-%m-%d'),
                        'produccion': produccion_diaria
                    })
                    produccion_acumulada[item.proceso.id] += produccion_diaria
                    cantidad_restante -= produccion_diaria

                    # Avanzar al siguiente día si queda cantidad por producir
                    if cantidad_restante > 0:
                        dia_termino += timedelta(days=1)

                # Guardar resultado del ítem solo si hay más producción calculada

                if dias_produccion:
                    resultados.append({
                        'item': item.item,
                        'ot': ruta_ot.orden_trabajo.codigo_ot,
                        'producto': ruta_ot.orden_trabajo.descripcion_producto_ot,
                        'maquina': item.maquina.descripcion,
                        'proceso': item.proceso.descripcion,
                        'cantidad': item.cantidad_pedido,
                        'estandar': item.estandar,
                        'fecha_inicio': dia_inicio.strftime('%Y-%m-%d'),
                        'fecha_termino': dia_termino.strftime('%Y-%m-%d'),
                        
                    })

                # Actualizar el día actual
                dia_actual = dia_termino
        return resultados


class MaquinasView(APIView):
    def get(self, request):
        try:
            maquinas = Maquina.objects.all().order_by('codigo_maquina')
            data = [{
                'id': maquina.id,
                'descripcion': f'{maquina.codigo_maquina} - {maquina.descripcion}'
            } for maquina in maquinas]
            return Response(data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, 
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)

from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import Q
from .models import OrdenTrabajo, ProgramaOrdenTrabajo
from .serializers import OrdenTrabajoSerializer

@api_view(['GET'])
def get_unassigned_ots(request):
    """
    Obtiene todas las órdenes de trabajo que no están asignadas a ningún programa de producción.
    """
    try:
        # Filtra órdenes de trabajo que no están relacionadas con ningún programa
        ordenes_unassigned = OrdenTrabajo.objects.filter(
            ~Q(id__in=ProgramaOrdenTrabajo.objects.values_list('orden_trabajo_id', flat=True))
        )

        # Serializa las órdenes no asignadas
        serializer = OrdenTrabajoSerializer(ordenes_unassigned, many=True)

        return Response(serializer.data, status=200)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

