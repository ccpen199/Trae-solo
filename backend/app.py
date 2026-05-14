from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')

CORS(app, resources={r"/api/*": {"origins": "*"}})

db = SQLAlchemy(app)

from routes import *

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    port = int(os.getenv('PORT', 9861))
    app.run(host='0.0.0.0', port=port, debug=True)