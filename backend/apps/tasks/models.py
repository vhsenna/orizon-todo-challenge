from django.conf import settings
from django.core.validators import RegexValidator
from django.db import models


hex_color_validator = RegexValidator(
    regex=r"^#[0-9A-Fa-f]{6}$",
    message="Color must be a valid hex color, for example #2563eb.",
)


class Category(models.Model):
    name = models.CharField(max_length=100)
    color = models.CharField(
        max_length=7,
        validators=[hex_color_validator],
        default="#2563eb",
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="categories",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=("owner", "name"),
                name="unique_category_name_per_owner",
            ),
        ]
        ordering = ("name",)
        verbose_name_plural = "categories"

    def __str__(self) -> str:
        return self.name
