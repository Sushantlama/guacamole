import pandas as pd
import re
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import RegexpTokenizer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import pickle

nltk.download("stopwords")

# Load and clean data
data = pd.read_csv("result_final.csv").drop_duplicates()
data.insert(0, "id", range(data.shape[0]))
ds = data[["date", "title", "text", "link"]].dropna().drop_duplicates()
ds.insert(0, "id", range(ds.shape[0]))

# Text preprocessing
stop_words = set(stopwords.words("english"))
tokenizer = RegexpTokenizer(r"\w+")

def preprocess(text: str) -> str:
    text = text.lower()
    text = " ".join([w for w in text.split() if w.isalpha() and w not in stop_words])
    text = " ".join(tokenizer.tokenize(text))
    text = re.sub(r"<.*?>", "", text)
    return text

ds["cleaned_desc"] = ds["text"].astype(str).apply(preprocess)

# TF-IDF and cosine similarity
tfidf = TfidfVectorizer(analyzer="word", stop_words="english", max_df=0.8, min_df=2, ngram_range=(1, 3))
tfidf_matrix = tfidf.fit_transform(ds["cleaned_desc"])
cosine_sim = cosine_similarity(tfidf_matrix, tfidf_matrix)

# Save precomputed objects
with open("articles.pkl", "wb") as f:
    pickle.dump(ds, f)

with open("tfidf.pkl", "wb") as f:
    pickle.dump(tfidf, f)

with open("cosine_sim.pkl", "wb") as f:
    pickle.dump(cosine_sim, f)

print("Precomputation complete. Saved: articles.pkl, tfidf.pkl, cosine_sim.pkl")
