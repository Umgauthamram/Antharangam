from flask import Flask
from flask_cors import CORS
from config import Config
from app.services.db_service import db

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app)

    db.init_app(app)

    with app.app_context():
        from . import routes
        
    return app