from django.test import TestCase
from django.contrib.auth.models import User
from .models import Property, Room

class RoomModelTest(TestCase):
    def test_room_string(self):
        owner = User.objects.create_user(username="owner", password="test-pass-123")
        prop = Property.objects.create(name="Green Residency", location="Phagwara",
                                       address="Near campus", owner=owner)
        room = Room.objects.create(property=prop, room_number="101", room_type="double",
                                   price=6500, capacity=2, available_beds=1)
        self.assertIn("101", str(room))
