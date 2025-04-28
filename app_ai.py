import os
import logging
import json
import base64
import pandas as pd
from flask import Flask, request, jsonify, render_template, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename
from io import BytesIO
import matplotlib.pyplot as plt
import seaborn as sns
from data_analysis_tool import DataAnalysisTool

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "default_secret_key")
CORS(app)

# Configure upload folder
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'csv', 'xlsx', 'xls', 'json'}

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload

# Initialize data analysis tool
analyzer = DataAnalysisTool()

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    """Render the data analyst dashboard."""
    return render_template('data_analyst.html')

@app.route('/api/upload', methods=['POST'])
def upload_file():
    """Upload a data file for analysis."""
    try:
        # Check if file part exists
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'}), 400
            
        file = request.files['file']
        
        # Check if file is empty
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
            
        # Check if file is allowed
        if not allowed_file(file.filename):
            return jsonify({'error': f'File type not allowed. Must be one of {ALLOWED_EXTENSIONS}'}), 400
            
        # Secure filename and save
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Load data
        data_summary = analyzer.load_data(filepath)
        
        return jsonify({
            'message': 'File uploaded successfully',
            'filename': filename,
            'summary': data_summary
        })
        
    except Exception as e:
        logger.error(f"Error uploading file: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/sample_data', methods=['GET'])
def load_sample_data():
    """Load a sample dataset for demo purposes."""
    try:
        dataset_type = request.args.get('type', 'iris')
        
        # Load specified dataset
        if dataset_type == 'iris':
            from sklearn.datasets import load_iris
            data = load_iris()
            df = pd.DataFrame(data.data, columns=data.feature_names)
            df['target'] = data.target
            df['species'] = df['target'].map({
                0: 'setosa', 
                1: 'versicolor', 
                2: 'virginica'
            })
            
        elif dataset_type == 'boston':
            from sklearn.datasets import fetch_california_housing
            data = fetch_california_housing()
            df = pd.DataFrame(data.data, columns=data.feature_names)
            df['target'] = data.target
            
        elif dataset_type == 'wine':
            from sklearn.datasets import load_wine
            data = load_wine()
            df = pd.DataFrame(data.data, columns=data.feature_names)
            df['target'] = data.target
            
        elif dataset_type == 'diabetes':
            from sklearn.datasets import load_diabetes
            data = load_diabetes()
            df = pd.DataFrame(data.data, columns=data.feature_names)
            df['target'] = data.target
            
        else:
            return jsonify({'error': 'Unknown sample dataset type'}), 400
            
        # Load data into analyzer
        data_summary = analyzer.load_data(dataframe=df)
        
        return jsonify({
            'message': f'Loaded sample {dataset_type} dataset',
            'dataset_type': dataset_type,
            'summary': data_summary
        })
        
    except Exception as e:
        logger.error(f"Error loading sample data: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/analyze', methods=['POST'])
def analyze_data():
    """Perform comprehensive data analysis."""
    try:
        if analyzer.data is None:
            return jsonify({'error': 'No data loaded. Please upload a file first.'}), 400
            
        # Run analysis
        analysis_results = analyzer.analyze_data()
        
        return jsonify({
            'message': 'Analysis completed successfully',
            'results': analysis_results,
            'plots': analyzer.plot_paths
        })
        
    except Exception as e:
        logger.error(f"Error analyzing data: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/insights', methods=['GET'])
def get_insights():
    """Get AI-generated insights for the analyzed data."""
    try:
        if analyzer.data is None or not analyzer.analysis_results:
            return jsonify({'error': 'No data analyzed. Please analyze data first.'}), 400
            
        # Get AI insights
        insights = analyzer.get_ai_insights()
        
        return jsonify({
            'message': 'Insights generated successfully',
            'insights': insights
        })
        
    except Exception as e:
        logger.error(f"Error getting insights: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/story', methods=['POST'])
def generate_story():
    """Generate a data story from analysis results."""
    try:
        if analyzer.data is None or not analyzer.analysis_results:
            return jsonify({'error': 'No data analyzed. Please analyze data first.'}), 400
            
        # Get request parameters
        data = request.json
        title = data.get('title', 'Data Analysis Findings')
        focus_areas = data.get('focus_areas', None)
        
        # Generate story
        story = analyzer.generate_data_story(title, focus_areas)
        
        return jsonify({
            'message': 'Data story generated successfully',
            'story': story
        })
        
    except Exception as e:
        logger.error(f"Error generating story: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/predict', methods=['POST'])
def predict():
    """Train a prediction model on the dataset."""
    try:
        if analyzer.data is None:
            return jsonify({'error': 'No data loaded. Please upload a file first.'}), 400
            
        # Get request parameters
        data = request.json
        target_column = data.get('target_column')
        features = data.get('features', None)
        test_size = float(data.get('test_size', 0.3))
        include_categorical = data.get('include_categorical', False)
        
        if not target_column:
            return jsonify({'error': 'Target column must be specified'}), 400
            
        # Run prediction
        prediction_results = analyzer.predict(
            target_column=target_column,
            features=features,
            test_size=test_size,
            include_categorical=include_categorical
        )
        
        return jsonify({
            'message': 'Prediction model trained successfully',
            'results': prediction_results
        })
        
    except Exception as e:
        logger.error(f"Error in prediction: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/analyze_chart', methods=['POST'])
def analyze_chart():
    """Analyze data visualization using AI."""
    try:
        # Get image data
        data = request.json
        image_data = data.get('image_data')
        
        if not image_data:
            return jsonify({'error': 'No image data provided'}), 400
            
        # Remove data URL prefix if present
        if image_data.startswith('data:image'):
            image_data = image_data.split(',')[1]
            
        # Analyze image
        analysis = analyzer.analyze_image_data(image_data)
        
        return jsonify({
            'message': 'Chart analysis completed',
            'analysis': analysis
        })
        
    except Exception as e:
        logger.error(f"Error analyzing chart: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/columns', methods=['GET'])
def get_columns():
    """Get list of columns in the loaded dataset."""
    try:
        if analyzer.data is None:
            return jsonify({'error': 'No data loaded. Please upload a file first.'}), 400
            
        # Get column information
        columns = []
        for col in analyzer.data.columns:
            dtype = str(analyzer.data[col].dtype)
            unique_count = analyzer.data[col].nunique()
            missing_count = analyzer.data[col].isnull().sum()
            
            columns.append({
                'name': col,
                'dtype': dtype,
                'unique_count': int(unique_count),
                'missing_count': int(missing_count),
                'missing_percentage': round((missing_count / len(analyzer.data)) * 100, 2)
            })
            
        return jsonify({
            'columns': columns
        })
        
    except Exception as e:
        logger.error(f"Error getting columns: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/data', methods=['GET'])
def get_data():
    """Get a sample of the loaded dataset."""
    try:
        if analyzer.data is None:
            return jsonify({'error': 'No data loaded. Please upload a file first.'}), 400
            
        # Optional parameters
        rows = request.args.get('rows', 10, type=int)
        
        # Get sample of data
        sample = analyzer.data.head(rows).to_dict(orient='records')
        
        return jsonify({
            'data': sample,
            'total_rows': len(analyzer.data),
            'displayed_rows': min(rows, len(analyzer.data))
        })
        
    except Exception as e:
        logger.error(f"Error getting data: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)