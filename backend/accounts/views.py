from rest_framework.permissions import IsAuthenticated , AllowAny
from django.contrib.sites.shortcuts import get_current_site
from django.template.loader import render_to_string
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model, authenticate
from django.core.mail import send_mail,EmailMessage,EmailMultiAlternatives
from django.utils.http import urlsafe_base64_decode , urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.contrib.auth.tokens import default_token_generator
from rest_framework import generics
from .models import CustomUser
from .serializers import UserSignupSerializer
from .serializers import UserSignupSerializer , CustomUserSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.files.storage import default_storage
from rest_framework.parsers import MultiPartParser, FormParser
from django.utils.html import strip_tags
# from .tasks import send_activation_email_task  # Import the task

user = get_user_model()  # get CustomUser


class UserLoginAPI(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        password = request.data.get('password')
        print(f"Attempting login with email: {email}, password: {password}")
        if not email or not password:
            return Response({'error': 'Email and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        # user = authenticate(request, email=email, password=password)
        user = authenticate(request, email=email, password=password)
        
        if user is None:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

        refresh = RefreshToken.for_user(user)
        user_data = {
            'user_id': user.id,
            'email': user.email,
            'username': user.username
        }

        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': user_data
        }, status=status.HTTP_200_OK)

class UserLogoutAPI(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class UserSignupAPI(APIView):
    permission_classes = [AllowAny]
    def post(self, request, *args, **kwargs):
        serializer = UserSignupSerializer(data=request.data)

        if not serializer.is_valid():
            return Response({'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.save(is_active=False)

        # Prepare data for the background task
        current_site = get_current_site(request)
        domain = current_site.domain
        secure = request.is_secure()

        # Call the Celery task for sending the email
        # send_activation_email_task.delay(user.pk, domain, secure)

        return Response({
            'success': 'User was registered successfully. Please check your email to activate your account.',
            'email': user.email
        }, status=status.HTTP_201_CREATED)
    
    
class UserProfileAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get(self,request,*args,**kwargs):
        user = request.user 
        serializer = CustomUserSerializer(user ,context={'request': request})
        print('user========' ,user)
        return Response(serializer.data , status=status.HTTP_200_OK)
    
class UserUpdateProfileAPI(generics.UpdateAPIView):
    """
    API for updating user profile information.
    Only authenticated users can update their profile.
    """
    serializer_class = CustomUserSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def get_object(self):
        # Get the user object based on the authenticated user
        return self.request.user

    def perform_update(self, serializer):
        
        serializer.save()

class UserDetailAPI(generics.RetrieveAPIView):
    permission_classes = [AllowAny]

    queryset = user.objects.all()
    serializer_class = CustomUserSerializer

class ChangePasswordAPI(APIView):
    permission_classes = [AllowAny]
    
    def put(self,request):
        user = request.user
        data = request.data

        old_password = data.get('old_password')
        new_password = data.get('new_password')

        # Validate inputs
        if not old_password or not new_password:
            return Response(
                {'message': 'Both old and new passwords are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # if len(new_password) < 8:
        #     return Response(
        #         {'message': 'New password must be at least 8 characters long.'},
        #         status=status.HTTP_400_BAD_REQUEST
        #     )

        # Verify old password
        if not user.check_password(old_password):
            return Response(
                {'message': 'Old password is incorrect.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update password
        try:
            user.set_password(new_password)
            user.save()

            # Send a response
            return Response(
                {'message': 'Password has been changed successfully.'},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {'message': 'An error occurred while updating the password.', 'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ResendActivationCodeAPI(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        try:
            user = user.objects.get(email=email)
        except Exception as e:
            return Response({'error': e}, status=status.HTTP_400_BAD_REQUEST)

        if user.is_active:
            return Response({'error' : 'user account is already activated'} , status=status.HTTP_400_BAD_REQUEST)
        
        # activation link 
        current_site = get_current_site(request) # get domain 
        mail_subject = 'Activate Your Account'
        
        # render email content in html template 
        message = render_to_string('accounts/activate_email.html',{
            'user': user , 
            'domain' : current_site.domain , 
            'uid' : urlsafe_base64_decode(force_bytes(user.id)),
            'token': default_token_generator.make_token(user) 
        })
        to_email = user.email
        send_mail(mail_subject,message,'pythondeveloper6@gmail.com',[to_email])
        return Response({'success':'User was registered successfully , please check your email '},status=status.HTTP_200_OK)
    

class ResetPasswordAPI(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        try:
            user = user.objects.get(email=email)
        except Exception as e:
            return Response({'error': e}, status=status.HTTP_400_BAD_REQUEST)

        # activation link 
        current_site = get_current_site(request) # get domain 
        mail_subject = 'Reset Your Password'
        
        # render email content in html template 
        message = render_to_string('accounts/password_reset_email.html',{
            'user': user , 
            'domain' : current_site.domain , 
            'uid' : urlsafe_base64_decode(force_bytes(user.id)),
            'token': default_token_generator.make_token(user) 
        })
        to_email = user.email
        send_mail(mail_subject,message,'pythondeveloper6@gmail.com',[to_email])
        return Response({'success':'User was registered successfully , please check your email '},status=status.HTTP_200_OK)
