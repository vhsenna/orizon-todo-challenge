import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse

from apps.tasks.models import Category, Task

User = get_user_model()


@pytest.fixture
def user(db):
    return User.objects.create_user(email="owner@example.com", username="owner", password="secure-pass-123")


@pytest.fixture
def other_user(db):
    return User.objects.create_user(email="other@example.com", username="other", password="secure-pass-123")


@pytest.mark.django_db
def test_user_can_create_task(api_client, user):
    category = Category.objects.create(owner=user, name="Work", color="#2563eb")
    api_client.force_authenticate(user=user)

    response = api_client.post(
        reverse("task-list"),
        {"title": "Ship API", "description": "Build task CRUD", "priority": "high", "category": category.id},
        format="json",
    )

    assert response.status_code == 201
    assert response.json()["title"] == "Ship API"
    assert Task.objects.get(id=response.json()["id"]).owner == user


@pytest.mark.django_db
def test_task_category_must_belong_to_owner(api_client, user, other_user):
    category = Category.objects.create(owner=other_user, name="Private", color="#dc2626")
    api_client.force_authenticate(user=user)

    response = api_client.post(reverse("task-list"), {"title": "Nope", "category": category.id}, format="json")

    assert response.status_code == 400
    assert "category" in response.json()


@pytest.mark.django_db
def test_user_only_lists_owned_or_shared_tasks(api_client, user, other_user):
    owned = Task.objects.create(owner=user, title="Owned")
    shared = Task.objects.create(owner=other_user, title="Shared")
    shared.shared_with.add(user)
    Task.objects.create(owner=other_user, title="Hidden")
    api_client.force_authenticate(user=user)

    response = api_client.get(reverse("task-list"))

    assert response.status_code == 200
    assert {task["id"] for task in response.json()} == {owned.id, shared.id}


@pytest.mark.django_db
def test_user_can_update_shared_task(api_client, user, other_user):
    task = Task.objects.create(owner=other_user, title="Shared")
    task.shared_with.add(user)
    api_client.force_authenticate(user=user)

    response = api_client.patch(reverse("task-detail", args=[task.id]), {"title": "Updated"}, format="json")

    assert response.status_code == 200
    task.refresh_from_db()
    assert task.title == "Updated"


@pytest.mark.django_db
def test_only_owner_can_delete_task(api_client, user, other_user):
    task = Task.objects.create(owner=other_user, title="Shared")
    task.shared_with.add(user)
    api_client.force_authenticate(user=user)

    response = api_client.delete(reverse("task-detail", args=[task.id]))

    assert response.status_code == 403
    assert Task.objects.filter(id=task.id).exists()


@pytest.mark.django_db
def test_owner_can_delete_task(api_client, user):
    task = Task.objects.create(owner=user, title="Owned")
    api_client.force_authenticate(user=user)

    response = api_client.delete(reverse("task-detail", args=[task.id]))

    assert response.status_code == 204
    assert not Task.objects.filter(id=task.id).exists()


@pytest.mark.django_db
def test_user_can_toggle_task_completion(api_client, user):
    task = Task.objects.create(owner=user, title="Toggle me")
    api_client.force_authenticate(user=user)

    response = api_client.patch(reverse("task-toggle", args=[task.id]))

    assert response.status_code == 200
    task.refresh_from_db()
    assert task.status == Task.Status.COMPLETED
