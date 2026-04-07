from django.shortcuts import render
from .models import Answer , Question , Category , Score
from django.shortcuts import get_object_or_404
from django.http import JsonResponse  , HttpResponseRedirect
from django.contrib.auth import authenticate, login , logout
from django.contrib.auth.models import User
import json

# Create your views here.
def index(request):
    if not request.user.is_authenticated:
        return HttpResponseRedirect("/kahoot/login/")
    return render(request , "kahoot/index.html")

"""def show_questions(request , category_id):
    questions = Question.objects.all()
    return render(request, "kahoot/questions.html", {
        "questions": questions
    })
"""

def check_answer(request, answer_id):
    answer = get_object_or_404(Answer , id=answer_id)
    user = request.user
    if answer.is_correct is False:
        return JsonResponse({"message": "Incorrect answer.." ,"correct": False})
    else:
        return JsonResponse({"message": "The answer is correct!" , "points": 1 , "correct": True})
    
def register(request):
    if request.method == "POST":
        data = json.loads(request.body)
        if data:
            username = data["username"]
            password = data["password"]
            if not username or not password:
                return JsonResponse({"message": "Missing data.."})
            user = User.objects.create_user(username=username , password=password)
            login(request, user)
            return JsonResponse({
                "redirect": "/kahoot/show_questions/"
            })
        else:
            return JsonResponse({"message": "Couldn't load data.."})
    return render(request, "kahoot/register.html")

def login_view(request):
    if request.method == "POST":
        data = json.loads(request.body)
        if data:
            username = data["username"]
            password = data["password"]
            user = authenticate(request, username=username, password=password)
            if user:
                login(request, user)
                return JsonResponse({
                    "message": "Success",
                    "redirect": "/kahoot/dashboard/"
                })
            else:
                return JsonResponse({"error": "Invalid credentials.."}, status=400)
        else:
            return JsonResponse({"error": "Couldn't load data.."})
    return render(request, "kahoot/login.html")

def logout_view(request):
    logout(request)
    return HttpResponseRedirect("/kahoot/")


def dashboard(request):
    categories = Category.objects.all()
    return render(request, "kahoot/dashboard.html" , {
      "user": request.user,
      "categories": categories
    })

def start_quiz(request , category_id):
    if category_id is not None:
        category = Category.objects.get(id=category_id)
        questions = Question.objects.filter(category_id=category_id)
        return render(request , "kahoot/questions.html" , {
            "questions": questions,
            "category": category
        })
        

def save_score(request):
    if request.method == "POST":
        user = request.user

        data = json.loads(request.body)

        score_value = data.get("score")
        category_id = data.get("category")

        if score_value is None or category_id is None:
            return JsonResponse({"error": "Missing data"}, status=400)

        category = Category.objects.get(id=category_id)

        Score.objects.create(
            user=user,
            category=category,
            score=score_value
        )

        return JsonResponse({"message": "Score saved successfully"})