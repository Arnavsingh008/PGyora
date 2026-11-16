
from rest_framework import serializers
from .models import Property, Room


class PropertySerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    owner = serializers.CharField(read_only=True)
    owner_name = serializers.CharField(
        source="owner.username",
        read_only=True
    )

    class Meta:
        model = Property
        fields = "__all__"
        read_only_fields = ["owner", "created_at"]


class RoomSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    image_url = serializers.CharField(
    source="property.image_url",
    read_only=True
)

    property = serializers.PrimaryKeyRelatedField(
        queryset=Property.objects.all(),
        pk_field=serializers.CharField()
    )

    property_name = serializers.CharField(
        source="property.name",
        read_only=True
    )

    location = serializers.CharField(
        source="property.location",
        read_only=True
    )

    class Meta:
        model = Room
        fields = "__all__"
