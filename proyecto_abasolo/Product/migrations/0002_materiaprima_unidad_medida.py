# Generated by Django 4.1.7 on 2024-12-19 18:42

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('Product', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='materiaprima',
            name='unidad_medida',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, to='Product.measurementunit'),
        ),
    ]
