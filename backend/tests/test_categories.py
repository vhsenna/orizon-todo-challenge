import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse

from apps.tasks.models import Category

User = get_user_model()


@pytest.fixture
def user(db):
    return User.objects.create_user(
        email="owner@example.com",
        username="owner",
        password="secure-pass-123",
    )


@pytest.fixture
def other_user(db):
    return User.objects.create_user(
        email="other@example.com",
        username="other",
        password="secure-pass-123",
    )


@pytest.mark.django_db
def test_category_list_requires_authentication(api_client):
    response = api_client.get(reverse("category-list"))

    assert response.status_code == 401


@pytest.mark.django_db
def test_user_can_create_category(api_client, user):
    api_client.force_authenticate(user=user)

    response = api_client.post(
        reverse("category-list"),
        {"name": "Work", "color": "#16a34a"},
        format="json",
    )

    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "Work"
    assert body["color"] == "#16a34a"
    assert Category.objects.get(id=body["id"]).owner == user


@pytest.mark.django_db
def test_category_name_is_unique_case_insensitively_per_owner(api_client, user):
    Category.objects.create(owner=user, name="Work", color="#2563eb")
    api_client.force_authenticate(user=user)

    response = api_client.post(
        reverse("category-list"),
        {"name": "work", "color": "#16a34a"},
        format="json",
    )

    assert response.status_code == 400
    assert "name" in response.json()


@pytest.mark.django_db
def test_category_color_must_be_hex(api_client, user):
    api_client.force_authenticate(user=user)

    response = api_client.post(
        reverse("category-list"),
        {"name": "Personal", "color": "green"},
        format="json",
    )

    assert response.status_code == 400
    assert "color" in response.json()


@pytest.mark.django_db
def test_user_only_lists_own_categories(api_client, user, other_user):
    own_category = Category.objects.create(
        owner=user,
        name="Work",
        color="#2563eb",
    )
    Category.objects.create(
        owner=other_user,
        name="Private",
        color="#dc2626",
    )
    api_client.force_authenticate(user=user)

    response = api_client.get(reverse("category-list"))

    assert response.status_code == 200
    assert response.json()["results"] == [
        {
            "id": own_category.id,
            "name": "Work",
            "color": "#2563eb",
            "created_at": own_category.created_at.isoformat().replace("+00:00", "Z"),
            "updated_at": own_category.updated_at.isoformat().replace("+00:00", "Z"),
        }
    ]


@pytest.mark.django_db
def test_user_can_update_own_category(api_client, user):
    category = Category.objects.create(owner=user, name="Work", color="#2563eb")
    api_client.force_authenticate(user=user)

    response = api_client.patch(
        reverse("category-detail", args=[category.id]),
        {"name": "Deep Work"},
        format="json",
    )

    assert response.status_code == 200
    category.refresh_from_db()
    assert category.name == "Deep Work"


@pytest.mark.django_db
def test_user_cannot_access_other_users_category(api_client, user, other_user):
    category = Category.objects.create(
        owner=other_user,
        name="Private",
        color="#dc2626",
    )
    api_client.force_authenticate(user=user)

    response = api_client.get(reverse("category-detail", args=[category.id]))

    assert response.status_code == 404


@pytest.mark.django_db
def test_user_can_delete_own_category(api_client, user):
    category = Category.objects.create(owner=user, name="Work", color="#2563eb")
    api_client.force_authenticate(user=user)

    response = api_client.delete(reverse("category-detail", args=[category.id]))

    assert response.status_code == 204
    assert not Category.objects.filter(id=category.id).exists()
