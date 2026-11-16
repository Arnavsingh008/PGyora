from django.apps import AppConfig
class PropertiesConfig(AppConfig):
    default_auto_field = "django_mongodb_backend.fields.ObjectIdAutoField"
    name = "properties"
