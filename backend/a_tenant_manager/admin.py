from django.contrib import admin
from django.db import connection
from .models import Tenant, Domain

# Register models only in the 'public' schema
if connection.schema_name == 'public':
    @admin.register(Tenant)
    class TenantAdmin(admin.ModelAdmin):
        list_display = ('name', 'schema_name', 'owner_email')
        search_fields = ('name', 'schema_name', 'owner__email')

        def owner_email(self, obj):
            if obj.owner:
                return obj.owner.email
            return "No Owner"
        owner_email.short_description = 'Owner Email'
        def _only_public_tenant_access(self, request):
            if not hasattr(request, 'tenant'):
                return False  # Or True if you want to allow in public by default
            return request.tenant.schema_name == get_public_schema_name()
    admin.site.register(Domain)