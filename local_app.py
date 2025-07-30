from app import app # 从我们的云端 app.py 导入 app 实例
import os

if __name__ == '__main__':
    # 监听 0.0.0.0 以允许局域网访问
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port, debug=True)