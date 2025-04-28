import os
import logging
import json
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.cluster import KMeans
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, classification_report, confusion_matrix
from openai import OpenAI
from datetime import datetime
import base64
from io import BytesIO

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Initialize OpenAI client
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
openai_client = OpenAI(api_key=OPENAI_API_KEY)

class DataAnalysisTool:
    """A tool for analyzing data and generating insights with AI assistance."""
    
    def __init__(self):
        self.data = None
        self.original_data = None
        self.analysis_results = {}
        self.data_summary = None
        self.plot_paths = []
        
    def load_data(self, file_path=None, dataframe=None):
        """
        Load data from file or pandas DataFrame.
        
        Args:
            file_path (str, optional): Path to csv, excel, or json file
            dataframe (DataFrame, optional): Pandas DataFrame
            
        Returns:
            dict: Data summary
        """
        try:
            if dataframe is not None:
                self.data = dataframe.copy()
            elif file_path:
                file_extension = os.path.splitext(file_path)[1].lower()
                
                if file_extension == '.csv':
                    self.data = pd.read_csv(file_path)
                elif file_extension in ['.xls', '.xlsx']:
                    self.data = pd.read_excel(file_path)
                elif file_extension == '.json':
                    self.data = pd.read_json(file_path)
                else:
                    raise ValueError(f"Unsupported file format: {file_extension}")
            else:
                raise ValueError("Either file_path or dataframe must be provided")
            
            # Store original data
            self.original_data = self.data.copy()
            
            # Generate data summary
            self.data_summary = self._generate_data_summary()
            return self.data_summary
            
        except Exception as e:
            logger.error(f"Error loading data: {str(e)}")
            raise
            
    def _generate_data_summary(self):
        """Generate a summary of the dataset."""
        if self.data is None:
            return None
            
        try:
            # Basic info
            n_rows, n_cols = self.data.shape
            data_types = self.data.dtypes.value_counts().to_dict()
            data_types = {str(k): v for k, v in data_types.items()}
            
            # Missing values
            missing_values = self.data.isnull().sum().sum()
            missing_percentage = (missing_values / (n_rows * n_cols)) * 100
            
            # Column types
            numeric_cols = self.data.select_dtypes(include=['number']).columns.tolist()
            categorical_cols = self.data.select_dtypes(include=['object', 'category']).columns.tolist()
            datetime_cols = self.data.select_dtypes(include=['datetime']).columns.tolist()
            
            # Generate numeric summary if numeric columns exist
            numeric_summary = None
            if numeric_cols:
                numeric_summary = self.data[numeric_cols].describe().to_dict()
                
            # Generate categorical summary if categorical columns exist
            categorical_summary = {}
            for col in categorical_cols:
                if len(self.data[col].unique()) <= 20:  # Only for columns with reasonable number of categories
                    categorical_summary[col] = self.data[col].value_counts().head(10).to_dict()
            
            summary = {
                "n_rows": n_rows,
                "n_cols": n_cols,
                "data_types": data_types,
                "missing_values": {
                    "count": int(missing_values),
                    "percentage": float(missing_percentage)
                },
                "columns": {
                    "numeric": numeric_cols,
                    "categorical": categorical_cols,
                    "datetime": datetime_cols
                },
                "numeric_summary": numeric_summary,
                "categorical_summary": categorical_summary
            }
            
            return summary
            
        except Exception as e:
            logger.error(f"Error generating data summary: {str(e)}")
            return None
            
    def analyze_data(self):
        """
        Perform comprehensive data analysis.
        
        Returns:
            dict: Analysis results
        """
        if self.data is None:
            raise ValueError("No data loaded. Please load data first.")
            
        try:
            # Statistical analysis
            self.analysis_results["correlation"] = self._analyze_correlations()
            self.analysis_results["outliers"] = self._detect_outliers()
            
            # Advanced analytics
            self.analysis_results["clusters"] = self._perform_clustering()
            self.analysis_results["important_features"] = self._identify_important_features()
            
            # Generate visualizations
            self.plot_paths = self._generate_visualizations()
            
            return self.analysis_results
            
        except Exception as e:
            logger.error(f"Error in data analysis: {str(e)}")
            raise
            
    def _analyze_correlations(self):
        """Analyze correlations between numeric variables."""
        numeric_data = self.data.select_dtypes(include=['number'])
        
        if numeric_data.empty:
            return {"message": "No numeric columns to analyze correlations"}
            
        # Calculate correlation matrix
        corr_matrix = numeric_data.corr().round(2)
        
        # Find strong correlations (abs > 0.7) excluding self-correlations
        strong_correlations = []
        for i, col1 in enumerate(corr_matrix.columns):
            for j, col2 in enumerate(corr_matrix.columns):
                if i < j:  # Only look at unique pairs
                    corr_value = corr_matrix.iloc[i, j]
                    if abs(corr_value) > 0.7:
                        strong_correlations.append({
                            "variables": [col1, col2],
                            "correlation": float(corr_value),
                            "interpretation": "strong positive" if corr_value > 0 else "strong negative"
                        })
                        
        return {
            "correlation_matrix": corr_matrix.to_dict(),
            "strong_correlations": strong_correlations
        }
        
    def _detect_outliers(self):
        """Detect outliers in numeric columns using IQR method."""
        numeric_data = self.data.select_dtypes(include=['number'])
        
        if numeric_data.empty:
            return {"message": "No numeric columns to detect outliers"}
            
        outliers_summary = {}
        
        for column in numeric_data.columns:
            # Calculate IQR
            Q1 = numeric_data[column].quantile(0.25)
            Q3 = numeric_data[column].quantile(0.75)
            IQR = Q3 - Q1
            
            # Define outlier boundaries
            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR
            
            # Find outliers
            outliers = numeric_data[(numeric_data[column] < lower_bound) | 
                                   (numeric_data[column] > upper_bound)][column]
            
            if not outliers.empty:
                outliers_summary[column] = {
                    "count": len(outliers),
                    "percentage": round((len(outliers) / len(numeric_data)) * 100, 2),
                    "bounds": {
                        "lower": float(lower_bound),
                        "upper": float(upper_bound)
                    },
                    "examples": outliers.head(5).tolist() if len(outliers) > 0 else []
                }
                
        return outliers_summary
        
    def _perform_clustering(self):
        """Perform K-means clustering on the numeric data."""
        numeric_data = self.data.select_dtypes(include=['number'])
        
        if numeric_data.empty or numeric_data.shape[1] < 2:
            return {"message": "Insufficient numeric columns for clustering"}
            
        # Handle missing values for clustering
        numeric_data_clean = numeric_data.fillna(numeric_data.mean())
        
        # Standardize data
        scaler = StandardScaler()
        scaled_data = scaler.fit_transform(numeric_data_clean)
        
        # Determine optimal number of clusters using silhouette score
        from sklearn.metrics import silhouette_score
        
        scores = []
        max_clusters = min(10, len(numeric_data) // 10)  # Limit based on data size
        max_clusters = max(2, max_clusters)  # Ensure at least 2 clusters
        
        for k in range(2, max_clusters + 1):
            kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
            labels = kmeans.fit_predict(scaled_data)
            score = silhouette_score(scaled_data, labels)
            scores.append((k, score))
            
        best_k = max(scores, key=lambda x: x[1])[0]
        
        # Perform clustering with optimal k
        kmeans = KMeans(n_clusters=best_k, random_state=42, n_init=10)
        clusters = kmeans.fit_predict(scaled_data)
        
        # Add cluster labels to dataframe
        self.data['cluster'] = clusters
        
        # Analyze clusters
        cluster_analysis = {}
        for cluster_id in range(best_k):
            cluster_data = self.data[self.data['cluster'] == cluster_id]
            cluster_analysis[f"cluster_{cluster_id}"] = {
                "size": len(cluster_data),
                "percentage": round((len(cluster_data) / len(self.data)) * 100, 2),
                "summary": {}
            }
            
            # Summarize numeric features by cluster
            for col in numeric_data.columns:
                cluster_analysis[f"cluster_{cluster_id}"]["summary"][col] = {
                    "mean": float(cluster_data[col].mean()),
                    "median": float(cluster_data[col].median()),
                    "std": float(cluster_data[col].std())
                }
                
        # Remove the temporary cluster column
        self.data.drop('cluster', axis=1, inplace=True)
        
        return {
            "optimal_clusters": best_k,
            "silhouette_scores": dict(scores),
            "cluster_analysis": cluster_analysis
        }
        
    def _identify_important_features(self):
        """Identify important features using Random Forest."""
        numeric_data = self.data.select_dtypes(include=['number'])
        
        if numeric_data.shape[1] < 2:
            return {"message": "Insufficient numeric columns for feature importance analysis"}
            
        # For each numeric column, treat it as target and find feature importance
        feature_importance = {}
        
        for target_col in numeric_data.columns:
            # Skip if too many missing values
            if numeric_data[target_col].isnull().sum() / len(numeric_data) > 0.2:
                continue
                
            # Prepare features and target
            features = numeric_data.drop(target_col, axis=1)
            target = numeric_data[target_col]
            
            # Skip if all remaining columns have missing values
            if features.isnull().all(axis=0).all():
                continue
                
            # Fill missing values for this analysis
            features = features.fillna(features.mean())
            target = target.fillna(target.mean())
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                features, target, test_size=0.3, random_state=42
            )
            
            # Train random forest
            rf = RandomForestRegressor(n_estimators=100, random_state=42)
            rf.fit(X_train, y_train)
            
            # Calculate feature importance
            importance = rf.feature_importances_
            
            # Create results
            feature_importance[target_col] = {
                "features": [
                    {"feature": col, "importance": float(imp)}
                    for col, imp in zip(features.columns, importance)
                ],
                "model_score": float(rf.score(X_test, y_test))
            }
            
            # Sort features by importance
            feature_importance[target_col]["features"].sort(
                key=lambda x: x["importance"], reverse=True
            )
            
        return feature_importance
        
    def _generate_visualizations(self):
        """Generate data visualizations."""
        if self.data is None:
            return []
            
        plot_data = []
        
        try:
            # Set style
            sns.set(style="whitegrid")
            plt.rcParams.update({'font.size': 10})
            plt.rcParams["figure.figsize"] = (10, 6)
            
            # 1. Distribution of numeric variables
            numeric_data = self.data.select_dtypes(include=['number'])
            if not numeric_data.empty:
                for col in numeric_data.columns[:5]:  # Limit to first 5 columns
                    plt.figure()
                    sns.histplot(numeric_data[col].dropna(), kde=True)
                    plt.title(f'Distribution of {col}')
                    plt.tight_layout()
                    
                    # Save to memory
                    buf = BytesIO()
                    plt.savefig(buf, format='png', dpi=100)
                    plt.close()
                    
                    # Convert to base64
                    buf.seek(0)
                    img_str = base64.b64encode(buf.read()).decode('utf-8')
                    
                    plot_data.append({
                        "title": f"Distribution of {col}",
                        "type": "histogram",
                        "image_data": img_str
                    })
                    
            # 2. Correlation heatmap
            if len(numeric_data.columns) > 1:
                plt.figure()
                corr = numeric_data.corr()
                mask = np.triu(np.ones_like(corr, dtype=bool))
                sns.heatmap(corr, mask=mask, annot=True, cmap='coolwarm', linewidths=0.5, fmt='.2f')
                plt.title('Correlation Heatmap')
                plt.tight_layout()
                
                # Save to memory
                buf = BytesIO()
                plt.savefig(buf, format='png', dpi=100)
                plt.close()
                
                # Convert to base64
                buf.seek(0)
                img_str = base64.b64encode(buf.read()).decode('utf-8')
                
                plot_data.append({
                    "title": "Correlation Heatmap",
                    "type": "heatmap",
                    "image_data": img_str
                })
                
            # 3. Scatter plot for top correlated pairs
            if len(numeric_data.columns) > 1:
                # Find top correlated pairs
                corr = numeric_data.corr().abs().unstack()
                corr = corr[corr < 1].sort_values(ascending=False)
                
                if not corr.empty:
                    top_pair = corr.index[0]
                    col1, col2 = top_pair
                    
                    plt.figure()
                    sns.regplot(x=self.data[col1], y=self.data[col2], scatter_kws={'alpha':0.5})
                    plt.title(f'Relationship between {col1} and {col2}')
                    plt.tight_layout()
                    
                    # Save to memory
                    buf = BytesIO()
                    plt.savefig(buf, format='png', dpi=100)
                    plt.close()
                    
                    # Convert to base64
                    buf.seek(0)
                    img_str = base64.b64encode(buf.read()).decode('utf-8')
                    
                    plot_data.append({
                        "title": f"Relationship between {col1} and {col2}",
                        "type": "scatter",
                        "image_data": img_str
                    })
                    
            # 4. Box plots for numeric variables
            if not numeric_data.empty:
                for col in numeric_data.columns[:3]:  # Limit to first 3 columns
                    plt.figure()
                    sns.boxplot(y=numeric_data[col].dropna())
                    plt.title(f'Box Plot of {col}')
                    plt.tight_layout()
                    
                    # Save to memory
                    buf = BytesIO()
                    plt.savefig(buf, format='png', dpi=100)
                    plt.close()
                    
                    # Convert to base64
                    buf.seek(0)
                    img_str = base64.b64encode(buf.read()).decode('utf-8')
                    
                    plot_data.append({
                        "title": f"Box Plot of {col}",
                        "type": "boxplot",
                        "image_data": img_str
                    })
                    
            # 5. Bar charts for categorical variables
            categorical_data = self.data.select_dtypes(include=['object', 'category'])
            if not categorical_data.empty:
                for col in categorical_data.columns[:3]:  # Limit to first 3 columns
                    if len(self.data[col].unique()) <= 15:  # Only plot if reasonable number of categories
                        plt.figure()
                        value_counts = self.data[col].value_counts().head(10)  # Top 10 categories
                        sns.barplot(x=value_counts.index, y=value_counts.values)
                        plt.title(f'Frequency of {col}')
                        plt.xticks(rotation=45, ha='right')
                        plt.tight_layout()
                        
                        # Save to memory
                        buf = BytesIO()
                        plt.savefig(buf, format='png', dpi=100)
                        plt.close()
                        
                        # Convert to base64
                        buf.seek(0)
                        img_str = base64.b64encode(buf.read()).decode('utf-8')
                        
                        plot_data.append({
                            "title": f"Frequency of {col}",
                            "type": "bar",
                            "image_data": img_str
                        })
                        
            return plot_data
            
        except Exception as e:
            logger.error(f"Error generating visualizations: {str(e)}")
            return []
            
    def get_ai_insights(self):
        """
        Use OpenAI to generate advanced insights on the data analysis results.
        
        Returns:
            dict: AI-generated insights
        """
        if self.data is None or self.analysis_results is None:
            raise ValueError("No data or analysis results available. Run analyze_data first.")
            
        try:
            # Prepare data summary and analysis results for AI
            data_info = {
                "data_summary": self.data_summary,
                "correlation_results": self.analysis_results.get("correlation", {}),
                "outliers_detected": self.analysis_results.get("outliers", {}),
                "clustering_results": self.analysis_results.get("clusters", {}),
                "important_features": self.analysis_results.get("important_features", {})
            }
            
            data_info_str = json.dumps(data_info, indent=2)
            
            # Truncate if too large for API
            if len(data_info_str) > 15000:
                data_info_str = data_info_str[:15000] + "... [truncated]"
            
            # Use OpenAI to generate insights
            prompt = f"""You are a data science expert analyzing a dataset. Below is information about the dataset and analysis results.
            
            {data_info_str}
            
            As a data scientist, provide the following insights:
            1. Key patterns and trends in the data
            2. Unusual findings or anomalies detected
            3. Relationships between variables that stand out
            4. Business or practical implications of the analysis
            5. Suggestions for further analysis or data collection
            
            Present your analysis in detail but in a way that's understandable to non-technical stakeholders.
            Format your response as JSON with the following structure:
            {{
                "key_insights": [list of main insights],
                "patterns_and_trends": {{}},
                "unusual_findings": {{}},
                "important_relationships": {{}},
                "business_implications": {{}},
                "recommendations": {{}}
            }}
            """
            
            # the newest OpenAI model is "gpt-4o" which was released May 13, 2024.
            # do not change this unless explicitly requested by the user
            response = openai_client.chat.completions.create(
                model="gpt-4o",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                temperature=0.5,
                max_tokens=2000
            )
            
            # Parse the JSON response
            ai_insights = json.loads(response.choices[0].message.content)
            return ai_insights
            
        except Exception as e:
            logger.error(f"Error getting AI insights: {str(e)}")
            return {"error": str(e)}
            
    def generate_data_story(self, title, focus_areas=None):
        """
        Generate a cohesive data story using AI.
        
        Args:
            title (str): Title of the story
            focus_areas (list, optional): Specific aspects to focus on
            
        Returns:
            dict: AI-generated data story
        """
        if self.data is None or self.analysis_results is None:
            raise ValueError("No data or analysis results available. Run analyze_data first.")
            
        try:
            # Prepare data summary
            data_info = {
                "data_summary": self.data_summary,
                "key_findings": {
                    "correlations": self.analysis_results.get("correlation", {}).get("strong_correlations", []),
                    "outliers": self.analysis_results.get("outliers", {}),
                    "segments": self.analysis_results.get("clusters", {})
                }
            }
            
            data_info_str = json.dumps(data_info, indent=2)
            
            # Truncate if too large for API
            if len(data_info_str) > 15000:
                data_info_str = data_info_str[:15000] + "... [truncated]"
            
            # Format focus areas if provided
            focus_content = ""
            if focus_areas:
                focus_content = "Please focus particularly on: " + ", ".join(focus_areas)
            
            # Use OpenAI to generate a data story
            prompt = f"""You are a professional data storyteller with expertise in explaining data insights in an engaging way.

            Create a compelling data story from the following analysis:
            
            {data_info_str}
            
            Title: {title}
            {focus_content}
            
            Structure your story with:
            1. An executive summary of key findings
            2. Background and context for the data
            3. The main narrative with 3-5 key insights
            4. Business implications and actionable recommendations
            5. Suggested next steps for further analysis
            
            Use a conversational, engaging tone that would work well for a presentation to stakeholders.
            Format your response as JSON with the following structure:
            {{
                "executive_summary": "",
                "background": "",
                "main_narrative": [
                    {{"title": "", "insight": "", "explanation": ""}},
                    ...
                ],
                "business_implications": {{"key_points": [], "details": ""}},
                "recommended_actions": [],
                "next_steps": []
            }}
            """
            
            # the newest OpenAI model is "gpt-4o" which was released May 13, 2024.
            # do not change this unless explicitly requested by the user
            response = openai_client.chat.completions.create(
                model="gpt-4o",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                temperature=0.7,
                max_tokens=2000
            )
            
            # Parse the JSON response
            data_story = json.loads(response.choices[0].message.content)
            return data_story
            
        except Exception as e:
            logger.error(f"Error generating data story: {str(e)}")
            return {"error": str(e)}
            
    def analyze_image_data(self, image_data):
        """
        Analyze data visualized in an image using OpenAI's vision capabilities.
        
        Args:
            image_data (str): Base64 encoded image string
            
        Returns:
            dict: AI analysis of the visualization
        """
        try:
            # the newest OpenAI model is "gpt-4o" which was released May 13, 2024.
            # do not change this unless explicitly requested by the user
            response = openai_client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": "Analyze this data visualization. Explain what it shows, the key patterns or trends, and any insights that can be derived from it. Include any anomalies or interesting points."
                            },
                            {
                                "type": "image_url",
                                "image_url": {"url": f"data:image/png;base64,{image_data}"}
                            }
                        ]
                    }
                ],
                max_tokens=1000
            )
            
            return {
                "analysis": response.choices[0].message.content
            }
            
        except Exception as e:
            logger.error(f"Error analyzing image: {str(e)}")
            return {"error": str(e)}
    
    def predict(self, target_column, features=None, test_size=0.3, include_categorical=False):
        """
        Train a prediction model on the dataset.
        
        Args:
            target_column (str): Column to predict
            features (list, optional): Specific feature columns to use
            test_size (float): Proportion of data to use for testing
            include_categorical (bool): Whether to include categorical features
            
        Returns:
            dict: Prediction results
        """
        if self.data is None:
            raise ValueError("No data loaded. Please load data first.")
            
        try:
            # Check if target exists
            if target_column not in self.data.columns:
                return {"error": f"Target column '{target_column}' not found in data"}
                
            # Prepare features
            if features is None:
                # Use all columns except target
                features = [col for col in self.data.columns if col != target_column]
            
            # Get X and y
            X = self.data[features].copy()
            y = self.data[target_column]
            
            # Handle categorical features
            if include_categorical:
                # Get categorical columns
                categorical_cols = X.select_dtypes(include=['object', 'category']).columns.tolist()
                
                # Encode categorical variables
                for col in categorical_cols:
                    # Skip if too many unique values (>10)
                    if X[col].nunique() > 10:
                        X = X.drop(col, axis=1)
                        continue
                    
                    # One-hot encode
                    dummies = pd.get_dummies(X[col], prefix=col, drop_first=True)
                    X = pd.concat([X.drop(col, axis=1), dummies], axis=1)
            else:
                # Use only numeric features
                X = X.select_dtypes(include=['number'])
            
            # Handle missing values
            X = X.fillna(X.mean())
            
            # Check if we have features after preprocessing
            if X.empty:
                return {"error": "No usable features after preprocessing"}
                
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=test_size, random_state=42
            )
            
            # Determine if classification or regression problem
            is_classification = False
            if y.dtype == 'object' or y.dtype == 'category' or y.nunique() < 10:
                is_classification = True
                
            # Train model
            if is_classification:
                model = RandomForestClassifier(n_estimators=100, random_state=42)
                model.fit(X_train, y_train)
                
                # Evaluate
                train_score = model.score(X_train, y_train)
                test_score = model.score(X_test, y_test)
                
                # Get predictions
                y_pred = model.predict(X_test)
                
                # Generate classification report
                report = classification_report(y_test, y_pred, output_dict=True)
                
                # Feature importance
                feature_importance = [
                    {"feature": col, "importance": float(imp)}
                    for col, imp in zip(X.columns, model.feature_importances_)
                ]
                feature_importance.sort(key=lambda x: x["importance"], reverse=True)
                
                return {
                    "model_type": "classification",
                    "target_column": target_column,
                    "features_used": X.columns.tolist(),
                    "performance": {
                        "train_accuracy": float(train_score),
                        "test_accuracy": float(test_score),
                        "classification_report": report
                    },
                    "feature_importance": feature_importance
                }
                
            else:
                model = RandomForestRegressor(n_estimators=100, random_state=42)
                model.fit(X_train, y_train)
                
                # Evaluate
                train_score = model.score(X_train, y_train)
                test_score = model.score(X_test, y_test)
                
                # Get predictions
                y_pred = model.predict(X_test)
                
                # Calculate RMSE
                rmse = float(np.sqrt(mean_squared_error(y_test, y_pred)))
                
                # Feature importance
                feature_importance = [
                    {"feature": col, "importance": float(imp)}
                    for col, imp in zip(X.columns, model.feature_importances_)
                ]
                feature_importance.sort(key=lambda x: x["importance"], reverse=True)
                
                return {
                    "model_type": "regression",
                    "target_column": target_column,
                    "features_used": X.columns.tolist(),
                    "performance": {
                        "train_r2": float(train_score),
                        "test_r2": float(test_score),
                        "rmse": rmse
                    },
                    "feature_importance": feature_importance
                }
                
        except Exception as e:
            logger.error(f"Error in prediction: {str(e)}")
            return {"error": str(e)}