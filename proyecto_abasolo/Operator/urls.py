from django.urls import path
from . import views

urlpatterns = [
    #Operadores CRUD
    path('api/v1/operadores/', views.OperadorListCreateView.as_view(), name='operador-list-create'),
    path('api/v1/operadores/<int:pk>/', views.OperadorDetailView.as_view(), name='operador-detail'),

    #Roles de operador
    path('api/v1/roles/', views.RolOperadorListView.as_view(), name='rol-operador-list'),

    #Máquinas por operador
    path('api/v1/operadores/<int:pk>/maquinas/', views.OperadorMaquinasView.as_view(), name='operador-maquinas'),

    

    #Mantener las rutas existentes
    path('api/v1/disponibilidad/', views.DisponibilidadOperadorView.as_view(), name='disponibilidad-operador'),
    path('api/v1/operadores/<int:programa_id>/asignaciones', views.AsignacionOperadorProgramaView.as_view()),
]
