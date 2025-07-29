# app.py
from flask import Flask, render_template

# 初始化Flask应用
app = Flask(__name__)

# 创建一个路由，当用户访问根目录 ("/") 时，
# 渲染并返回 templates 文件夹中的 index.html 文件
@app.route('/')
def stroop_test():
    return render_template('index.html')

# 主程序入口
if __name__ == '__main__':
    # 启动服务器
    # host='0.0.0.0' 让服务器在局域网内可见
    # port=5500 指定端口号
    # debug=True 让我们修改代码后服务器能自动重启，方便调试
    app.run(host='0.0.0.0', port=5500, debug=True)