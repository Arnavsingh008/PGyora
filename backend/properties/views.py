from django.shortcuts import get_object_or_404, render
from django.contrib.auth.decorators import login_required
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Property, Room
from .serializers import PropertySerializer, RoomSerializer

def is_admin(user):
    return user.is_authenticated and user.is_staff

@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def properties_list(request):
    if request.method == "GET":
        qs = Property.objects.filter(is_active=True)
        location = request.query_params.get("location")
        if location:
            qs = qs.filter(location__icontains=location)
        return Response(PropertySerializer(qs, many=True).data)
    if not is_admin(request.user):
        return Response({"message": "Admin access required"}, status=403)
    serializer = PropertySerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(owner=request.user)
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)

@api_view(["GET", "PUT", "DELETE"])
@permission_classes([AllowAny])
def property_detail(request, pk):
    obj = get_object_or_404(Property, pk=pk)
    if request.method == "GET":
        return Response(PropertySerializer(obj).data)
    if not is_admin(request.user):
        return Response({"message": "Admin access required"}, status=403)
    if request.method == "DELETE":
        obj.delete()
        return Response(status=204)
    serializer = PropertySerializer(obj, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=400)

@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def rooms_list(request):
    if request.method == "GET":
        qs = Room.objects.filter(
            is_active=True,
            property__is_active=True,
            available_beds__gt=0,
        )
        location = request.query_params.get("location")
        max_price = request.query_params.get("max_price")
        room_type = request.query_params.get("room_type")
        if location:
            qs = qs.filter(property__location__icontains=location)
        if max_price:
            try:
                qs = qs.filter(price__lte=int(max_price))
            except ValueError:
                return Response({"message": "max_price must be a number"}, status=400)
        if room_type:
            qs = qs.filter(room_type=room_type)
        return Response(RoomSerializer(qs, many=True).data)
    if not is_admin(request.user):
        return Response({"message": "Admin access required"}, status=403)
    serializer = RoomSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)

@api_view(["GET", "PUT", "DELETE"])
@permission_classes([AllowAny])
def room_detail(request, pk):
    obj = get_object_or_404(Room, pk=pk)
    if request.method == "GET":
        return Response(RoomSerializer(obj).data)
    if not is_admin(request.user):
        return Response({"message": "Admin access required"}, status=403)
    if request.method == "DELETE":
        obj.delete()
        return Response(status=204)
    serializer = RoomSerializer(obj, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=400)

@api_view(["POST"])
@permission_classes([AllowAny])
def smart_room_finder(request):
    qs = Room.objects.filter(is_active=True, property__is_active=True, available_beds__gt=0)
    location = request.data.get("location")
    max_price = request.data.get("max_price")
    room_type = request.data.get("room_type")
    facilities = request.data.get("facilities", [])
    if location:
        qs = qs.filter(property__location__icontains=location)
    if max_price not in (None, ""):
        try:
            qs = qs.filter(price__lte=int(max_price))
        except (TypeError, ValueError):
            return Response({"message": "max_price must be a number"}, status=400)
    if room_type:
        qs = qs.filter(room_type=room_type)
    results = []
    for room in qs:
        available = set(room.facilities or [])
        wanted = set(facilities or [])
        score = 100 if not wanted else round(len(available & wanted) / len(wanted) * 100)
        data = RoomSerializer(room).data
        data["match_percentage"] = score
        results.append(data)
    results.sort(key=lambda x: x["match_percentage"], reverse=True)
    return Response(results)

@login_required
def room_detail_page(request, pk):
    room = get_object_or_404(Room, pk=pk)
    return render(request, "properties/room_detail.html", {"room": room})
