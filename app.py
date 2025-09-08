# app.py
import pickle
import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import random

app = FastAPI(title="News Recommender API", version="1.0")

# CORS configuration
origins = [
    "http://127.0.0.1:5500",
    "http://localhost:5500"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load precomputed data
with open("articles.pkl", "rb") as f:
    ds: pd.DataFrame = pickle.load(f)

with open("cosine_sim.pkl", "rb") as f:
    cosine_sim = pickle.load(f)

# Recommendation logic
def recommend_articles(idx: int, n: int = 5):
    if idx < 0 or idx >= len(ds):
        raise HTTPException(status_code=404, detail="Article ID not found")
    similarity_scores = list(enumerate(cosine_sim[idx]))
    similarity_scores = sorted(similarity_scores, key=lambda x: x[1], reverse=True)[1 : n + 1]
    return [
        {
            "id": int(ds["id"].iloc[i]),
            "title": ds["title"].iloc[i],
            "date": ds["date"].iloc[i],
            "link": ds["link"].iloc[i],
            "score": round(float(score), 3),
        }
        for i, score in similarity_scores
    ]

# API endpoints
@app.get("/articles")
def get_articles():
    return ds[["id", "title"]].to_dict(orient="records")

@app.get("/recommend/{article_id}")
def get_recommendations(article_id: int, num_recs: int = Query(5, ge=1, le=20)):
    return recommend_articles(article_id, num_recs)

@app.get("/featured")
def get_featured(num_articles: int = Query(5, ge=1, le=20)):
    featured_articles = ds.sample(num_articles, random_state=random.randint(0, 1000))
    return featured_articles[["id", "title", "date", "link"]].to_dict(orient="records")
