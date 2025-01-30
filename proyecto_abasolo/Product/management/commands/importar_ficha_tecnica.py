from django.core.management.base import BaseCommand
from django.db import IntegrityError
from Product.models import MeasurementUnit, MateriaPrima, TipoProducto, Producto, Pieza, FichaTecnica, TerminacionFicha
from django.core.exceptions import ObjectDoesNotExist
import csv, re

def get_object_or_none(klass, *args, **kwargs):
    try:
        return klass.objects.get(*args, **kwargs)
    except ObjectDoesNotExist:
        return None
    
class Command(BaseCommand):
    help = 'Importar datos desde un archivo .txt'

    def handle(self, *args, **kwargs):
        path_file = 'W:\\ficha.txt'
        encodings_to_try = ['utf-8', 'latin-1']

        for encoding in encodings_to_try:
            try:
                with open(path_file, 'r', newline='', encoding=encoding) as file:
                    reader = csv.reader(file, delimiter='@')
                    next(reader)
                    next(reader)

                    for row in reader:
                        try:
                            codigo_producto = row[0]
                            producto = get_object_or_none(Producto, codigo_producto=codigo_producto)
                            pieza = get_object_or_none(Pieza, codigo_pieza=codigo_producto)

                            if not producto and not pieza:
                                print(f'Producto/pieza no encontrados para {row}')
                                continue

                            if producto and producto.ficha_tecnica is not None:
                                print(f'Ficha técnica ya existe para el producto: {codigo_producto}')
                                continue

                            if pieza and pieza.ficha_tecnica is not None:
                                print(f'Ficha técnica ya existe para la pieza')

                            ficha_tecnica = FichaTecnica()

                            codigo_tipo_producto = row[1]
                            tipo_producto, _ = TipoProducto.objects.get_or_create(codigo=codigo_tipo_producto)

                            texto_largo_hilo = re.sub(r'\s+', ' ', row[2].strip())

                            try:
                                largo_hilo = float(row[3].strip())
                            except ValueError:
                                self.stdout.write(self.style.ERROR(f'Error al convertir el largo del hilo en la fila: {row}'))
                                continue

                            hilos_por_pulgada = int(row[4].strip())

                            try:
                                peso_producto = float(row[5].strip())
                            except:
                                self.stdout.write(self.style.ERROR(f'Error al convertir el peso en la fila: {row}'))

                            plano_ficha_path = row[6]
                            calibra_ficha = re.sub(r'\s+', ' ', row[7].strip())
                            observacion_ficha = re.sub(r'\s+', ' ', row[8].strip())
                            term_ficha = row[9]

                            codigo_materia_prima = row[10]
                            materia_prima, _ = MateriaPrima.objects.get_or_create(codigo=codigo_materia_prima)

                            try:
                                largo_cortar = float(row[11].strip())
                            except ValueError:
                                self.stdout.write(self.style.ERROR(f'Error al convertir el largo cortar en la fila: {row}'))

                            observacion_mprima = re.sub(r'\s+', ' ', row[12].strip())
                            estandar_ficha = int(row[13] if row[13] else 0)

                            if term_ficha.strip():
                                terminacion_ficha, _ = TerminacionFicha.objects.get_or_create(
                                    codigo = term_ficha,
                                    defaults={
                                        'nombre': term_ficha,
                                    }
                                )
                            else:
                                terminacion_ficha = None

                            ficha_tecnica.tipo_producto = tipo_producto
                            ficha_tecnica.texto_largo_hilo = texto_largo_hilo
                            ficha_tecnica.largo_hilo = largo_hilo
                            ficha_tecnica.hilos_por_pulgada = hilos_por_pulgada
                            ficha_tecnica.peso_producto = peso_producto
                            ficha_tecnica.plano_ficha_path = plano_ficha_path
                            ficha_tecnica.calibra_ficha = calibra_ficha
                            ficha_tecnica.observacion_ficha = observacion_ficha
                            ficha_tecnica.terminacion_ficha = terminacion_ficha
                            ficha_tecnica.materia_prima = materia_prima
                            ficha_tecnica.largo_cortar = largo_cortar
                            ficha_tecnica.observacion_mprima = observacion_mprima
                            ficha_tecnica.estandar_ficha = estandar_ficha
                            ficha_tecnica.save()

                            if producto:
                                producto.ficha_tecnica = ficha_tecnica
                                self.stdout.write(self.style.SUCCESS(f'Ficha asignada a producto: {producto.codigo_producto}'))
                                producto.save()
                            elif pieza:
                                pieza.ficha_tecnica = ficha_tecnica
                                self.stdout.write(self.style.SUCCESS(f'Ficha asignada a Pieza: {pieza.codigo_pieza}'))
                                pieza.save()
                            else:
                                self.stdout.write(self.style.WARNING(f'No se encontró producto ni pieza para la ficha: {ficha_tecnica}'))
                                continue
                        except (ValueError, IntegrityError) as e:
                            self.stdout.write(self.style.ERROR(f'Error al procesar la fila: {row}'))

                        except Exception as e:
                            self.stdout.write(self.style.ERROR(f'Error inesperado al procesar la fila: {row}: {str(e)}'))
                break
            except UnicodeDecodeError:
                continue