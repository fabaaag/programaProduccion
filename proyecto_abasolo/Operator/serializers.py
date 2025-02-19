from rest_framework import serializers
from .models import Operador, DisponibilidadOperador, AsignacionOperador, RolOperador
from JobManagement.serializers import MaquinaSerializer, ProcesoSerializer, ProgramaProduccionSerializer, EmpresaOTSerializer



class RolOperadorSerializer(serializers.ModelSerializer):
    class Meta:
        model = RolOperador
        fields = '__all__'


class OperadorSerializer(serializers.ModelSerializer):
    rol = RolOperadorSerializer(read_only=True)
    empresa = EmpresaOTSerializer(read_only=True)
    maquinas = MaquinaSerializer(many=True, read_only=True)
    
    class Meta:
        model = Operador
        fields = ['id', 'nombre', 'rut', 'rol', 'empresa', 'activo', 'maquinas']
        
    def create(self, validated_data):
        #Manejo especial para crear con IDs
        rol_id = self.initial_data.get('rol')
        empresa_id = self.initial_data.get('empresa')
        maquinas_ids = self.initial_data.get('maquinas', [])

        operador = Operador.objects.create(
            nombre = validated_data['nombre'],
            rut=validated_data['rut'],
            rol_id=rol_id,
            empresa_id=empresa_id,
            activo=validated_data.get('activo', True)
        )

        if maquinas_ids:
            operador.maquinas.set(maquinas_ids)
        return operador
    
    def update(self, instance, validated_data):
        #Obtener los IDs de las relaciones
        rol_id =self.initial_data.get('rol')
        empresa_id = self.initial_data.get('empresa')
        maquinas_ids = self.initial_data.get('maquinas', [])

        #Actualizar campos básicos
        instance.nombre = validated_data.get('nombre', instance.nombre)
        instance.rut = validated_data.get('rut', instance.rut)
        instance.activo = validated_data.get('activo', instance.activo)

        #Actualizar relaciones
        if rol_id:
            instance.rol_id = rol_id
        if empresa_id:
            instance.empresa_id = empresa_id

        #Actualizar máquinas
        if maquinas_ids is not None:
            instance.maquinas.set(maquinas_ids)

        instance.save()
        return instance



class DisponibilidadOperadorSerializer(serializers.ModelSerializer):
    class Meta:
        model = DisponibilidadOperador
        fields = 'all' 

class DisponibilidadCreateSerializer(serializers.Serializer):
    operador = serializers.PrimaryKeyRelatedField(queryset=Operador.objects.all())
    fecha_inicio = serializers.DateField(required=False)
    dias_habiles = serializers.IntegerField(required=False, default=20)

class AsignacionOperadorProgramaSerializer(serializers.ModelSerializer):
    maquina = MaquinaSerializer()
    proceso = ProcesoSerializer()
    programa = ProgramaProduccionSerializer()
    operador = OperadorSerializer()
    
    class Meta:
        model = AsignacionOperador
        fields = [
            'id', 'operador', 'maquina', 'proceso', 'fecha_inicio', 'fecha_fin', 'fecha_asignacion', 'programa', 'turno', 'estado'
        ]

    def to_representation(self, instance):
        """Personaliza la representación de los datos"""
        data = super().to_representation(instance)
        #Formatear fechas si es necesario
        if instance.fecha_inicio:
            data['fecha_inicio'] = instance.fecha_inicio.strftime('%d-%m-%Y %H:%M:%S')
        if instance.fecha_fin:
            data['fecha_Fin'] = instance.fecha_fin.strftime('%d-%m-%Y %H:%M:%S')
        return data

