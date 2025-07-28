from flask import Flask, render_template, request, jsonify
import os
import json
from datetime import datetime

app = Flask(__name__)

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/save_data", methods=["POST"])
def save_data():
    data = request.json
    if not data:
        return jsonify({"status": "fail", "message": "No data received"}), 400

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"results_{timestamp}.json"
    filepath = os.path.join(DATA_DIR, filename)

    try:
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return jsonify({"status": "success", "message": f"Data saved as {filename}"})
    except Exception as e:
        return jsonify({"status": "fail", "message": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0')