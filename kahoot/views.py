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

def check_answer(request):
    if request.method != "POST":
        return JsonResponse({"error": "Invalid request method"}, status=400)

    data = json.loads(request.body)
    answer_id = data.get("answer_id")

    answer = get_object_or_404(Answer, id=answer_id)

    if not answer.is_correct:
        return JsonResponse({
            "message": "Incorrect answer..",
            "correct": False,
            "points": 0
        })
    else:
        return JsonResponse({
            "message": "The answer is correct!",
            "correct": True,
            "points": 1
        })
    
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

def start_quiz(request):
    data = json.loads(request.body)
    category_id = data.get("category_id")

    questions = Question.objects.filter(category_id=category_id)

    result = []

    for q in questions:
          result.append({
            "id": q.id,
            "text": q.text,
            "answers": [
                {"id": a.id, "text": a.text}
                for a in q.answers.all()
            ]
        })

    return JsonResponse({
          "questions": result,
          "category_id": category_id
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

def profile_page(request):
    user = request.user
    scores = Score.objects.filter(user=user)
    return render(request, "kahoot/profile.html" , {
            "user": user,
            "scores": scores
        })

def leaderboard_page(request):
    categories = Category.objects.all()

    data = []
    for category in categories:
        top_scores = category.scores.order_by('-score')[:10]

        data.append({
            "category": category,
            "scores": top_scores
        })
    return render(request, "kahoot/leaderboard.html" , {
        "data": data
    })