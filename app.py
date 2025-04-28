import os
import logging
from datetime import datetime
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from api.fare_calculator import calculate_fare, predict_fare
from api.external_apis import get_traffic_conditions, get_weather_conditions, get_exchange_rate
from api.helpers import calculate_eco_score, calculate_co2_emissions, get_eco_suggestions

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev-secret-key")
CORS(app)

# Configure SQLAlchemy
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}

# Initialize database
db = SQLAlchemy(app)

# Tamil Nadu taxi locations
tamil_nadu_locations = [
    "Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", 
    "Salem", "Tirunelveli", "Vellore", "Thoothukudi", 
    "Erode", "Dindigul", "Thanjavur", "Ranipet"
]

@app.route('/')
def index():
    """Render the main page of the application."""
    return render_template('index.html', locations=tamil_nadu_locations)

@app.route('/about')
def about():
    """Render the about page."""
    return render_template('about.html')

@app.route('/fare-calculator')
def fare_calculator():
    """Render the detailed fare calculator page."""
    return render_template('fare_calculator.html', locations=tamil_nadu_locations)

@app.route('/eco-friendly')
def eco_friendly():
    """Render the eco-friendly options page."""
    return render_template('eco_friendly.html')

@app.route('/contact')
def contact():
    """Render the contact page."""
    return render_template('contact.html')

@app.route('/how-it-works')
def how_it_works():
    """Render the how it works page explaining fare calculation."""
    return render_template('how_it_works.html')

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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
