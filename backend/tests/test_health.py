from django.urls import reverse


def test_health_check_returns_ok(api_client):
    response = api_client.get(reverse("health-check"))

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
