from django.shortcuts import get_object_or_404, redirect, render
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.views.decorators.http import require_POST
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from properties.models import Room
from .models import Booking, Complaint
from .serializers import BookingSerializer, ComplaintSerializer
from .forms import DjangoComplaintForm

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def bookings(request):
    if request.method == "GET":
        qs = Booking.objects.all() if request.user.is_staff else Booking.objects.filter(student=request.user)
        return Response(BookingSerializer(qs, many=True).data)
    room = get_object_or_404(Room, pk=request.data.get("room"))
    if room.available_beds < 1 or not room.is_active:
        return Response({"message": "No beds are currently available"}, status=400)
    existing = Booking.objects.filter(student=request.user, room=room, status__in=["pending", "approved"])
    if existing.exists():
        return Response({"message": "You already have an active request for this room"}, status=400)
    booking = Booking.objects.create(student=request.user, room=room)
    return Response(BookingSerializer(booking).data, status=201)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def booking_action(request, pk, action):
    if not request.user.is_staff:
        return Response({"message": "Admin access required"}, status=403)
    booking = get_object_or_404(Booking, pk=pk)
    room = booking.room
    if action == "approve":
        if booking.status != "pending":
            return Response({"message": "Only pending bookings can be approved"}, status=400)
        if room.available_beds < 1:
            return Response({"message": "No beds available"}, status=400)
        room.available_beds -= 1
        room.save()
        booking.status = "approved"
    elif action == "reject":
        if booking.status != "pending":
            return Response({"message": "Only pending bookings can be rejected"}, status=400)
        booking.status = "rejected"
    else:
        return Response({"message": "Unknown action"}, status=400)
    booking.save()
    return Response(BookingSerializer(booking).data)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def cancel_booking(request, pk):
    if request.user.is_staff:
        booking = get_object_or_404(Booking, pk=pk)
    else:
        booking = get_object_or_404(
            Booking,
            pk=pk,
            student=request.user,
        )
    if booking.status not in ["pending", "approved"]:
        return Response({"message": "This booking cannot be cancelled"}, status=400)
    if booking.status == "approved":
        booking.room.available_beds += 1
        booking.room.save()
    booking.status = "cancelled"
    booking.save()
    return Response(BookingSerializer(booking).data)

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def complaints(request):
    if request.method == "GET":
        qs = Complaint.objects.all() if request.user.is_staff else Complaint.objects.filter(student=request.user)
        return Response(ComplaintSerializer(qs, many=True).data)
    serializer = ComplaintSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(student=request.user)
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)

@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def complaint_update(request, pk):
    if not request.user.is_staff:
        return Response({"message": "Admin access required"}, status=403)
    complaint = get_object_or_404(Complaint, pk=pk)
    new_status = request.data.get("status")
    if new_status not in ["pending", "in_progress", "resolved"]:
        return Response({"message": "Invalid complaint status"}, status=400)
    complaint.status = new_status
    complaint.save()
    return Response(ComplaintSerializer(complaint).data)

@login_required
def complaint_form_page(request):
    if request.method == "POST":
        form = DjangoComplaintForm(request.POST)
        if form.is_valid():
            item = form.save(commit=False)
            item.student = request.user
            item.save()
            messages.success(request, "Complaint submitted successfully.")
            return redirect("complaint-form")
    else:
        form = DjangoComplaintForm()
    return render(request, "bookings/complaint_form.html", {"form": form})
