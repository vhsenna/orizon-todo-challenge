from django.contrib import admin

from .models import Category


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "color", "owner", "created_at")
    list_filter = ("created_at",)
    search_fields = ("name", "owner__email", "owner__username")
