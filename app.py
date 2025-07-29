from flask import Flask, render_template_string, send_from_directory, jsonify, request
import json
import os
from datetime import datetime

app = Flask(__name__, static_folder='assets')

DATA_FILE = 'data.json'

# 初始化数据文件
if not os.path.exists(DATA_FILE):
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump([], f, ensure_ascii=False, indent=2)

@app.route('/')
def index():
    with open('index.html', 'r', encoding='utf-8') as f:
        html_content = f.read()
    return render_template_string(html_content)

@app.route('/assets/<path:filename>')
def serve_assets(filename):
    return send_from_directory('assets', filename)

@app.route('/save', methods=['POST'])
def save_result():
    data = request.get_json()
    data['timestamp'] = datetime.now().isoformat()
    with open(DATA_FILE, 'r+', encoding='utf-8') as f:
        history = json.load(f)
        history.append(data)
        f.seek(0)
        json.dump(history, f, ensure_ascii=False, indent=2)
    return jsonify({'status': 'saved'})

if __name__ == '__main__':
    app.run(debug=True)
