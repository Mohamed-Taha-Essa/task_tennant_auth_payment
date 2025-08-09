from rest_framework import viewsets, status, generics
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Plan, Subscription
from .serializers import PlanSerializer, SubscriptionSerializer

class PlanViewSet(viewsets.ModelViewSet):
    """
    A ViewSet for handling Plan CRUD operations. Only accessible by admin users.
    """
    queryset = Plan.objects.all()
    serializer_class = PlanSerializer
    permission_classes = [IsAdminUser]  # Only admin users can access this

class PlanListView(generics.ListAPIView):
    """
    A view for listing all plans. Accessible to all users.
    """
    queryset = Plan.objects.all()
    serializer_class = PlanSerializer
    # permission_classes = [IsAuthenticated]

class SubscriptionView(APIView):
    """
    API endpoint for users to view and manage their subscription.
    """
    permission_classes = [IsAuthenticated]  # Enable authentication

    def get(self, request, *args, **kwargs):
        """
        Retrieve the current user's subscription details.
        """
        try:
            subscription = Subscription.objects.get(user=request.user)
            serializer = SubscriptionSerializer(subscription)
            return Response(serializer.data)
        except Subscription.DoesNotExist:
            return Response({
                'detail': 'No subscription found.',
                'has_subscription': False
            }, status=status.HTTP_200_OK)  # Changed to 200 OK with flag

    def post(self, request, *args, **kwargs):
        """
        Create or update a subscription for the current user.
        Expects 'plan_id' in the request data.
        """
        plan_id = request.data.get('plan_id')
        if not plan_id:
            return Response({'detail': 'plan_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            plan = Plan.objects.get(id=plan_id)
        except Plan.DoesNotExist:
            return Response({'detail': 'Invalid plan_id.'}, status=status.HTTP_404_NOT_FOUND)

        # Get or create a subscription for the user
        subscription, created = Subscription.objects.update_or_create(
            user=request.user,
            defaults={'plan': plan}
        )

        serializer = SubscriptionSerializer(subscription)
        response_status = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        return Response(serializer.data, status=response_status)

