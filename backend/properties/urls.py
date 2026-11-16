from django.urls import path
from . import views

urlpatterns = [
    path("properties/", views.properties_list),
    path("properties/<str:pk>/", views.property_detail),
    path("rooms/", views.rooms_list),
    path("rooms/find/", views.smart_room_finder),
    path("rooms/<str:pk>/", views.room_detail),
    path("demo/rooms/<int:pk>/", views.room_detail_page, name="room-detail-page"),
]
