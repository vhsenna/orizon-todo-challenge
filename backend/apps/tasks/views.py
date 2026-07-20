from django.db.models import Q
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .filters import TaskFilter
from .models import Category, Task
from .permissions import IsCategoryOwner, IsTaskOwnerForDelete
from .serializers import CategorySerializer, TaskSerializer, TaskShareSerializer


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.none()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated, IsCategoryOwner]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return self.queryset
        return Category.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.none()
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated, IsTaskOwnerForDelete]
    filterset_class = TaskFilter
    search_fields = ("title", "description")
    ordering_fields = ("due_date", "created_at", "priority")
    ordering = ("-created_at",)

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return self.queryset
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

    @action(detail=True, methods=["post"])
    def share(self, request, pk=None):
        task = self.get_object()
        if task.owner_id != request.user.id:
            return Response(
                {"detail": "Only the task owner can share this task."},
                status=403,
            )

        serializer = TaskShareSerializer(
            data=request.data,
            context={"request": request, "task": task},
        )
        serializer.is_valid(raise_exception=True)
        task.shared_with.add(serializer.context["shared_user"])
        return Response(self.get_serializer(task).data)
