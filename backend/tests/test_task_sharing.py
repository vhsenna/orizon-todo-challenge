import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse

from apps.tasks.models import Task

User = get_user_model()


@pytest.fixture
def owner(db):
    return User.objects.create_user(email="owner@example.com", username="owner", password="secure-pass-123")


@pytest.fixture
def shared_user(db):
    return User.objects.create_user(email="shared@example.com", username="shared", password="secure-pass-123")


@pytest.mark.django_db
def test_owner_can_share_task_by_email(api_client, owner, shared_user):
    task = Task.objects.create(owner=owner, title="Shared task")
    api_client.force_authenticate(user=owner)

    response = api_client.post(reverse("task-share", args=[task.id]), {"email": "Shared@Example.com"}, format="json")

    assert response.status_code == 200
    assert shared_user.id in response.json()["shared_with"]
    assert task.shared_with.filter(id=shared_user.id).exists()


@pytest.mark.django_db
def test_share_rejects_unknown_email(api_client, owner):
    task = Task.objects.create(owner=owner, title="Shared task")
    api_client.force_authenticate(user=owner)

    response = api_client.post(reverse("task-share", args=[task.id]), {"email": "missing@example.com"}, format="json")

    assert response.status_code == 400
    assert "email" in response.json()


@pytest.mark.django_db
def test_share_rejects_duplicate_share(api_client, owner, shared_user):
    task = Task.objects.create(owner=owner, title="Shared task")
    task.shared_with.add(shared_user)
    api_client.force_authenticate(user=owner)

    response = api_client.post(reverse("task-share", args=[task.id]), {"email": shared_user.email}, format="json")

    assert response.status_code == 400
    assert "email" in response.json()


@pytest.mark.django_db
def test_shared_user_cannot_share_task(api_client, owner, shared_user):
    task = Task.objects.create(owner=owner, title="Shared task")
    task.shared_with.add(shared_user)
    api_client.force_authenticate(user=shared_user)

    response = api_client.post(reverse("task-share", args=[task.id]), {"email": "other@example.com"}, format="json")

    assert response.status_code == 403


@pytest.mark.django_db
def test_shared_user_can_view_and_edit_task(api_client, owner, shared_user):
    task = Task.objects.create(owner=owner, title="Shared task")
    task.shared_with.add(shared_user)
    api_client.force_authenticate(user=shared_user)

    detail_response = api_client.get(reverse("task-detail", args=[task.id]))
    update_response = api_client.patch(reverse("task-detail", args=[task.id]), {"title": "Edited"}, format="json")

    assert detail_response.status_code == 200
    assert update_response.status_code == 200
    task.refresh_from_db()
    assert task.title == "Edited"


@pytest.mark.django_db
def test_delete_access_remains_owner_only(api_client, owner, shared_user):
    task = Task.objects.create(owner=owner, title="Shared task")
    task.shared_with.add(shared_user)
    api_client.force_authenticate(user=shared_user)

    response = api_client.delete(reverse("task-detail", args=[task.id]))

    assert response.status_code == 403
    assert Task.objects.filter(id=task.id).exists()
