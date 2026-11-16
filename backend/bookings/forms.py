from django import forms
from .models import Complaint

class DjangoComplaintForm(forms.ModelForm):
    class Meta:
        model = Complaint
        fields = ["room", "subject", "description"]
