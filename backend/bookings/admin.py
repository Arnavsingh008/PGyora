from django.contrib import admin
from .models import Booking, Complaint

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ("id", "student", "room", "status", "booking_date")
    list_filter = ("status",)

@admin.register(Complaint)
class ComplaintAdmin(admin.ModelAdmin):
    list_display = ("id", "student", "subject", "status", "created_at")
    list_filter = ("status",)
