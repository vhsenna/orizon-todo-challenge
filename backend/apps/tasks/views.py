from django.db.models import Q
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import Category, Task
from .permissions import IsCategoryOwner, IsTaskOwnerForDelete
from .serializers import CategorySerializer, TaskSerializer


class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated, IsCategoryOwner]

    def get_queryset(self):
        return Category.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated, IsTaskOwnerForDelete]

    def get_queryset(self):
        user = self.request.user
        return (
            Task.objects.filter(Q(owner=user) | Q(shared_with=user))
            .select_related("category", "owner")
            .prefetch_related("shared_with")
            .distinct()
        )

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=True, methods=["patch"])
    def toggle(self, request, pk=None):
        task = self.get_object()
        task.status = (
            Task.Status.PENDING
            if task.status == Task.Status.COMPLETED
            else Task.Status.COMPLETED
        )
        task.save(update_fields=["status", "updated_at"])
        return Response(self.get_serializer(task).data)
