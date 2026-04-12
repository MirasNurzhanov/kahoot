from django.urls import path
from . import views

app_name = "kahoot"
urlpatterns = [
    path("" , views.index , name="index"),
    path("api/check_answer/" , views.check_answer , name="check_answer"),
    path("login/" , views.login_view , name="login_view"),
    path("logout/" , views.logout_view, name="logout_view"),
    path("register/" , views.register , name="register"),
    path("dashboard/" , views.dashboard , name="dashboard"),
    path("api/start_quiz/", views.start_quiz , name="start_quiz"),
    path("save_score/", views.save_score , name="save_score"),
    path("profile/" , views.profile_page , name="profile_page")
]