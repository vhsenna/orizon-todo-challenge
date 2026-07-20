from django.conf import settings
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import generics
from rest_framework import serializers
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer, TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import RegisterSerializer, UserSerializer


AccessTokenResponseSerializer = inline_serializer(
    name="AccessTokenResponse",
    fields={"access": serializers.CharField()},
)


def _refresh_cookie_kwargs():
    refresh_lifetime = settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"]
    return {
        "max_age": int(refresh_lifetime.total_seconds()),
        "httponly": True,
        "secure": settings.REFRESH_TOKEN_COOKIE_SECURE,
        "samesite": settings.REFRESH_TOKEN_COOKIE_SAMESITE,
        "path": settings.REFRESH_TOKEN_COOKIE_PATH,
    }


def _set_refresh_cookie(response, refresh_token: str):
    response.set_cookie(
        settings.REFRESH_TOKEN_COOKIE_NAME,
        refresh_token,
        **_refresh_cookie_kwargs(),
    )


def _clear_refresh_cookie(response):
    response.delete_cookie(
        settings.REFRESH_TOKEN_COOKIE_NAME,
        path=settings.REFRESH_TOKEN_COOKIE_PATH,
        samesite=settings.REFRESH_TOKEN_COOKIE_SAMESITE,
    )


class RegisterView(generics.CreateAPIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer
    throttle_scope = "register"

    @extend_schema(responses={201: AccessTokenResponseSerializer})
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        response = Response({"access": str(refresh.access_token)}, status=201)
        _set_refresh_cookie(response, str(refresh))
        return response


class LoginView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    serializer_class = TokenObtainPairSerializer
    throttle_scope = "login"

    @extend_schema(
        request=TokenObtainPairSerializer,
        responses={200: AccessTokenResponseSerializer},
    )
    def post(self, request):
        serializer = TokenObtainPairSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        response = Response({"access": serializer.validated_data["access"]})
        _set_refresh_cookie(response, serializer.validated_data["refresh"])
        return response


class CookieTokenRefreshView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    serializer_class = TokenRefreshSerializer
    throttle_scope = "token_refresh"

    @extend_schema(request=None, responses={200: AccessTokenResponseSerializer})
    def post(self, request):
        refresh_token = request.COOKIES.get(settings.REFRESH_TOKEN_COOKIE_NAME)
        if not refresh_token:
            return Response({"detail": "Refresh cookie is missing."}, status=401)

        serializer = TokenRefreshSerializer(data={"refresh": refresh_token})
        serializer.is_valid(raise_exception=True)
        response = Response({"access": serializer.validated_data["access"]})
        replacement_refresh = serializer.validated_data.get("refresh")
        if replacement_refresh:
            _set_refresh_cookie(response, replacement_refresh)
        return response


class LogoutView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    @extend_schema(request=None, responses={204: None})
    def post(self, request):
        refresh_token = request.COOKIES.get(settings.REFRESH_TOKEN_COOKIE_NAME)
        if refresh_token:
            try:
                RefreshToken(refresh_token).blacklist()
            except TokenError:
                pass
        response = Response(status=204)
        _clear_refresh_cookie(response)
        return response


class CurrentUserView(generics.RetrieveAPIView):
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user
