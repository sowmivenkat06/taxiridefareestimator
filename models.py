from datetime import datetime
from database import db

class User(db.Model):
    """User model for storing user account details."""
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    ride_histories = db.relationship('RideHistory', backref='user', lazy=True)
    saved_locations = db.relationship('SavedLocation', backref='user', lazy=True)
    preferences = db.relationship('UserPreference', backref='user', uselist=False, lazy=True)
    
    def __repr__(self):
        return f'<User {self.username}>'


class RideHistory(db.Model):
    """Model for storing ride history and fare details."""
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    pickup_location = db.Column(db.String(200), nullable=False)
    dropoff_location = db.Column(db.String(200), nullable=False)
    distance = db.Column(db.Float, nullable=False)
    duration = db.Column(db.Float, nullable=False)
    taxi_type = db.Column(db.String(50), nullable=False)
    base_fare = db.Column(db.Float, nullable=False)
    distance_fare = db.Column(db.Float, nullable=False)
    time_fare = db.Column(db.Float, nullable=False)
    traffic_modifier = db.Column(db.Float, default=1.0)
    weather_modifier = db.Column(db.Float, default=1.0)
    time_modifier = db.Column(db.Float, default=1.0)
    demand_modifier = db.Column(db.Float, default=1.0)
    eco_discount = db.Column(db.Float, default=0.0)
    total_fare = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(3), default='INR')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<RideHistory #{self.id}: {self.pickup_location} to {self.dropoff_location}>'


class SavedLocation(db.Model):
    """Model for storing user's saved locations."""
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    address = db.Column(db.String(255), nullable=False)
    location_type = db.Column(db.String(20), default='other')  # home, work, other
    is_favorite = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<SavedLocation {self.name}>'


class UserPreference(db.Model):
    """Model for storing user preferences."""
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    preferred_taxi_type = db.Column(db.String(50), default='Sedan')
    preferred_currency = db.Column(db.String(3), default='INR')
    eco_friendly_preference = db.Column(db.Boolean, default=False)
    notification_preference = db.Column(db.Boolean, default=True)
    
    def __repr__(self):
        return f'<UserPreference for user_id {self.user_id}>'


class FareFactorHistory(db.Model):
    """Model for storing historical fare factors to improve predictions."""
    id = db.Column(db.Integer, primary_key=True)
    location = db.Column(db.String(100), nullable=False)
    date = db.Column(db.Date, nullable=False)
    time_of_day = db.Column(db.String(20), nullable=False)
    traffic_condition = db.Column(db.String(20), nullable=False)
    weather_condition = db.Column(db.String(20), nullable=False)
    demand_level = db.Column(db.String(20), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<FareFactorHistory {self.location} on {self.date} at {self.time_of_day}>'