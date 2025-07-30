from flask import Flask, render_template
import os

app = Flask(__name__)

@app.route('/')
def stroop_test():
    return render_template('index.html')

if __name__ == '__main__':
    # 监听 0.0.0.0 以允许局域网访问
    # Zeabur 等部署平台会自动忽略这一部分，所以不会影响云端部署
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port, debug=True)