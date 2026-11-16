from django.db import models
from django.contrib.auth.models import User
from properties.models import Room

class Booking(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
        ("cancelled", "Cancelled"),
    ]
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name="pgyora_bookings")
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name="bookings")
    booking_date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")

    def __str__(self):
        return f"{self.student.username} - {self.room}"

class Complaint(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("in_progress", "In progress"),
        ("resolved", "Resolved"),
    ]
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name="pgyora_complaints")
    room = models.ForeignKey(Room, on_delete=models.SET_NULL, null=True, blank=True, related_name="complaints")
    subject = models.CharField(max_length=120)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.subject
