from django.core.management.base import BaseCommand
from JobManagement.models import Proceso, EmpresaOT
import csv

class Command(BaseCommand):
    help = 'Importar datos desde un archivo .txt'

    def handle(self, *args, **kwargs):
        path_file = ['W:\\procesos_ind.txt', 'W:\\procesos_arc.txt']
        empresas_id = ['0', '2']
        encodings_to_try = ['utf-8', 'latin-1']

        for index, item in enumerate(path_file):
            for encoding in encodings_to_try:
                try:
                    with open(item, 'r', encoding=encoding) as file:
                        reader = csv.reader(file, delimiter='@')
                        next(reader)
                        next(reader)

                        for row in reader:
                            try:
                                if len(row) != 4:
                                    self.stdout.write(self.style.ERROR(f'Fila inválida; {row}'))
                                    continue

                                codigo_proceso = row[0].strip()
                                sigla = row[1].strip()
                                descripcion = row[2].strip()

                                try:
                                    carga = float(row[3].strip())
                                except ValueError:
                                    self.stdout.write(self.style.ERROR(f'Error al convertir la carga en la fila: {row}'))

                                codigo_empresa = empresas_id[index]
                                empresa, _ = EmpresaOT.objects.get_or_create(codigo_empresa=codigo_empresa)
                                print(empresa.nombre)

                                proceso, creado = Proceso.objects.update_or_create(
                                    codigo_proceso=codigo_proceso,
                                    defaults={
                                        'sigla': sigla,
                                        'descripcion': descripcion,
                                        'carga': carga,
                                        'empresa': empresa
                                    }
                                )

                                if creado:
                                    self.stdout.write(self.style.SUCCESS(f'Proceso {codigo_proceso} creado.'))

                                else:
                                    self.stdout.write(self.style.WARNING(f'Proceso {codigo_proceso} actualizado.'))

                            except Exception as e:
                                self.stdout.write(self.style.ERROR(f'Error en la fila {row}: {str(e)}'))
                    break
                
                except UnicodeDecodeError:
                    continue
        self.stdout.write(self.style.SUCCESS('Procesos creados / actualizados correctamente.'))
        