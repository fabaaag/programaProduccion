from rest_framework import serializers
from .models import Operador, DisponibilidadOperador

class OperadorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Operador
        fields = ['id', 'nombre', 'rol', 'empresa', 'activo', 'maquinas']
        read_only_fields = ['creado_por', 'modificado_por']


class DisponibilidadOperadorSerializer(serializers.ModelSerializer):
    class Meta:
        model = DisponibilidadOperador
        fields = 'all' 

class DisponibilidadCreateSerializer(serializers.Serializer):
    operador = serializers.PrimaryKeyRelatedField(queryset=Operador.objects.all())
    fecha_inicio = serializers.DateField(required=False)
    dias_habiles = serializers.IntegerField(required=False, default=20)