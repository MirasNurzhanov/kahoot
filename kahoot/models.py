from django.db import models
from django.contrib.auth.models import User

# Create your models here.
class Category(models.Model):
    name = models.CharField(max_length=200)

    def __str__(self):
        return f"{self.name}"

class Question(models.Model):
    text = models.CharField(max_length=200)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="questions")
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    
    def __str__(self):
        return f"{self.text}"
    
    
class Answer(models.Model):
    question = models.ForeignKey(Question , on_delete=models.CASCADE , related_name = "answers")
    text = models.CharField(max_length = 200)
    is_correct = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.text}"
    
class Score(models.Model):
    user = models.ForeignKey(User , on_delete=models.CASCADE , related_name = "scores")
    category = models.ForeignKey(Category , on_delete=models.CASCADE , related_name = "scores")
    score = models.IntegerField()


    def __str__(self):
        return f"{self.user}: {self.score}"
    
