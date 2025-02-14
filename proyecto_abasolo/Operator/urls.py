from django.urls import path
from . import views

urlpatterns = [
    path('api/v1/operator/', views.OperadorListCreateView.as_view(), name='operador-list-create'),
    path('api/v1/disponibilidad/', views.DisponibilidadOperadorView.as_view(), name='disponibilidad-operador'),
]
