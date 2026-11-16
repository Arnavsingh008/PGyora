from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from .models import Property, Room

class RoomModelTest(TestCase):
    def test_room_string(self):
        owner = User.objects.create_user(username="owner", password="test-pass-123")
        prop = Property.objects.create(name="Green Residency", location="Phagwara",
                                       address="Near campus", owner=owner)
        room = Room.objects.create(property=prop, room_number="101", room_type="double",
                                   price=6500, capacity=2, available_beds=1)
        self.assertIn("101", str(room))

    def test_room_filters_and_finder_explain_matches(self):
        owner = User.objects.create_user(username="owner", password="test-pass-123")
        prop = Property.objects.create(
            name="Finder PG",
            location="Phagwara",
            address="Near campus",
            owner=owner,
        )
        Room.objects.create(
            property=prop,
            room_number="201",
            room_type="double",
            price=6500,
            capacity=2,
            available_beds=1,
            facilities=["WiFi", "AC"],
        )
        client = APIClient()

        response = client.get(
            "/api/rooms/",
            {"facilities": "WiFi, AC", "sort": "price_asc"},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)

        response = client.post(
            "/api/rooms/find/",
            {"location": "Phagwara", "max_price": 7000, "facilities": ["WiFi", "AC"]},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data[0]["facility_match"], 100)
        self.assertTrue(response.data[0]["match_reasons"])
