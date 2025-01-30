from django.contrib import admin
from .models import *
# Register your models here.

class OperadorMaquinaInline(admin.TabularInline):
    model = OperadorMaquina
    extra = 1

@admin.register(RolOperador)
class RolOperadorAdmin(admin.ModelAdmin):
    list_display = ('nombre',)
    search_fields = ('nombre',)

@admin.register(Operador)
class OperadorAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'rol', 'empresa', 'activo', 'fecha_creacion', 'fecha_modificacion')
    list_filter = ('rol', 'empresa', 'activo')
    search_fields = ('nombre', 'rol__nombre', 'empresa__nombre')
    readonly_fields = ('fecha_creacion', 'fecha_modificacion')
    fieldsets = (
        (None, {
            'fields': ('nombre', 'rol', 'empresa', 'activo', 'creado_por', 'modificado_por', 'fecha_creacion', 'fecha_modificacion')
        }),
    )
    inline = [OperadorMaquinaInline]

@admin.register(OperadorMaquina)
class OperadorMaquinaAdmin(admin.ModelAdmin):
    list_display = ('operador', 'maquina')
    search_fields = ('operador__nombre', 'maquina__descripcion')

@admin.register(AsignacionOperador)
class AsignacionOperadorAdmin(admin.ModelAdmin):
    list_display = ['operador', 'maquina', 'proceso', 'fecha_asignacion', 'programa']
    list_filter = ['fecha_asignacion', 'operador', 'maquina']
    search_fields = ['operador__nombre', 'maquina__codigo_maquina']

@admin.register(DisponibilidadOperador)
class DisponibilidadOperadorAdmin(admin.ModelAdmin):
    list_display = ['operador', 'fecha_inicio', 'fecha_fin', 'ocupado', 'programa']
    list_filter = ['ocupado', 'operador']
    search_fields = ['operador__nombre']