from django.shortcuts import render
from .models import Answer, Question, Category, Score
from django.shortcuts import get_object_or_404
from django.http import JsonResponse, HttpResponseRedirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
import json
 
 
def index(request):
    if not request.user.is_authenticated:
        return HttpResponseRedirect("/kahoot/login/")
    return render(request, "kahoot/index.html")
 
 
def check_answer(request):
    if request.method != "POST":
        return JsonResponse({"error": "Invalid request method"}, status=400)
 
    data = json.loads(request.body)
    answer_id = data.get("answer_id")
 
    answer = get_object_or_404(Answer, id=answer_id)
 
    if answer.is_correct:
        return JsonResponse({
            "correct": True,
            "points": 1
        })
    else:
        # Find the correct answer for this question
        correct_answer = Answer.objects.filter(
            question=answer.question,
            is_correct=True
        ).first()
        return JsonResponse({
            "correct": False,
            "correct_id": correct_answer.id if correct_answer else None,
            "points": 0
        })
 
 
def register(request):
    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")
 
        if User.objects.filter(username=username).exists():
            return JsonResponse({"success": False, "message": "Username already taken."})
 
        user = User.objects.create_user(username=username, password=password)
        login(request, user)
        return JsonResponse({"success": True})
 
    return render(request, "kahoot/register.html")
 
 
def login_view(request):
    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")
 
        user = authenticate(request, username=username, password=password)
 
        if user is not None:
            login(request, user)
            return JsonResponse({"success": True})
        else:
            return JsonResponse({"success": False, "message": "Invalid username or password."})
 
    return render(request, "kahoot/login.html")
 
 
def logout_view(request):
    logout(request)
    return HttpResponseRedirect("/kahoot/")
 
 
def dashboard(request):
    categories = Category.objects.all()
    return render(request, "kahoot/dashboard.html", {
        "user": request.user,
        "categories": categories
    })
 
 
def start_quiz(request):
    # Frontend sends GET request with ?category_id= in the URL
    category_id = request.GET.get("category_id")
 
    if not category_id:
        return JsonResponse({"error": "Missing category_id"}, status=400)
 
    questions = Question.objects.filter(category_id=category_id)
 
    result = []
    for q in questions:
        result.append({
            "id": q.id,
            "question": q.text,   # frontend expects "question" key
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
        category_id = data.get("category_id")  # frontend sends "category_id"
 
        if score_value is None or category_id is None:
            return JsonResponse({"error": "Missing data"}, status=400)
 
        category = Category.objects.get(id=category_id)
 
        Score.objects.create(
            user=user,
            category=category,
            score=score_value
        )
 
        return JsonResponse({"message": "Score saved successfully"})
 
    return JsonResponse({"error": "Invalid request method"}, status=400)
 
 
def profile_page(request):
    user = request.user
    scores = Score.objects.filter(user=user)
    return render(request, "kahoot/profile.html", {
        "user": user,
        "scores": scores
    })
 
 
def leaderboard_page(request):
    # Template expects a flat "leaderboard" list of score objects
    leaderboard = Score.objects.select_related("user", "category").order_by("-score")[:20]
    return render(request, "kahoot/leaderboard.html", {
        "leaderboard": leaderboard
    })