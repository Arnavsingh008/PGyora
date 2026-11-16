from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def home(request):
    return JsonResponse({"project": "PGyora API", "status": "running"})

urlpatterns = [
    path("", home),
    path("admin/", admin.site.urls),
    path("api/accounts/", include("accounts.urls")),
    path("api/", include("properties.urls")),
    path("api/", include("bookings.urls")),
]
