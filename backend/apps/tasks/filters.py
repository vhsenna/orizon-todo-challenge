import django_filters

from .models import Task


class TaskFilter(django_filters.FilterSet):
    category = django_filters.NumberFilter(field_name="category_id")

    class Meta:
        model = Task
        fields = ("status", "priority", "category")
