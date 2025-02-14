from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Operador, DisponibilidadOperador
from .serializers import (
    OperadorSerializer,
    DisponibilidadOperadorSerializer,
    DisponibilidadCreateSerializer
)
from datetime import datetime, timedelta

class OperadorListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        operadores = Operador.objects.all()
        serializer = OperadorSerializer(operadores, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        serializer = OperadorSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(creado_por=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class DisponibilidadOperadorView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        #Obtener parámetros de fecha
        fecha_inicio = request.query_params.get('fecha_inicio')
        fecha_fin = request.query_params.get('fecha_fin')
        operador = request.query_params.get('operador_id')
