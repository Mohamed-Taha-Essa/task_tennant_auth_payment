import stripe
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from subscriptions.models import Plan, Subscription
import logging

# Configure Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY

User = get_user_model()

# Set up logging
logger = logging.getLogger(__name__)

# Create your views here.

class CreateCheckoutSessionView(APIView):
    permission_classes = [IsAuthenticated]

    def get_or_create_stripe_price(self, plan, is_subscription=True):
        """
        Get or create a Stripe price for the given plan.
        This avoids creating duplicate products and prices.
        """
        try:
            # Create a unique identifier for this plan
            mode_suffix = "Subscription" if is_subscription else "One-time"
            product_name = f"Plan: {plan.name} ({mode_suffix})"
            
            # Search for existing products with this name
            products = stripe.Product.list(limit=100)
            existing_product = None
            
            for product in products.data:
                if product.name == product_name:
                    existing_product = product
                    break
            
            # Create product if it doesn't exist
            if not existing_product:
                print(f'Creating new Stripe product for plan: {plan.name} ({mode_suffix})')
                stripe_product = stripe.Product.create(
                    name=product_name,
                    description=f"Plan: {plan.name} with max {plan.max_users} users ({mode_suffix})",
                )
            else:
                stripe_product = existing_product
                print(f'Using existing Stripe product: {stripe_product.id}')
            
            # Look for existing price for this product with same amount
            prices = stripe.Price.list(product=stripe_product.id, limit=100)
            target_amount = int(float(plan.price) * 100)
            existing_price = None
            
            for price in prices.data:
                price_matches = (
                    price.unit_amount == target_amount and 
                    price.currency == 'usd'
                )
                
                if is_subscription:
                    price_matches = price_matches and price.recurring and price.recurring.interval == 'month'
                else:
                    price_matches = price_matches and not price.recurring
                
                if price_matches:
                    existing_price = price
                    break
            
            # Create price if it doesn't exist
            if not existing_price:
                print(f'Creating new Stripe price for product: {stripe_product.id}')
                price_params = {
                    'product': stripe_product.id,
                    'unit_amount': target_amount,
                    'currency': 'usd',
                }
                
                if is_subscription:
                    price_params['recurring'] = {'interval': 'month'}
                
                stripe_price = stripe.Price.create(**price_params)
            else:
                stripe_price = existing_price
                print(f'Using existing Stripe price: {stripe_price.id}')
            
            return stripe_product, stripe_price
            
        except stripe.error.StripeError as e:
            print(f'Stripe error in get_or_create_stripe_price: {str(e)}')
            raise e

    def post(self, request, *args, **kwargs):
        try:
            # Enhanced logging for debugging
            print('\n=== New Checkout Request ===')
            print('User:', request.user)
            print('User authenticated:', request.user.is_authenticated)
            print('Request headers:', dict(request.headers))
            print('Request data:', request.data)
            print('Request content type:', request.content_type)
            
            # Check if user is authenticated
            if not request.user.is_authenticated:
                print('ERROR: User not authenticated')
                return Response(
                    {'error': 'Authentication required'}, 
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            # Get plan_id from request
            plan_id = request.data.get('plan_id')
            print(f'Plan ID received: {plan_id}')
            
            # Get payment mode (subscription by default)
            payment_mode = request.data.get('mode', 'subscription')  # 'subscription' or 'payment'
            is_subscription = payment_mode == 'subscription'
            print(f'Payment mode: {payment_mode}')
            
            if not plan_id:
                print('ERROR: No plan_id provided')
                return Response(
                    {'error': 'Plan ID is required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Check if plan_id is valid
            try:
                plan_id = int(plan_id)
            except (ValueError, TypeError):
                print(f'ERROR: Invalid plan_id format: {plan_id}')
                return Response(
                    {'error': 'Plan ID must be a valid integer'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            try:
                plan = Plan.objects.get(id=plan_id)
                print(f'Found plan: {plan.name} (${plan.price})')
            except Plan.DoesNotExist:
                print(f'ERROR: Plan with ID {plan_id} not found')
                available_plans = Plan.objects.all()
                print(f'Available plans: {[f"ID: {p.id}, Name: {p.name}" for p in available_plans]}')
                return Response(
                    {'error': f'Plan with ID {plan_id} not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )

            # Ensure required settings are configured
            required_settings = ['SITE_URL', 'STRIPE_PUBLIC_KEY', 'STRIPE_SECRET_KEY']
            for setting in required_settings:
                if not hasattr(settings, setting) or not getattr(settings, setting):
                    print(f'ERROR: Required setting {setting} is not configured')
                    raise Exception(f'Required setting {setting} is not configured')
            
            print(f'Using SITE_URL: {settings.SITE_URL}')
            print(f'Using Stripe keys (partially hidden): pk_test_***{settings.STRIPE_PUBLIC_KEY[-10:]}')
            
            # Get or create Stripe product and price for this plan
            try:
                stripe_product, stripe_price = self.get_or_create_stripe_price(plan, is_subscription)
                print(f'Using Stripe product: {stripe_product.id}, price: {stripe_price.id}')
                
            except stripe.error.StripeError as e:
                print(f'Error with Stripe product/price: {str(e)}')
                return Response(
                    {'error': f'Stripe configuration error: {str(e)}'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create checkout session with the appropriate price
            try:
                checkout_session_params = {
                    'payment_method_types': ['card'],
                    'line_items': [{
                        'price': stripe_price.id,
                        'quantity': 1,
                    }],
                    'mode': payment_mode,
                    'success_url': f"{settings.SITE_URL}/success?session_id={{CHECKOUT_SESSION_ID}}",
                    'cancel_url': f"{settings.SITE_URL}/cancel",
                    'client_reference_id': str(request.user.id),
                    'metadata': {
                        'plan_id': str(plan.id),
                        'stripe_product_id': stripe_product.id,
                        'stripe_price_id': stripe_price.id,
                        'payment_mode': payment_mode,
                    }
                }
                
                checkout_session = stripe.checkout.Session.create(**checkout_session_params)
                
                print('SUCCESS: Checkout session created:', checkout_session.id)
                return Response({
                    'sessionId': checkout_session.id,
                    'stripePublicKey': settings.STRIPE_PUBLIC_KEY,
                    'mode': payment_mode
                })
                
            except stripe.error.StripeError as e:
                print('Stripe API Error:', str(e))
                return Response(
                    {'error': f'Stripe error: {str(e)}'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            print('Server Error:', str(e))
            import traceback
            traceback.print_exc()
            return Response(
                {'error': f'Internal server error: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class StripeWebhookView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
        event = None

        print(f'\n=== Stripe Webhook Received ===')
        print(f'Signature: {sig_header}')
        print(f'Payload length: {len(payload)}')

        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
            print(f'Event verified: {event["type"]}')
        except ValueError as e:
            print(f'Invalid payload: {e}')
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except stripe.error.SignatureVerificationError as e:
            print(f'Invalid signature: {e}')
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f'Webhook error: {e}')
            # For development, allow webhooks without signature verification
            import json
            try:
                event = json.loads(payload.decode('utf-8'))
                print(f'Processing unsigned webhook event: {event.get("type")}')
            except:
                return Response(status=status.HTTP_400_BAD_REQUEST)

        # Handle the checkout.session.completed event
        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            user_id = session.get('client_reference_id')
            plan_id = session.get('metadata', {}).get('plan_id')
            payment_mode = session.get('metadata', {}).get('payment_mode', 'subscription')

            print(f'\n=== Webhook: Checkout Session Completed ===')
            print(f'User ID: {user_id}')
            print(f'Plan ID: {plan_id}')
            print(f'Payment Mode: {payment_mode}')
            print(f'Session ID: {session.get("id")}')
            print(f'Session metadata: {session.get("metadata", {})}')

            if not user_id or not plan_id:
                print('ERROR: Missing user_id or plan_id in session metadata')
                return Response({'error': 'Missing user_id or plan_id in session.'}, status=status.HTTP_400_BAD_REQUEST)

            try:
                user = User.objects.get(id=user_id)
                plan = Plan.objects.get(id=plan_id)
                print(f'Found user: {user.email}')
                print(f'Found plan: {plan.name} (${plan.price})')

                # Create or update the user's subscription regardless of payment mode
                # For one-time payments, this creates a "subscription" record for access control
                from datetime import datetime
                from django.utils import timezone
                
                subscription, created = Subscription.objects.update_or_create(
                    user=user,
                    defaults={
                        'plan': plan, 
                        'status': 'active',
                        'started_at': timezone.now(),
                        'source_id': session.get('id'),  # Store Stripe session ID
                        'amount': float(plan.price),
                        'currencey': 'usd'
                    }
                )
                
                action = 'Created' if created else 'Updated'
                print(f'{action} subscription for user {user.email} with plan {plan.name}')
                print(f'Subscription ID: {subscription.id}')

            except User.DoesNotExist:
                print(f'ERROR: User with ID {user_id} not found')
                return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
            except Plan.DoesNotExist:
                print(f'ERROR: Plan with ID {plan_id} not found')
                return Response({'error': 'Plan not found.'}, status=status.HTTP_404_NOT_FOUND)
            except Exception as e:
                print(f'ERROR creating subscription: {e}')
                import traceback
                traceback.print_exc()
                return Response({'error': 'Failed to create subscription.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        else:
            print(f'Unhandled webhook event type: {event["type"]}')

        return Response(status=status.HTTP_200_OK)


class TestSubscriptionView(APIView):
    """
    Test endpoint to manually create subscriptions - for debugging only
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        """
        Create a test subscription for the current user
        """
        try:
            plan_id = request.data.get('plan_id')
            if not plan_id:
                return Response({'error': 'plan_id is required'}, status=status.HTTP_400_BAD_REQUEST)

            plan = Plan.objects.get(id=plan_id)
            
            from django.utils import timezone
            subscription, created = Subscription.objects.update_or_create(
                user=request.user,
                defaults={
                    'plan': plan,
                    'status': 'active',
                    'started_at': timezone.now(),
                    'source_id': f'test_subscription_{request.user.id}',
                    'amount': float(plan.price),
                    'currencey': 'usd'
                }
            )
            
            action = 'created' if created else 'updated'
            return Response({
                'message': f'Test subscription {action} successfully',
                'subscription_id': subscription.id,
                'plan': plan.name,
                'user': request.user.email
            })
            
        except Plan.DoesNotExist:
            return Response({'error': 'Plan not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
