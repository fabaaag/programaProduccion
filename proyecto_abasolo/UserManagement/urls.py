from django.urls import path
from . import views
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('api/v1/login/', views.login_api, name='api_login'),
    path('api/v1/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/v1/operadores/', views.lista_operadores_api, name='lista_operadores'),
    path('api/v1/operadores/crear/', views.crear_operador_api, name='crear_operador'),
    path('api/v1/profile/', views.profile_api, name='profile')
]