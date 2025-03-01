# Generated by Django 4.1.7 on 2025-02-11 12:57

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('JobManagement', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Operador',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nombre', models.CharField(max_length=100)),
                ('activo', models.BooleanField(default=True)),
                ('fecha_creacion', models.DateTimeField(auto_now_add=True, null=True)),
                ('fecha_modificacion', models.DateField(auto_now=True, null=True)),
                ('creado_por', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='operadores_creados', to=settings.AUTH_USER_MODEL)),
                ('empresa', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='JobManagement.empresaot')),
            ],
        ),
        migrations.CreateModel(
            name='RolOperador',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nombre', models.CharField(max_length=50, unique=True)),
            ],
        ),
        migrations.CreateModel(
            name='OperadorMaquina',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('maquina', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='JobManagement.maquina')),
                ('operador', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='Operator.operador')),
            ],
        ),
        migrations.AddField(
            model_name='operador',
            name='maquinas',
            field=models.ManyToManyField(through='Operator.OperadorMaquina', to='JobManagement.maquina'),
        ),
        migrations.AddField(
            model_name='operador',
            name='modificado_por',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='operadores_modificados', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='operador',
            name='rol',
            field=models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to='Operator.roloperador'),
        ),
        migrations.CreateModel(
            name='DisponibilidadOperador',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('fecha_inicio', models.DateTimeField()),
                ('fecha_fin', models.DateTimeField()),
                ('ocupado', models.BooleanField(default=False)),
                ('operador', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='Operator.operador')),
                ('programa', models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, related_name='disponibilidades_operadores', to='JobManagement.programaproduccion')),
            ],
            options={
                'verbose_name': 'Disponibilidad de Operador',
                'verbose_name_plural': 'Disponibilidades de Operadores',
            },
        ),
        migrations.AlterUniqueTogether(
            name='operador',
            unique_together={('nombre', 'rol', 'empresa')},
        ),
        migrations.CreateModel(
            name='AsignacionOperador',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('fecha_asignacion', models.DateField()),
                ('maquina', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='JobManagement.maquina')),
                ('operador', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='Operator.operador')),
                ('proceso', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='JobManagement.proceso')),
                ('programa', models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, related_name='asignaciones_operadores', to='JobManagement.programaproduccion')),
            ],
            options={
                'unique_together': {('operador', 'maquina', 'proceso', 'fecha_asignacion')},
            },
        ),
    ]
