from django.urls import path
from . import views

urlpatterns = [
    path("bookings/", views.bookings),
    path("bookings/<str:pk>/cancel/", views.cancel_booking),
    path("bookings/<str:pk>/<str:action>/", views.booking_action),
    path("complaints/", views.complaints),
    path("complaints/<str:pk>/", views.complaint_update),
    path("demo/complaint/", views.complaint_form_page, name="complaint-form"),
]
