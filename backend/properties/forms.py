from django import forms
from .models import Room

class ComplaintForm(forms.Form):
    subject = forms.CharField(max_length=120)
    description = forms.CharField(widget=forms.Textarea)
    room_id = forms.IntegerField(required=False)

class RoomSearchForm(forms.Form):
    location = forms.CharField(required=False)
    max_price = forms.IntegerField(required=False, min_value=0)
