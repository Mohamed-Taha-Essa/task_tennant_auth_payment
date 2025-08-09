from django.db import models
from django.conf import settings

class Plan(models.Model):
    """
    Represents a subscription plan available to users.
    """
    name = models.CharField(max_length=100, unique=True, help_text="The name of the plan (e.g., Free, Pro, Enterprise).")
    price = models.DecimalField(max_digits=10, decimal_places=2, help_text="The monthly price of the plan.")
    max_users = models.PositiveIntegerField(default=1, help_text="The maximum number of users allowed under this plan.")

    def __str__(self):
        return self.name

class Subscription(models.Model):
    """
    Represents a user's subscription to a specific plan.
    """
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='subscription', help_text="The user who owns this subscription.")
    plan = models.ForeignKey(Plan, on_delete=models.SET_NULL, null=True, help_text="The plan this user is subscribed to.")
    
    currencey = models.CharField(max_length=10, default='usd', help_text="The currency of the subscription.")
    amount = models.FloatField(default=0, help_text="The amount of the subscription.")
   
   
    started_at = models.DateTimeField(blank=True, null=True)
    ended_at = models.DateTimeField(blank=True, null=True)
    canceled_at = models.DateTimeField(blank=True, null=True)

    status = models.CharField(max_length=255, blank=True, null=True)    # source_id here refers to the ids in the corresponding stripe models. We use these models to link a subscription to a user in our system
   
   #source_id here refers to the ids in the corresponding stripe models. We use these models to link a subscription to a user in our system.
    source_id = models.CharField(max_length=255, null=True, blank=True, help_text="The ID of the payment source.")
    def __str__(self):
        return f'{self.user.email} - {self.plan.name if self.plan else "No Plan"}'

