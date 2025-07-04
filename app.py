import os
import logging
from datetime import datetime
from flask import Flask, render_template, request, jsonify, redirect, url_for, session
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from api.fare_calculator import calculate_fare, predict_fare
from api.external_apis import get_traffic_conditions, get_weather_conditions, get_exchange_rate
from api.helpers import calculate_eco_score, calculate_co2_emissions, get_eco_suggestions
from database import db, init_db
from models import User

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev-secret-key")
CORS(app)

# Configure database
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL", "sqlite:///app.db")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Initialize database
init_db(app)

# Authentication decorator
def login_required(f):
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    decorated_function.__name__ = f.__name__
    return decorated_function

# Auth routes
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'GET':
        return render_template('login.html')
    
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    user = User.query.filter_by(username=username).first()
    if user and check_password_hash(user.password_hash, password):
        session['user_id'] = user.id
        return jsonify({"success": True, "message": "Login successful"})
    
    return jsonify({"error": "Invalid username or password"}), 401

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'GET':
        return render_template('register.html')
    
    data = request.json
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    
    # Check if username or email already exists
    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username already exists"}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already exists"}), 400
    
    # Create new user
    try:
        new_user = User(
            username=username,
            email=email,
            password_hash=generate_password_hash(password)
        )
        db.session.add(new_user)
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "Registration successful"
        })
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error during registration: {str(e)}")
        return jsonify({"error": "Registration failed"}), 500

@app.route('/api/auth/register', methods=['POST'])
def api_register():
    return register()

@app.route('/logout')
def logout():
    session.pop('user_id', None)
    return redirect(url_for('login'))

@app.route('/api/auth/login', methods=['POST'])
def api_login():
    return login()

# Protected routes
@app.route('/')
@login_required
def index():
    """Render the main page of the application."""
    return render_template('index.html')

@app.route('/about')
@login_required
def about():
    """Render the about page."""
    return render_template('about.html')

@app.route('/fare-calculator')
@login_required
def fare_calculator():
    """Render the fare calculator page with map integration."""
    return render_template('fare_calculator.html', 
                         google_maps_api_key=os.environ.get('GOOGLE_MAPS_API_KEY', 'AIzaSyB9TNvq9d_Yfa1yaWeU_RVVhHrmIERGtWo'))

@app.route('/eco-friendly')
@login_required
def eco_friendly():
    """Render the eco-friendly options page."""
    return render_template('eco_friendly.html')

@app.route('/how-it-works')
@login_required
def how_it_works():
    """Render the how it works page explaining fare calculation."""
    return render_template('how_it_works.html')
    
@app.route('/ride-history')
@login_required
def ride_history():
    """Render the ride history page."""
    return render_template('ride_history.html')

@app.route('/profile')
@login_required
def profile():
    user = User.query.get(session['user_id'])
    return render_template('profile.html', user=user)

@app.route('/settings')
@login_required
def settings():
    user = User.query.get(session['user_id'])
    return render_template('settings.html', user=user)

@app.route('/api/fare/estimate', methods=['POST'])
def estimate_fare():
    """API endpoint to estimate taxi fare based on various factors."""
    try:
        data = request.json
        logger.debug(f"Received fare estimation request: {data}")
        
        # Extract request parameters
        distance = float(data.get('distance', 0))
        duration = float(data.get('duration', 0))
        taxi_type = data.get('taxi_type', 'Sedan')
        location = data.get('location', 'Chennai')
        currency = data.get('currency', 'INR')
        time_of_day = data.get('time_of_day', 'day')
        
        # Get external conditions
        traffic_conditions = get_traffic_conditions(location, time_of_day)
        weather_conditions = get_weather_conditions(location)
        exchange_rate = get_exchange_rate(currency)
        
        # Calculate fare
        fare_details = calculate_fare(
            distance=distance,
            duration=duration,
            taxi_type=taxi_type,
            traffic_conditions=traffic_conditions,
            weather_conditions=weather_conditions,
            time_of_day=time_of_day,
            exchange_rate=exchange_rate,
            currency=currency
        )
        
        # Calculate eco score and CO2 emissions
        eco_score = calculate_eco_score(taxi_type, distance)
        co2_emissions = calculate_co2_emissions(taxi_type, distance)
        
        # Add eco information to response
        fare_details['eco_score'] = eco_score
        fare_details['co2_emissions'] = co2_emissions
        
        logger.debug(f"Fare estimation response: {fare_details}")
        return jsonify(fare_details)
    
    except Exception as e:
        logger.error(f"Error in fare estimation: {str(e)}")
        return jsonify({"error": str(e)}), 400

@app.route('/api/fare/predict', methods=['POST'])
def predict_fare_endpoint():
    """API endpoint to predict future fare based on time offset."""
    try:
        data = request.json
        logger.debug(f"Received fare prediction request: {data}")
        
        # Extract request parameters
        distance = float(data.get('distance', 0))
        duration = float(data.get('duration', 0))
        taxi_type = data.get('taxi_type', 'Sedan')
        location = data.get('location', 'Chennai')
        currency = data.get('currency', 'INR')
        time_of_day = data.get('time_of_day', 'day')
        time_offset = int(data.get('time_offset', 15))  # in minutes
        
        # Get predictions for different time offsets
        predictions = predict_fare(
            distance=distance,
            duration=duration,
            taxi_type=taxi_type,
            location=location,
            time_of_day=time_of_day,
            currency=currency,
            time_offset=time_offset
        )
        
        logger.debug(f"Fare prediction response: {predictions}")
        return jsonify(predictions)
    
    except Exception as e:
        logger.error(f"Error in fare prediction: {str(e)}")
        return jsonify({"error": str(e)}), 400
        
