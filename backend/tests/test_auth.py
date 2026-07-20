import pytest
from django.conf import settings
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
def test_register_creates_user_and_sets_refresh_cookie(api_client):
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
    assert body["access"]
    assert "refresh" not in body
    assert "password" not in body
    assert settings.REFRESH_TOKEN_COOKIE_NAME in response.cookies
    refresh_cookie = response.cookies[settings.REFRESH_TOKEN_COOKIE_NAME]
    assert refresh_cookie["httponly"]
    assert refresh_cookie["path"] == settings.REFRESH_TOKEN_COOKIE_PATH
    assert "password" not in body
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
def test_login_returns_access_and_sets_refresh_cookie(api_client, user):
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
    assert "refresh" not in body
    assert settings.REFRESH_TOKEN_COOKIE_NAME in response.cookies


@pytest.mark.django_db
def test_refresh_uses_cookie_and_rotates_refresh_cookie(api_client, user):
    login_response = api_client.post(
        reverse("token-obtain-pair"),
        {
            "email": user.email,
            "password": "secure-pass-123",
        },
        format="json",
    )
    original_refresh = login_response.cookies[settings.REFRESH_TOKEN_COOKIE_NAME].value
    api_client.cookies[settings.REFRESH_TOKEN_COOKIE_NAME] = original_refresh

    response = api_client.post(
        reverse("token-refresh"),
        format="json",
    )

    assert response.status_code == 200
    body = response.json()
    assert body["access"]
    assert "refresh" not in body
    assert response.cookies[settings.REFRESH_TOKEN_COOKIE_NAME].value != original_refresh


def test_refresh_rejects_missing_cookie(api_client):
    response = api_client.post(reverse("token-refresh"), format="json")

    assert response.status_code == 401


def test_auth_throttle_rates_are_configured():
    rates = settings.REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"]

    assert rates["login"]
    assert rates["register"]
    assert rates["token_refresh"]


@pytest.mark.django_db
def test_logout_clears_refresh_cookie(api_client, user):
    login_response = api_client.post(
        reverse("token-obtain-pair"),
        {
            "email": user.email,
            "password": "secure-pass-123",
        },
        format="json",
    )
    api_client.cookies[settings.REFRESH_TOKEN_COOKIE_NAME] = login_response.cookies[
        settings.REFRESH_TOKEN_COOKIE_NAME
    ].value
    api_client.force_authenticate(user=user)

    response = api_client.post(reverse("logout"), format="json")

    assert response.status_code == 204
    assert response.cookies[settings.REFRESH_TOKEN_COOKIE_NAME].value == ""


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
