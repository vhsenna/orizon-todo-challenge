import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse

User = get_user_model()


@pytest.fixture
def user(db):
    return User.objects.create_user(
        email="joao@example.com",
        username="joao",
        password="secure-pass-123",
        first_name="Joao",
        last_name="Silva",
    )


@pytest.mark.django_db
def test_register_creates_user_and_returns_tokens(api_client):
    response = api_client.post(
        reverse("register"),
        {
            "email": "Maria@Example.com",
            "username": "maria",
            "first_name": "Maria",
            "last_name": "Oliveira",
            "password": "secure-pass-123",
        },
        format="json",
    )

    assert response.status_code == 201
    body = response.json()
    assert body["email"] == "maria@example.com"
    assert body["username"] == "maria"
    assert "password" not in body
    assert body["tokens"]["access"]
    assert body["tokens"]["refresh"]
    assert User.objects.filter(email="maria@example.com").exists()


@pytest.mark.django_db
def test_register_rejects_duplicate_email(api_client, user):
    response = api_client.post(
        reverse("register"),
        {
            "email": user.email.upper(),
            "username": "another",
            "password": "secure-pass-123",
        },
        format="json",
    )

    assert response.status_code == 400
    assert "email" in response.json()


@pytest.mark.django_db
def test_login_returns_jwt_tokens(api_client, user):
    response = api_client.post(
        reverse("token-obtain-pair"),
        {
            "email": user.email,
            "password": "secure-pass-123",
        },
        format="json",
    )

    assert response.status_code == 200
    body = response.json()
    assert body["access"]
    assert body["refresh"]


@pytest.mark.django_db
def test_refresh_returns_new_access_token(api_client, user):
    login_response = api_client.post(
        reverse("token-obtain-pair"),
        {
            "email": user.email,
            "password": "secure-pass-123",
        },
        format="json",
    )
    refresh = login_response.json()["refresh"]

    response = api_client.post(
        reverse("token-refresh"),
        {"refresh": refresh},
        format="json",
    )

    assert response.status_code == 200
    assert response.json()["access"]


@pytest.mark.django_db
def test_me_returns_authenticated_user(api_client, user):
    api_client.force_authenticate(user=user)

    response = api_client.get(reverse("me"))

    assert response.status_code == 200
    assert response.json() == {
        "id": user.id,
        "email": "joao@example.com",
        "username": "joao",
        "first_name": "Joao",
        "last_name": "Silva",
    }


@pytest.mark.django_db
def test_me_requires_authentication(api_client):
    response = api_client.get(reverse("me"))

    assert response.status_code == 401
