from rest_framework import serializers
from .models import Plan, Subscription

class PlanSerializer(serializers.ModelSerializer):
    """
    Serializer for the Plan model.
    """

    class Meta:
        model = Plan
        fields = ['id', 'name', 'price', 'max_users']

class SubscriptionSerializer(serializers.ModelSerializer):
    """
    Serializer for the Subscription model.
    Includes nested serialization of the associated plan.
    """
    plan = PlanSerializer(read_only=True)

    class Meta:
        model = Subscription
        fields = [
            'id', 'user', 'plan', 'currencey', 'amount', 
            'started_at', 'ended_at', 'canceled_at', 'status', 'source_id'
        ]
        read_only_fields = ['user']
