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