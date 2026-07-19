from rest_framework import serializers

from .models import Category


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name", "color", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")

    def validate_name(self, value):
        name = value.strip()
        if not name:
            raise serializers.ValidationError("Category name cannot be blank.")
        return name

    def validate(self, attrs):
        request = self.context["request"]
        owner = request.user
        name = attrs.get("name", getattr(self.instance, "name", None))

        if name is None:
            return attrs

        queryset = Category.objects.filter(owner=owner, name=name)
        if self.instance is not None:
            queryset = queryset.exclude(pk=self.instance.pk)

        if queryset.exists():
            raise serializers.ValidationError(
                {"name": "You already have a category with this name."}
            )

        return attrs
