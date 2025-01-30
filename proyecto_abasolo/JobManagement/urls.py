from django.urls import path
from . import views

urlpatterns = [
    path('importar_ots/', views.importar_ots_from_file, name='importar_ot'),
    path('importar_ruta_ot/', views.importar_rutaot_file)
]

urlpatterns += [
    path('api/v1/ordenes/', views.OTView.as_view(), name='ordenes-list'),
    path('api/v1/programas/crear_programa/', views.ProgramCreateView.as_view(), name='crear_programa'),
    path('api/v1/ordenes/no_asignadas/', views.get_unassigned_ots, name='ordenes-unassigned'),
    path('api/v1/programas/', views.ProgramListView.as_view(), name='programas-list'),
    path('api/v1/programas/<int:pk>/', views.ProgramDetailView.as_view(), name='get-program'),
    path('api/v1/programas/<int:id>/gantt/', views.ProgramDetailView.transform_to_timeline_format, name='gantt-chart'),
    path('api/v1/programas/', views.ProgramListView.as_view(), name='program-list'),
    path('api/v1/programas/<int:pk>/update-prio/', views.UpdatePriorityView.as_view(), name='program-detail'),
    path('api/v1/programas/<int:pk>/delete-orders/', views.UpdatePriorityView.as_view(), name='delete_orders'),
    

]

