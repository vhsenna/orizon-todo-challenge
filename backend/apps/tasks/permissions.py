from rest_framework import permissions


class IsCategoryOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.owner_id == request.user.id


class IsTaskParticipant(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if obj.owner_id == request.user.id:
            return True
        return obj.shared_with.filter(id=request.user.id).exists()


class IsTaskOwnerForDelete(IsTaskParticipant):
    def has_object_permission(self, request, view, obj):
        if request.method == "DELETE":
            return obj.owner_id == request.user.id
        return super().has_object_permission(request, view, obj)
