from django.test import TestCase
from django.contrib.auth.models import User
from properties.models import Property, Room
from .models import Booking

class BookingModelTest(TestCase):
    def test_booking_default_status(self):
        user = User.objects.create_user(username="student", password="test-pass-123")
        owner = User.objects.create_user(username="owner", password="test-pass-123")
        prop = Property.objects.create(name="Test PG", location="Phagwara", address="Near LPU", owner=owner)
        room = Room.objects.create(property=prop, room_number="1", room_type="single",
                                   price=7000, capacity=1, available_beds=1)
        booking = Booking.objects.create(student=user, room=room)
        self.assertEqual(booking.status, "pending")
