import django.db.models.functions.text
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("tasks", "0002_task"),
    ]

    operations = [
        migrations.RemoveConstraint(
            model_name="category",
            name="unique_category_name_per_owner",
        ),
        migrations.AddConstraint(
            model_name="category",
            constraint=models.UniqueConstraint(
                "owner",
                django.db.models.functions.text.Lower("name"),
                name="unique_category_name_ci_per_owner",
            ),
        ),
        migrations.AddIndex(
            model_name="category",
            index=models.Index(fields=["owner", "name"], name="category_owner_name_idx"),
        ),
        migrations.AddIndex(
            model_name="task",
            index=models.Index(fields=["owner", "-created_at"], name="task_owner_created_idx"),
        ),
        migrations.AddIndex(
            model_name="task",
            index=models.Index(fields=["owner", "status"], name="task_owner_status_idx"),
        ),
        migrations.AddIndex(
            model_name="task",
            index=models.Index(fields=["owner", "priority"], name="task_owner_priority_idx"),
        ),
        migrations.AddIndex(
            model_name="task",
            index=models.Index(fields=["owner", "due_date"], name="task_owner_due_idx"),
        ),
    ]
