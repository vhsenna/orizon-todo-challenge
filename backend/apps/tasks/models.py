from django.conf import settings
from django.core.validators import RegexValidator
from django.db import models
from django.db.models.functions import Lower


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
                "owner",
                Lower("name"),
                name="unique_category_name_ci_per_owner",
            ),
        ]
        indexes = [
            models.Index(fields=("owner", "name"), name="category_owner_name_idx"),
        ]
        ordering = ("name",)
        verbose_name_plural = "categories"

    def __str__(self) -> str:
        return self.name


class Task(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        IN_PROGRESS = "in_progress", "In progress"
        COMPLETED = "completed", "Completed"

    class Priority(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    priority = models.CharField(
        max_length=10,
        choices=Priority.choices,
        default=Priority.MEDIUM,
    )
    due_date = models.DateTimeField(blank=True, null=True)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="owned_tasks",
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="tasks",
    )
    shared_with = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        blank=True,
        related_name="shared_tasks",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=("owner", "-created_at"), name="task_owner_created_idx"),
            models.Index(fields=("owner", "status"), name="task_owner_status_idx"),
            models.Index(fields=("owner", "priority"), name="task_owner_priority_idx"),
            models.Index(fields=("owner", "due_date"), name="task_owner_due_idx"),
        ]
        ordering = ("-created_at",)

    def __str__(self) -> str:
        return self.title
