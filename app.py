from flask import Flask, render_template

app = Flask(__name__)

@app.route('/')
def stroop_test():
    return render_template('index.html')