@app.route('/api/ride/save', methods=['POST'])
def save_ride_history():
    """API endpoint to save ride history."""
    try:
        from models import RideHistory
        
        data = request.json
        logger.debug(f"Received ride save request: {data}")
        
        # Create a new ride history record
        ride = RideHistory(
            pickup_location=data.get('pickup_location', 'Unknown'),
            dropoff_location=data.get('dropoff_location', 'Unknown'),
            distance=float(data.get('distance', 0)),
            duration=float(data.get('duration', 0)),
            taxi_type=data.get('taxi_type', 'Sedan'),
            base_fare=float(data.get('base_fare', 0)),
            distance_fare=float(data.get('distance_fare', 0)),
            time_fare=float(data.get('time_fare', 0)),
            traffic_modifier=float(data.get('traffic_modifier', 1.0)),
            weather_modifier=float(data.get('weather_modifier', 1.0)),
            time_modifier=float(data.get('time_modifier', 1.0)),
            demand_modifier=float(data.get('demand_modifier', 1.0)),
            eco_discount=float(data.get('eco_discount', 0.0)),
            total_fare=float(data.get('total_fare', 0)),
            currency=data.get('currency', 'INR')
        )
        
        # Save to database
        db.session.add(ride)
        db.session.commit()
        
        logger.debug(f"Saved ride history with ID: {ride.id}")
        return jsonify({
            "success": True,
            "ride_id": ride.id,
            "message": "Ride history saved successfully"
        })
    
    except Exception as e:
        logger.error(f"Error saving ride history: {str(e)}")
        db.session.rollback()
        return jsonify({"error": str(e)}), 400

@app.route('/api/ride/history', methods=['GET'])
def get_ride_history():
    """API endpoint to retrieve ride history."""
    try:
        from models import RideHistory
        
        # Get all ride history ordered by creation date (newest first)
        rides = RideHistory.query.order_by(RideHistory.created_at.desc()).limit(10).all()
        
        # Format response
        ride_history = []
        for ride in rides:
            ride_history.append({
                'id': ride.id,
                'pickup_location': ride.pickup_location,
                'dropoff_location': ride.dropoff_location,
                'distance': ride.distance,
                'duration': ride.duration,
                'taxi_type': ride.taxi_type,
                'total_fare': ride.total_fare,
                'currency': ride.currency,
                'created_at': ride.created_at.strftime('%Y-%m-%d %H:%M:%S')
            })
        
        return jsonify({
            "success": True,
            "ride_history": ride_history
        })
    
    except Exception as e:
        logger.error(f"Error retrieving ride history: {str(e)}")
        return jsonify({"error": str(e)}), 400

@app.route('/api/user/profile', methods=['POST'])
@login_required
def update_profile():
    """Update user profile information."""
    try:
        user = User.query.get(session['user_id'])
        data = request.json
        
        user.display_name = data.get('display_name', user.display_name)
        user.phone = data.get('phone', user.phone)
        user.bio = data.get('bio', user.bio)
        
        db.session.commit()
        return jsonify({"success": True, "message": "Profile updated successfully"})
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating profile: {str(e)}")
        return jsonify({"error": "Failed to update profile"}), 400

@app.route('/api/user/change-password', methods=['POST'])
@login_required
def change_password():
    """Change user password."""
    try:
        user = User.query.get(session['user_id'])
        data = request.json
        
        if not check_password_hash(user.password_hash, data['current_password']):
            return jsonify({"error": "Current password is incorrect"}), 400
        
        user.password_hash = generate_password_hash(data['new_password'])
        db.session.commit()
        
        return jsonify({"success": True, "message": "Password updated successfully"})
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error changing password: {str(e)}")
        return jsonify({"error": "Failed to change password"}), 400

@app.route('/api/user/preferences', methods=['POST'])
@login_required
def update_preferences():
    """Update user preferences."""
    try:
        user = User.query.get(session['user_id'])
        data = request.json
        
        # Get or create user preferences
        if not user.preferences:
            from models import UserPreference
            user.preferences = UserPreference()
        
        user.preferences.preferred_currency = data.get('default_currency', 'INR')
        user.preferences.preferred_taxi_type = data.get('default_taxi', 'Sedan')
        user.preferences.eco_friendly_preference = data.get('eco_friendly', False)
        
        db.session.commit()
        return jsonify({"success": True, "message": "Preferences updated successfully"})
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating preferences: {str(e)}")
        return jsonify({"error": "Failed to update preferences"}), 400

@app.route('/api/user/notifications', methods=['POST'])
@login_required
def update_notifications():
    """Update notification settings."""
    try:
        user = User.query.get(session['user_id'])
        data = request.json
        
        # Get or create user preferences
        if not user.preferences:
            from models import UserPreference
            user.preferences = UserPreference()
        
        user.preferences.notification_preference = data.get('email_notifications', True)
        user.preferences.price_alerts = data.get('price_alerts', False)
        user.preferences.promotional_emails = data.get('promotional_emails', False)
        
        db.session.commit()
        return jsonify({"success": True, "message": "Notification settings updated successfully"})
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating notification settings: {str(e)}")
        return jsonify({"error": "Failed to update notification settings"}), 400

@app.route('/api/map/init', methods=['GET'])
def init_map():
    """Initialize map with default settings."""
    return jsonify({
        'center': {
            'lat': 11.1271,  # Tamil Nadu center coordinates
            'lng': 78.6569
        },
        'zoom': 7
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
