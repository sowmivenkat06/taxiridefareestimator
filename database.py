import os
from flask_sqlalchemy import SQLAlchemy

# Initialize SQLAlchemy extension
db = SQLAlchemy()

def init_db(app):
    """Initialize the database with the app context."""
    # Use SQLite by default, can be overridden by DATABASE_URL environment variable
    default_db_url = "sqlite:///app.db"
    app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL", default_db_url)
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
        "pool_recycle": 300,
        "pool_pre_ping": True,
    }
    
    db.init_app(app)
    
    # Import models here to avoid circular imports
    from models import User, RideHistory, SavedLocation, UserPreference, FareFactorHistory
    
    with app.app_context():
        # Create all tables if they don't exist
        db.create_all()