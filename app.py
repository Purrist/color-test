from flask import Flask, render_template

app = Flask(__name__)

@app.route('/')
def stroop_test():
    return render_template('index.html')

# 这一部分对于Zeabur的自动检测很重要
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)