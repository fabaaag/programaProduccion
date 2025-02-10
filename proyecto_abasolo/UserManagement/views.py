from django.shortcuts import render, redirect
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .decorators import admin_required, supervisor_required
from .forms import AdminUserChangeForm, OperadorCreationForm, SupervisorCreationForm
from .models import CustomUser
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .serializers import UserSerializer, UserCreateSerializer


@api_view(['POST'])
def login_api(request):
    username = request.data.get('username')
    password = request.data.get('password')

    user = authenticate(username=username, password=password)

    if user is not None:
        refresh = RefreshToken.for_user(user)
        return Response({
            'token': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data
        })
    else:
        return Response(
            {'error': 'Credenciales inválidas'},
            status=status.HTTP_401_UNAUTHORIZED
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def crear_operador_api(request):
    if not request.user.is_supervisor and not request.user.is_admin:
        return Response(
            {'error': 'No tiene permisos para crear operadores'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    serializer = UserCreateSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(
            created_by=request.user,
            rol='OPERADOR'
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errores, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def lista_operadores_api(request):
    if request.user.is_admin:
        operadores = CustomUser.objects.filter(rol='OPERADOR')
    elif request.user.is_supervisor:
        operadores = CustomUser.objects.filter(
            rol='OPERADOR',
            created_by = request.user
        )
    else:
        return Response(
            {'error': 'No tiene permiso para ver operadores'},
            status = status.HTTP_403_FORBIDDEN
        )

    serializer = UserSerializer(operadores, many=True)
    return Response(serializer.data)