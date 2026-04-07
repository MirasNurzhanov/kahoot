from django.contrib import admin 
from .models import Answer , Question , Category, Score
# Register your models here.

admin.site.register(Answer)
admin.site.register(Question)
admin.site.register(Category)
admin.site.register(Score)