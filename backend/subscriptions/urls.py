from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PlanViewSet, SubscriptionView, PlanListView

router = DefaultRouter()
router.register(r'plans-admin', PlanViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('api/subscription/', SubscriptionView.as_view(), name='user-subscription'),
    path('api/plans/', PlanListView.as_view(), name='plan-list'),
]
