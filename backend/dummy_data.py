import os
import django
import random
from faker import Faker

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project.settings')
django.setup()

from django.db import connection
from django_tenants.utils import schema_context
from django.contrib.auth import get_user_model
from a_tenant_manager.models import Tenant, Domain
from subscriptions.models import Plan, Subscription

fake = Faker()
User = get_user_model()

# Create Plans in Public Schema
def create_plans():
    with schema_context('public'):
        plans = [
            {"name": "Free", "price": 0},
            {"name": "Pro", "price": 50},
            {"name": "Enterprise", "price": 200}
        ]
        for p in plans:
            Plan.objects.get_or_create(
                name=p["name"],
                defaults={"price": p["price"]}
            )
        print("✅ Plans created in public schema")

# Create Tenants
def create_tenants_with_domains(num=3):
    tenants = []
    with schema_context('public'):
        for _ in range(num):
            email = fake.unique.email()
            owner = User.objects.create_user(
                first_name=fake.first_name(),
                last_name=fake.last_name(),
                email=email,
                password="password123"
            )
            tenant_name = fake.company()
            # Sanitize the company name to create a valid subdomain and schema_name
            sanitized_name = ''.join(filter(str.isalnum, tenant_name.lower()))
            subdomain = f"{sanitized_name}{fake.random_int(min=100, max=999)}"

            tenant = Tenant.objects.create(
                schema_name=subdomain, # Explicitly set a valid schema_name
                name=tenant_name,
                subdomain=subdomain,
                owner=owner
            )
            Domain.objects.create(
                domain=f"{subdomain}.localhost",
                tenant=tenant,
                is_primary=True
            )
            tenants.append(tenant)
    print(f"✅ Created {len(tenants)} tenants with domains")
    return tenants

# Create subscriptions for each tenant
def create_subscriptions_for_tenants(tenants):
    with schema_context('public'):
        plans = list(Plan.objects.all())
    for tenant in tenants:
        plan = random.choice(plans)
        with schema_context(tenant.subdomain):
            Subscription.objects.create(
                tenant=tenant,
                plan=plan,
                start_date=fake.date_this_year(),
                end_date=fake.date_this_year(),
                active=True
            )
    print("✅ Subscriptions created for tenants")

if __name__ == "__main__":
    create_plans()
    tenants = create_tenants_with_domains(3)
    create_subscriptions_for_tenants(tenants)
    print("🎉 Dummy multi-tenant data generation complete!")
