from django.db import models
from django.conf import settings
from django_tenants.models import TenantMixin, DomainMixin
# Create your models here.
class Tenant(TenantMixin):
    name = models.CharField(max_length=100)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='tenants', null=True, blank=True)
   
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name
    

class Domain(DomainMixin):
    pass
    