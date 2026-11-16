
from rest_framework import serializers
from .models import Booking, Complaint
from properties.models import Room


class BookingSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    student = serializers.CharField(read_only=True)

    room = serializers.PrimaryKeyRelatedField(
        queryset=Room.objects.all(),
        pk_field=serializers.CharField()
    )

    room_number = serializers.CharField(
        source="room.room_number",
        read_only=True
    )

    property_name = serializers.CharField(
        source="room.property.name",
        read_only=True
    )

    class Meta:
        model = Booking
        fields = "__all__"
        read_only_fields = [
            "student",
            "status",
            "booking_date",
            "bed_reserved"
        ]


class ComplaintSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    student = serializers.CharField(read_only=True)

    room = serializers.PrimaryKeyRelatedField(
        queryset=Room.objects.all(),
        pk_field=serializers.CharField(),
        required=False,
        allow_null=True
    )

    class Meta:
        model = Complaint
        fields = "__all__"
        read_only_fields = [
            "student",
            "status",
            "created_at"
        ]
