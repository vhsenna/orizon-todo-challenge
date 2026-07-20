from django.core.exceptions import ImproperlyConfigured

from .base import *  # noqa: F403

DEBUG = False

if SECRET_KEY == "change-me-in-development-only-keep-this-secret":  # noqa: F405
    raise ImproperlyConfigured("DJANGO_SECRET_KEY must be set for production.")

SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
REFRESH_TOKEN_COOKIE_SECURE = True
SECURE_SSL_REDIRECT = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_HSTS_SECONDS = 60 * 60 * 24 * 30
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
