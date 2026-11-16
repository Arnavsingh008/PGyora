from django.contrib import admin
from .models import Property, Room

class RoomInline(admin.TabularInline):
    model = Room
    extra = 0

@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = ("name", "location", "owner", "is_active")
    search_fields = ("name", "location")
    list_filter = ("is_active",)
    inlines = [RoomInline]

@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ("room_number", "property", "room_type", "price", "available_beds", "is_active")
    list_filter = ("room_type", "is_active")
