from flask import Flask
from app.config import SECRET_KEY

def create_app():
    app = Flask(__name__)
    app.config["SECRET_KEY"] = SECRET_KEY

    from app.routes import bp
    app.register_blueprint(bp)

    return app
