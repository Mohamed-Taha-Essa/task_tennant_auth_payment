from django.contrib import admin
from .models import Tenant, Domain

@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = ('name', 'schema_name', 'owner_email')
    search_fields = ('name', 'schema_name', 'owner__email')

    def owner_email(self, obj):
        if obj.owner:
            return obj.owner.email
        return "No Owner"
    owner_email.short_description = 'Owner Email'

admin.site.register(Domain)
