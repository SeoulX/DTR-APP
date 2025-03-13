from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
import os

app = Flask(__name__)
CORS(app)

# Connect to MongoDB
MONGO_URI = os.getenv("MONGO_URI", "mongodb://aadinnr:secret@mongo:27017/")
client = MongoClient(MONGO_URI)
db = client["dtr_database"]
collection = db["interns"]

@app.route("/check-in", methods=["POST"])
def check_in():
    data = request.json
    intern_id = data["intern_id"]
    record = {"intern_id": intern_id, "status": "Checked In"}
    collection.update_one({"intern_id": intern_id}, {"$set": record}, upsert=True)
    return jsonify({"message": "Check-in successful"}), 200

@app.route("/attendance", methods=["GET"])
def get_attendance():
    interns = list(collection.find({}, {"_id": 0}))
    return jsonify(interns), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
