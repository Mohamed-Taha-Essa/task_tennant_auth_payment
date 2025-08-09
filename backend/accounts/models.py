from django.db import models
from django.utils import timezone
from django.contrib.auth.models import AbstractUser , BaseUserManager , PermissionsMixin , Group, Permission
from django.contrib.auth.hashers import make_password
from django.utils.translation import gettext_lazy as _
'''
    - user (fn,ln,email,password,username) + auth views + permissions + groups --> admin
    - add extra field : extend user:
        - one-to-one  (user :one-to-one:  profile)
        - abstractuser fields  ---> permissions , groups , auth views --> admin 
        - abstractbaseuser --> low level --> hard code 
'''


class CustomUserManager(BaseUserManager):
    ''' used to create user : password , create superuser '''
    
    def create_user(self,email,password=None,**extra_fields):
        if not email:
            raise ValueError('the email field is required ...')
        
        email = self.normalize_email(email)
        user = self.model(email=email,**extra_fields)
        user.set_password(password)
        user.save(using=self.db)
        return user 
        
    
    def create_superuser(self,email,password=None,**extra_fields):
        extra_fields.setdefault('is_active',True)
        extra_fields.setdefault('is_staff',True)
        extra_fields.setdefault('is_superuser',True)
        return self.create_user(email,password,**extra_fields)


class CustomUser(AbstractUser):
    username = None
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    email = models.EmailField(_('email address'), unique=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)
    image = models.ImageField(upload_to='accounts/',null=True,blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    groups = models.ManyToManyField(
        Group,
        related_name="customuser_groups",  # Avoid clash with default User.groups
        blank=True,
        verbose_name="groups",
    )
    user_permissions = models.ManyToManyField(
        Permission,
        related_name="customuser_permissions",  # Avoid clash with default User.user_permissions
        blank=True,
        verbose_name="user permissions",
    )
    USERNAME_FIELD = 'email'   # login with email 
    REQUIRED_FIELDS = []
    
    objects = CustomUserManager()
    
    def __str__(self):
        return self.email
    