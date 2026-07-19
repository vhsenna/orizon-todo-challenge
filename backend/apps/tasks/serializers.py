from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Category, Task

User = get_user_model()


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


class TaskSerializer(serializers.ModelSerializer):
    shared_with = serializers.PrimaryKeyRelatedField(many=True, read_only=True)

    class Meta:
        model = Task
        fields = (
            "id",
            "title",
            "description",
            "status",
            "priority",
            "due_date",
            "category",
            "shared_with",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "shared_with", "created_at", "updated_at")

    def validate_title(self, value):
        title = value.strip()
        if not title:
            raise serializers.ValidationError("Task title cannot be blank.")
        return title

    def validate_category(self, category):
        request = self.context["request"]
        if category is not None and category.owner_id != request.user.id:
            raise serializers.ValidationError("Category must belong to the task owner.")
        return category


class TaskShareSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        email = value.lower()
        task = self.context["task"]

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist as exc:
            raise serializers.ValidationError("No user exists with this email.") from exc

        if user.id == task.owner_id:
            raise serializers.ValidationError("Task owner already has access.")

        if task.shared_with.filter(id=user.id).exists():
            raise serializers.ValidationError("Task is already shared with this user.")

        self.context["shared_user"] = user
        return email
