from django.contrib import admin

from .models import Category, Task


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "color", "owner", "created_at")
    list_filter = ("created_at",)
    search_fields = ("name", "owner__email", "owner__username")


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ("title", "status", "priority", "owner", "due_date", "created_at")
    list_filter = ("status", "priority", "created_at")
    search_fields = ("title", "description", "owner__email", "owner__username")
