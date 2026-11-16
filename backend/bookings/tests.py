from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
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

    def test_booking_requests_reserve_each_available_bed(self):
        owner = User.objects.create_user(username="owner", password="test-pass-123")
        first_student = User.objects.create_user(username="first", password="test-pass-123")
        second_student = User.objects.create_user(username="second", password="test-pass-123")
        third_student = User.objects.create_user(username="third", password="test-pass-123")
        prop = Property.objects.create(
            name="Capacity PG",
            location="Phagwara",
            address="Near LPU",
            owner=owner,
        )
        room = Room.objects.create(
            property=prop,
            room_number="3",
            room_type="triple",
            price=5000,
            capacity=2,
            available_beds=2,
        )
        client = APIClient()
        first_booking_id = None

        for student in (first_student, second_student):
            client.force_authenticate(user=student)
            response = client.post("/api/bookings/", {"room": str(room.pk)}, format="json")
            self.assertEqual(response.status_code, 201)
            if first_booking_id is None:
                first_booking_id = response.data["id"]

        room.refresh_from_db()
        self.assertEqual(room.available_beds, 0)

        client.force_authenticate(user=third_student)
        response = client.post("/api/bookings/", {"room": str(room.pk)}, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["message"], "No beds are currently available")

        client.force_authenticate(user=first_student)
        response = client.post(f"/api/bookings/{first_booking_id}/cancel/", format="json")
        self.assertEqual(response.status_code, 200)

        client.force_authenticate(user=third_student)
        response = client.post("/api/bookings/", {"room": str(room.pk)}, format="json")
        self.assertEqual(response.status_code, 201)

        response = client.get("/api/rooms/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, [])
