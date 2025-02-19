from rest_framework import serializers
from .models import CustomUser

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'rut', 'telefono', 'cargo', 'rol', 'activo']
        read_only_fields = ['id', 'username', 'rut']
        
    def update(self, instance, validated_data):
        #Si el RUT no cambió, no lo validamos
        if 'rut' in validated_data:
            validated_data.pop('rut')
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        return instance

class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta: 
        model = CustomUser
        fields  = ['username', 'password', 'first_name', 'last_name', 'email', 'rut', 'telefono', 'cargo', 'rol', 'activo']
        


    def create(self, validated_data):
        try:
            #Añadimos print para debug
            print("Datos a crear:", validated_data)

            password = validated_data.pop('password')
            user = CustomUser(**validated_data)
            user.set_password(password)
            user.save()
            return user
        
        except Exception as e:
            print("Error en create:", str(e))
            raise serializers.ValidationError(str(e))
        


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'telefono', 'cargo', 'rol']
        read_only_fields = ['id', 'username', 'rol']

    def to_representation(self, instance):
        """
        Personaliza la representación de los datos que se envían al frontend
        """
        data = super().to_representation(instance)
        # Agregar campos adicionales o transformar datos si es necesario
        if instance.rol:
            data['rol'] = instance.get_rol_display()
        return data

    def update(self, instance, validated_data):
        """
        Actualiza los datos del usuario
        """
        # Actualizar solo los campos permitidos
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.email = validated_data.get('email', instance.email)
        instance.telefono = validated_data.get('telefono', instance.telefono)
        instance.cargo = validated_data.get('cargo', instance.cargo)
        
        instance.save()
        return instance