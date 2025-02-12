# Generated by Django 4.1.7 on 2025-02-11 12:57

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('Client', '0001_initial'),
        ('Utils', '0001_initial'),
        ('Product', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Asignacion',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('ocupado', models.BooleanField(default=True)),
            ],
            options={
                'verbose_name': 'Asignación de Recurso',
                'verbose_name_plural': 'Asignaciones de Recursos',
            },
        ),
        migrations.CreateModel(
            name='AtrasoDiarioOT',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('fecha', models.DateField(auto_now_add=True, unique=True)),
                ('dias_acumulados_atraso', models.IntegerField()),
                ('dias_acumulados_atraso_stock', models.IntegerField(default=0)),
                ('dias_acumulados_atraso_pedido', models.IntegerField(default=0)),
            ],
        ),
        migrations.CreateModel(
            name='DisponibilidadMaquina',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('fecha_inicio', models.DateTimeField()),
                ('fecha_fin', models.DateTimeField()),
                ('ocupado', models.BooleanField(default=False)),
            ],
        ),
        migrations.CreateModel(
            name='EmpresaOT',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nombre', models.CharField(max_length=50)),
                ('apodo', models.CharField(max_length=50, unique=True)),
                ('codigo_empresa', models.CharField(max_length=50, unique=True)),
            ],
        ),
        migrations.CreateModel(
            name='ItemRuta',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('item', models.PositiveIntegerField()),
                ('estandar', models.IntegerField(default=0)),
                ('cantidad_pedido', models.DecimalField(decimal_places=2, default=0.0, max_digits=14)),
                ('cantidad_terminado_proceso', models.DecimalField(decimal_places=2, default=0.0, max_digits=14)),
                ('cantidad_perdida_proceso', models.DecimalField(decimal_places=2, default=0.0, max_digits=14)),
                ('terminado_sin_actualizar', models.DecimalField(decimal_places=2, default=0.0, max_digits=14)),
            ],
        ),
        migrations.CreateModel(
            name='Maquina',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('codigo_maquina', models.CharField(max_length=10)),
                ('descripcion', models.CharField(max_length=100)),
                ('sigla', models.CharField(default='', max_length=10)),
                ('carga', models.DecimalField(decimal_places=2, default=0, max_digits=15)),
                ('golpes', models.IntegerField(default=0)),
                ('empresa', models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, to='JobManagement.empresaot')),
            ],
        ),
        migrations.CreateModel(
            name='OrdenTrabajo',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('codigo_ot', models.IntegerField(unique=True)),
                ('fecha_emision', models.DateField(blank=True, null=True)),
                ('fecha_proc', models.DateField(blank=True, null=True)),
                ('fecha_termino', models.DateField(blank=True, null=True)),
                ('nro_nota_venta_ot', models.CharField(blank=True, max_length=12, null=True)),
                ('item_nota_venta', models.IntegerField()),
                ('referencia_nota_venta', models.IntegerField(blank=True, null=True)),
                ('codigo_producto_inicial', models.CharField(blank=True, max_length=12, null=True)),
                ('codigo_producto_salida', models.CharField(blank=True, max_length=12, null=True)),
                ('descripcion_producto_ot', models.CharField(blank=True, max_length=255, null=True)),
                ('cantidad', models.DecimalField(decimal_places=2, default=0.0, max_digits=14)),
                ('cantidad_avance', models.DecimalField(decimal_places=2, default=0.0, max_digits=14)),
                ('peso_unitario', models.DecimalField(decimal_places=5, default=0.0, max_digits=19)),
                ('cantidad_mprima', models.DecimalField(decimal_places=2, default=0.0, max_digits=14)),
                ('observacion_ot', models.CharField(blank=True, max_length=150, null=True)),
                ('multa', models.BooleanField(default=False)),
                ('cliente', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, to='Client.cliente')),
                ('empresa', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, to='JobManagement.empresaot')),
                ('materia_prima', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, to='Utils.materiaprima')),
            ],
        ),
        migrations.CreateModel(
            name='Proceso',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('codigo_proceso', models.CharField(max_length=10)),
                ('sigla', models.CharField(blank=True, max_length=10, null=True)),
                ('descripcion', models.CharField(max_length=100)),
                ('carga', models.DecimalField(decimal_places=4, default=0.0, max_digits=10)),
                ('empresa', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='JobManagement.empresaot')),
            ],
        ),
        migrations.CreateModel(
            name='ProgramaProduccion',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nombre', models.CharField(blank=True, max_length=100, unique=True)),
                ('fecha_inicio', models.DateField()),
                ('fecha_fin', models.DateField()),
                ('created_at', models.DateTimeField(auto_now_add=True, null=True)),
                ('updated_at', models.DateTimeField(auto_now=True, null=True)),
            ],
            options={
                'verbose_name': 'Programa Producción',
                'verbose_name_plural': 'Programas Producción',
            },
        ),
        migrations.CreateModel(
            name='SituacionOT',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('codigo_situacion_ot', models.CharField(max_length=2, unique=True)),
                ('descripcion', models.CharField(blank=True, max_length=50, null=True)),
            ],
        ),
        migrations.CreateModel(
            name='TipoOT',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('codigo_tipo_ot', models.CharField(max_length=2, unique=True)),
                ('descripcion', models.CharField(blank=True, max_length=50, null=True)),
            ],
        ),
        migrations.CreateModel(
            name='RutaPieza',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nro_etapa', models.PositiveIntegerField()),
                ('estandar', models.IntegerField(default=0)),
                ('maquina', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='JobManagement.maquina')),
                ('pieza', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='rutas', to='Product.pieza')),
                ('proceso', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='JobManagement.proceso')),
            ],
        ),
        migrations.CreateModel(
            name='RutaOT',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('orden_trabajo', models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='ruta_ot', to='JobManagement.ordentrabajo')),
            ],
        ),
        migrations.CreateModel(
            name='Ruta',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nro_etapa', models.PositiveIntegerField()),
                ('estandar', models.IntegerField(default=0)),
                ('maquina', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='JobManagement.maquina')),
                ('proceso', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='JobManagement.proceso')),
                ('producto', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='rutas', to='Product.producto')),
            ],
        ),
        migrations.CreateModel(
            name='ProgramaOrdenTrabajo',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('prioridad', models.PositiveIntegerField()),
                ('orden_trabajo', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='JobManagement.ordentrabajo')),
                ('programa', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='JobManagement.programaproduccion')),
            ],
        ),
        migrations.AddField(
            model_name='ordentrabajo',
            name='situacion_ot',
            field=models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to='JobManagement.situacionot'),
        ),
        migrations.AddField(
            model_name='ordentrabajo',
            name='tipo_ot',
            field=models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to='JobManagement.tipoot'),
        ),
        migrations.AddField(
            model_name='ordentrabajo',
            name='unidad_medida',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, to='Utils.measurementunit'),
        ),
        migrations.AddField(
            model_name='ordentrabajo',
            name='unidad_medida_mprima',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='unidad_of_medida_materia_prima', to='Utils.measurementunit'),
        ),
        migrations.CreateModel(
            name='ItemRutaOperador',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('modified_at', models.DateTimeField(auto_now=True)),
                ('item_ruta', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='operador_assignments', to='JobManagement.itemruta')),
            ],
        ),
    ]
