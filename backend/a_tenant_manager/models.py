from django.db import models
from django_tenants.models import TenantMixin, DomainMixin
# Create your models here.
class Tenant(TenantMixin):
    name = models.CharField(max_length=100)
    subdomain = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    owner = models.ForeignKey('accounts.CustomUser', on_delete=models.CASCADE)
    
    def __str__(self):
        return self.name


class Domain(DomainMixin):
    pass
    