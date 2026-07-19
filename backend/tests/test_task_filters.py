import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone

from apps.tasks.models import Category, Task

User = get_user_model()


@pytest.fixture
def user(db):
    return User.objects.create_user(email="owner@example.com", username="owner", password="secure-pass-123")


@pytest.fixture
def categories(user):
    return {
        "work": Category.objects.create(owner=user, name="Work", color="#2563eb"),
        "home": Category.objects.create(owner=user, name="Home", color="#16a34a"),
    }


@pytest.fixture
def tasks(user, categories):
    now = timezone.now()
    return [
        Task.objects.create(owner=user, title="Write API", description="Backend work", status="pending", priority="high", category=categories["work"], due_date=now),
        Task.objects.create(owner=user, title="Buy milk", description="Grocery list", status="completed", priority="low", category=categories["home"], due_date=now + timezone.timedelta(days=1)),
        Task.objects.create(owner=user, title="Review tests", description="Backend quality", status="in_progress", priority="medium", category=categories["work"], due_date=now + timezone.timedelta(days=2)),
    ]


@pytest.mark.django_db
def test_filter_tasks_by_status_priority_and_category(api_client, user, categories, tasks):
    api_client.force_authenticate(user=user)

    response = api_client.get(
        reverse("task-list"),
        {"status": "pending", "priority": "high", "category": categories["work"].id},
    )

    assert response.status_code == 200
    assert [task["title"] for task in response.json()["results"]] == ["Write API"]


@pytest.mark.django_db
def test_search_tasks_by_title_and_description(api_client, user, tasks):
    api_client.force_authenticate(user=user)

    response = api_client.get(reverse("task-list"), {"search": "Backend"})

    assert response.status_code == 200
    assert {task["title"] for task in response.json()["results"]} == {"Write API", "Review tests"}


@pytest.mark.django_db
def test_order_tasks_by_due_date(api_client, user, tasks):
    api_client.force_authenticate(user=user)

    response = api_client.get(reverse("task-list"), {"ordering": "due_date"})

    assert response.status_code == 200
    assert [task["title"] for task in response.json()["results"]] == [
        "Write API",
        "Buy milk",
        "Review tests",
    ]


@pytest.mark.django_db
def test_task_list_is_paginated(api_client, user):
    for index in range(12):
        Task.objects.create(owner=user, title=f"Task {index}")
    api_client.force_authenticate(user=user)

    response = api_client.get(reverse("task-list"), {"page_size": 5})

    assert response.status_code == 200
    body = response.json()
    assert body["count"] == 12
    assert len(body["results"]) == 5
