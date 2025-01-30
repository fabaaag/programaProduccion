from django_filters import rest_framework as filters

from.models import Producto, Pieza

class ProductFilter(filters.FilterSet):
    familia = filters.NumberFilter(field_name='familia_producto__id')
    familia = filters.NumberFilter(field_name='subfamilia_producto__id')
    codigo_producto = filters.CharFilter(field_name='codigo_producto', lookup_expr='icontains')
    producto = filters.CharFilter(field_name='descripcion', lookup_expr='icontains', method='filter_producto')
    armado = filters.BooleanFilter(field_name='armado')
    con_ruta = filters.BooleanFilter(field_name='rutas', lookup_expr='isnull', exclude=True)

    def filter_familia(self, queryset, name, value):
        return queryset.filter(familia_producto__descripcion__icontains=value)
    
    def filter_subfamilia(self, queryset, name, value):
        return queryset.filter(subfamilia_producto__descripcion__icontains=value)

    def filter_producto(self, queryset, name, value):
        substrings = value.lower().split()
        filtered_queryset = queryset
        for substring in substrings:
            filtered_queryset = filtered_queryset.filter(descripcion__icontains=substring)
        return filtered_queryset
    
    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.query_params.get('con_ruta') == 'true':
            queryset = queryset.filter(ruta__exists=True)

        return queryset
    
    class Meta:
        model = Producto
        fields = ['familia', 'subfamilia', 'codigo_producto', 'producto', 'armado', 'con_ruta']

class PiezaFilter(filters.FilterSet):
    familia = filters.NumberFilter(field_name='familia_producto__id')
    subfamilia = filters.NumberFilter(field_name='subfamilia_producto__id')
    codigo_pieza = filters.CharFilter(field_name='codigo_pieza', lookup_expr='icontains')
    pieza = filters.CharFilter(field_name='descripcion', lookup_expr='icontains', method='filter_pieza')
    con_ruta = filters.BooleanFilter(field_name='rutas', lookup_expr='isnull', exclude=True)

    def filter_pieza(self, queryset, name, value):
        substrings = value.lower().split()
        filtered_queryset = queryset
        for substring in substrings:
            filtered_queryset = filtered_queryset.filter(descripcion__icontains=substring)
        return filtered_queryset
    
    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.query_params.get('con_ruta') == 'true':
            queryset = queryset.filter(ruta__exists=True)
        return queryset
    
    class Meta:
        model = Pieza
        fields = ['familia', 'subfamilia', 'codigo_pieza', 'descripcion', 'con_ruta']