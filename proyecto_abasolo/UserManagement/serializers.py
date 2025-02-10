from rest_framework import serializers
from .models import CustomUser

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'rut', 'telefono', 'cargo', 'rol', 'activo']
        read_only_fields = ['id']
        
class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta: 
        model = CustomUser
        fields  = ['username', 'password', 'first_name', 'last_name', 'email', 'rut', 'telefono', 'cargo', 'rol']


    def create(self, validated_data):
        password = validated_data.pop('password')
        user = CustomUser(**validated_data)
        user.set_password(password)
        user.save()
        return user
