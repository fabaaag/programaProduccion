# Generated by Django 4.1.7 on 2024-12-27 15:08

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('Utils', '0001_initial'),
        ('JobManagement', '0002_programaproduccion_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='ordentrabajo',
            name='materia_prima',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, to='Utils.materiaprima'),
        ),
        migrations.AlterField(
            model_name='ordentrabajo',
            name='unidad_medida',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, to='Utils.measurementunit'),
        ),
        migrations.AlterField(
            model_name='ordentrabajo',
            name='unidad_medida_mprima',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='unidad_of_medida_materia_prima', to='Utils.measurementunit'),
        ),
    ]
