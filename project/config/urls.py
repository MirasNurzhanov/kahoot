from django.contrib import admin
from django.urls import path, include
from users import views as views_register
from users.views import login_view

urlpatterns = [
    path('admin/', admin.site.urls),
    path('register/', views_register.register, name='register-form'),
    path('login/', login_view, name='login-form'),
    path('', include("blog.urls")),
]

