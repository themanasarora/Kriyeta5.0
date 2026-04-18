import os
from pymongo import MongoClient

def get_db():
    client = MongoClient(os.getenv("MONGO_URI", "mongodb://localhost:27017/"))
    db = client.get_database("kriyeta")
    return db
