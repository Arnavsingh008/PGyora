from django.db import models
from django.contrib.auth.models import User

class Property(models.Model):
    name = models.CharField(max_length=150)
    location = models.CharField(max_length=120)
    address = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="properties")
    image_url = models.URLField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Room(models.Model):
    ROOM_TYPES = [
        ("single", "Single Sharing"),
        ("double", "Double Sharing"),
        ("triple", "Triple Sharing"),
    ]
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name="rooms")
    room_number = models.CharField(max_length=30)
    room_type = models.CharField(max_length=20, choices=ROOM_TYPES)
    price = models.PositiveIntegerField()
    capacity = models.PositiveIntegerField(default=1)
    available_beds = models.PositiveIntegerField(default=1)
    facilities = models.JSONField(default=list, blank=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.property.name} - {self.room_number}"
