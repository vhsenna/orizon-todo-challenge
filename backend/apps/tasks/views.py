from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import Category
from .permissions import IsCategoryOwner
from .serializers import CategorySerializer


class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated, IsCategoryOwner]

    def get_queryset(self):
        return Category.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)
