// Global variables
let datasetInfo = null;
let analysisResults = null;
let columnsInfo = null;
let insightsData = null;
let storyData = null;
let modelResults = null;

// DOM Ready
document.addEventListener('DOMContentLoaded', function() {
    // Setup event listeners
    setupEventListeners();
    
    // Check for existing dataset
    fetchDatasetInfo();
});

// Setup event listeners
function setupEventListeners() {
    // Upload form
    document.getElementById('upload-btn').addEventListener('click', uploadFile);
    
    // Sample data buttons
    document.getElementById('load-sample-btn').addEventListener('click', function() {
        const sampleModal = new bootstrap.Modal(document.getElementById('sample-modal'));
        sampleModal.show();
    });
    
    document.getElementById('load-iris').addEventListener('click', function() {
        loadSampleData('iris');
    });
    
    document.getElementById('load-housing').addEventListener('click', function() {
        loadSampleData('boston');
    });
    
    document.getElementById('load-wine').addEventListener('click', function() {
        loadSampleData('wine');
    });
    
    // Sample dataset cards in modal
    document.querySelectorAll('.sample-dataset-card').forEach(card => {
        card.addEventListener('click', function() {
            const datasetType = this.getAttribute('data-dataset');
            loadSampleData(datasetType);
            const sampleModal = bootstrap.Modal.getInstance(document.getElementById('sample-modal'));
            if (sampleModal) {
                sampleModal.hide();
            }
        });
    });
    
    // Data rows select
    document.getElementById('data-rows-select').addEventListener('change', function() {
        fetchData(this.value);
    });
    
    // View columns button
    document.getElementById('view-columns-btn').addEventListener('click', function() {
        document.getElementById('data-tabs').querySelector('button[data-bs-target="#explorer"]').click();
    });
    
    // Analysis button
    document.getElementById('analyze-btn').addEventListener('click', runAnalysis);
    document.getElementById('analyze-empty-btn').addEventListener('click', runAnalysis);
    
    // Insights button
    document.getElementById('get-insights-btn').addEventListener('click', getInsights);
    document.getElementById('insights-empty-btn').addEventListener('click', getInsights);
    
    // Story buttons
    document.getElementById('generate-story-btn').addEventListener('click', function() {
        prepareFocusAreas();
        const storyModal = new bootstrap.Modal(document.getElementById('story-modal'));
        storyModal.show();
    });
    
    document.getElementById('story-empty-btn').addEventListener('click', function() {
        prepareFocusAreas();
        const storyModal = new bootstrap.Modal(document.getElementById('story-modal'));
        storyModal.show();
    });
    
    document.getElementById('generate-story-modal-btn').addEventListener('click', generateStory);
    
    // Model buttons
    document.getElementById('build-model-btn').addEventListener('click', function() {
        prepareModelForm();
        const modelModal = new bootstrap.Modal(document.getElementById('model-modal'));
        modelModal.show();
    });
    
    document.getElementById('models-empty-btn').addEventListener('click', function() {
        prepareModelForm();
        const modelModal = new bootstrap.Modal(document.getElementById('model-modal'));
        modelModal.show();
    });
    
    document.getElementById('build-model-modal-btn').addEventListener('click', buildModel);
    
    // Visualization modal events
    document.getElementById('analyze-viz-btn').addEventListener('click', analyzeVisualization);
    
    // Tab change event
    document.querySelectorAll('button[data-bs-toggle="tab"]').forEach(button => {
        button.addEventListener('click', function(event) {
            const targetTab = this.getAttribute('data-bs-target').substring(1);
            updateTabContent(targetTab);
        });
    });
}

// Upload file
function uploadFile() {
    const fileInput = document.getElementById('file-upload');
    const file = fileInput.files[0];
    
    if (!file) {
        showUploadError('Please select a file to upload');
        return;
    }
    
    // Show loading state
    const uploadBtn = document.getElementById('upload-btn');
    const uploadBtnText = document.getElementById('upload-btn-text');
    const uploadBtnLoading = document.getElementById('upload-btn-loading');
    
    uploadBtn.disabled = true;
    uploadBtnText.classList.add('d-none');
    uploadBtnLoading.classList.remove('d-none');
    
    // Hide previous messages
    document.getElementById('upload-error').classList.add('d-none');
    document.getElementById('upload-success').classList.add('d-none');
    
    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    
    // Upload file
    axios.post('/api/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    })
    .then(function(response) {
        // Show success message
        const successEl = document.getElementById('upload-success');
        successEl.textContent = response.data.message;
        successEl.classList.remove('d-none');
        
        // Update dataset info
        datasetInfo = response.data.summary;
        
        // Close modal after a short delay
        setTimeout(() => {
            const uploadModal = bootstrap.Modal.getInstance(document.getElementById('upload-modal'));
            if (uploadModal) {
                uploadModal.hide();
            }
            
            // Reset form
            document.getElementById('upload-form').reset();
            
            // Update UI
            updateDatasetInfo();
            showDataExplorer();
            fetchData();
            fetchColumns();
            
        }, 1500);
    })
    .catch(function(error) {
        // Show error message
        let errorMessage = 'Error uploading file';
        if (error.response && error.response.data && error.response.data.error) {
            errorMessage = error.response.data.error;
        }
        showUploadError(errorMessage);
    })
    .finally(function() {
        // Reset button state
        uploadBtn.disabled = false;
        uploadBtnText.classList.remove('d-none');
        uploadBtnLoading.classList.add('d-none');
    });
}

// Show upload error
function showUploadError(message) {
    const errorEl = document.getElementById('upload-error');
    errorEl.textContent = message;
    errorEl.classList.remove('d-none');
}

// Load sample dataset
function loadSampleData(datasetType) {
    // Show dataset info loading
    document.getElementById('dataset-info-empty').classList.add('d-none');
    document.getElementById('dataset-info-content').classList.add('d-none');
    document.getElementById('dataset-info-loading').classList.remove('d-none');
    
    // Hide sample error
    document.getElementById('sample-error').classList.add('d-none');
    
    // Fetch sample data
    axios.get(`/api/sample_data?type=${datasetType}`)
        .then(function(response) {
            // Update dataset info
            datasetInfo = response.data.summary;
            
            // Update UI
            updateDatasetInfo();
            showDataExplorer();
            fetchData();
            fetchColumns();
        })
        .catch(function(error) {
            // Show error message
            let errorMessage = 'Error loading sample data';
            if (error.response && error.response.data && error.response.data.error) {
                errorMessage = error.response.data.error;
            }
            
            const errorEl = document.getElementById('sample-error');
            errorEl.textContent = errorMessage;
            errorEl.classList.remove('d-none');
            
            // Hide dataset info loading
            document.getElementById('dataset-info-loading').classList.add('d-none');
            document.getElementById('dataset-info-empty').classList.remove('d-none');
        });
}

// Fetch dataset info
function fetchDatasetInfo() {
    axios.get('/api/columns')
        .then(function(response) {
            columnsInfo = response.data.columns;
            
            // If we have columns, then we have data
            if (columnsInfo && columnsInfo.length > 0) {
                // Fetch data rows to get total count
                return axios.get('/api/data');
            } else {
                throw new Error('No data loaded');
            }
        })
        .then(function(response) {
            // Create a minimal dataset info
            datasetInfo = {
                n_rows: response.data.total_rows,
                n_cols: columnsInfo.length,
                columns: {
                    numeric: columnsInfo.filter(col => col.dtype.includes('float') || col.dtype.includes('int')).map(col => col.name),
                    categorical: columnsInfo.filter(col => col.dtype.includes('object') || col.dtype.includes('category')).map(col => col.name),
                    datetime: columnsInfo.filter(col => col.dtype.includes('datetime')).map(col => col.name)
                }
            };
            
            // Update UI
            updateDatasetInfo();
            showDataExplorer();
            updateDataTable(response.data.data);
            updateColumnsTable(columnsInfo);
        })
        .catch(function(error) {
            // No data loaded, show empty state
            console.log('No data loaded:', error);
        });
}

// Update dataset info display
function updateDatasetInfo() {
    if (!datasetInfo) return;
    
    // Update dataset status badge
    const datasetStatus = document.getElementById('dataset-status');
    datasetStatus.textContent = 'Loaded';
    datasetStatus.classList.remove('bg-primary');
    datasetStatus.classList.add('bg-success');
    
    // Hide loading and empty states
    document.getElementById('dataset-info-loading').classList.add('d-none');
    document.getElementById('dataset-info-empty').classList.add('d-none');
    
    // Show content
    document.getElementById('dataset-info-content').classList.remove('d-none');
    
    // Update name (use filename or default)
    const datasetName = document.getElementById('dataset-name');
    datasetName.textContent = datasetInfo.dataset_name || 'Unnamed Dataset';
    
    // Update basic info
    document.getElementById('dataset-rows').textContent = datasetInfo.n_rows;
    document.getElementById('dataset-cols').textContent = datasetInfo.n_cols;
    
    // Calculate missing values percentage if available
    let missingPercentage = '0%';
    if (datasetInfo.missing_values && datasetInfo.missing_values.percentage !== undefined) {
        missingPercentage = datasetInfo.missing_values.percentage.toFixed(1) + '%';
    }
    document.getElementById('dataset-missing').textContent = missingPercentage;
    
    // Update column types
    const numericCount = document.getElementById('numeric-count');
    const categoricalCount = document.getElementById('categorical-count');
    const datetimeCount = document.getElementById('datetime-count');
    
    const numericBar = document.getElementById('numeric-bar');
    const categoricalBar = document.getElementById('categorical-bar');
    const datetimeBar = document.getElementById('datetime-bar');
    
    // Calculate counts and percentages
    const numericColumns = datasetInfo.columns.numeric || [];
    const categoricalColumns = datasetInfo.columns.categorical || [];
    const datetimeColumns = datasetInfo.columns.datetime || [];
    
    numericCount.textContent = numericColumns.length;
    categoricalCount.textContent = categoricalColumns.length;
    datetimeCount.textContent = datetimeColumns.length;
    
    const totalColumns = datasetInfo.n_cols;
    
    numericBar.style.width = ((numericColumns.length / totalColumns) * 100) + '%';
    categoricalBar.style.width = ((categoricalColumns.length / totalColumns) * 100) + '%';
    datetimeBar.style.width = ((datetimeColumns.length / totalColumns) * 100) + '%';
    
    // Enable action buttons
    document.getElementById('analyze-btn').disabled = false;
    document.getElementById('get-insights-btn').disabled = false;
    document.getElementById('generate-story-btn').disabled = false;
    document.getElementById('build-model-btn').disabled = false;
}

// Show data explorer
function showDataExplorer() {
    // Hide welcome message
    document.getElementById('welcome-message').classList.add('d-none');
    
    // Show data tabs
    document.getElementById('data-tabs-container').classList.remove('d-none');
}

// Fetch data rows
function fetchData(rows = 10) {
    // Show loading state
    document.getElementById('data-table-loading').classList.remove('d-none');
    
    axios.get(`/api/data?rows=${rows}`)
        .then(function(response) {
            updateDataTable(response.data.data);
        })
        .catch(function(error) {
            console.error('Error fetching data:', error);
            // Hide loading state
            document.getElementById('data-table-loading').classList.add('d-none');
        });
}

// Update data table with fetched data
function updateDataTable(data) {
    if (!data || data.length === 0) {
        return;
    }
    
    // Get columns from first row
    const columns = Object.keys(data[0]);
    
    // Create table header
    let headerHtml = '<tr><th>#</th>';
    columns.forEach(column => {
        headerHtml += `<th>${escapeHtml(column)}</th>`;
    });
    headerHtml += '</tr>';
    
    // Create table body
    let bodyHtml = '';
    data.forEach((row, index) => {
        bodyHtml += `<tr><td>${index + 1}</td>`;
        columns.forEach(column => {
            const value = row[column];
            const displayValue = value === null || value === undefined ? '' : escapeHtml(String(value));
            bodyHtml += `<td>${displayValue}</td>`;
        });
        bodyHtml += '</tr>';
    });
    
    // Update table
    const table = document.getElementById('data-table');
    table.querySelector('thead').innerHTML = headerHtml;
    table.querySelector('tbody').innerHTML = bodyHtml;
    
    // Hide loading state
    document.getElementById('data-table-loading').classList.add('d-none');
}

// Fetch columns information
function fetchColumns() {
    // Show loading state
    document.getElementById('columns-table-loading').classList.remove('d-none');
    
    axios.get('/api/columns')
        .then(function(response) {
            columnsInfo = response.data.columns;
            updateColumnsTable(columnsInfo);
        })
        .catch(function(error) {
            console.error('Error fetching columns:', error);
            // Hide loading state
            document.getElementById('columns-table-loading').classList.add('d-none');
        });
}

// Update columns table
function updateColumnsTable(columns) {
    if (!columns || columns.length === 0) {
        return;
    }
    
    // Create table body
    let bodyHtml = '';
    columns.forEach(column => {
        bodyHtml += `<tr>
            <td>${escapeHtml(column.name)}</td>
            <td>${escapeHtml(column.dtype)}</td>
            <td>${column.unique_count}</td>
            <td>${column.missing_count} (${column.missing_percentage}%)</td>
        </tr>`;
    });
    
    // Update table
    const table = document.getElementById('columns-table');
    table.querySelector('tbody').innerHTML = bodyHtml;
    
    // Hide loading state
    document.getElementById('columns-table-loading').classList.add('d-none');
}

// Run data analysis
function runAnalysis() {
    // Show loading state
    document.getElementById('analysis-empty').classList.add('d-none');
    document.getElementById('analysis-results').classList.add('d-none');
    document.getElementById('analysis-loading').classList.remove('d-none');
    
    // Switch to analysis tab
    document.getElementById('analysis-tab').click();
    
    // Run analysis
    axios.post('/api/analyze')
        .then(function(response) {
            analysisResults = response.data.results;
            
            // Update visualizations
            updateVisualizations(response.data.plots);
            
            // Update correlations
            updateCorrelations(analysisResults.correlation);
            
            // Update outliers
            updateOutliers(analysisResults.outliers);
            
            // Update clusters
            updateClusters(analysisResults.clusters);
            
            // Update feature importance
            updateFeatureImportance(analysisResults.important_features);
            
            // Show results
            document.getElementById('analysis-loading').classList.add('d-none');
            document.getElementById('analysis-results').classList.remove('d-none');
        })
        .catch(function(error) {
            console.error('Error running analysis:', error);
            
            // Hide loading state
            document.getElementById('analysis-loading').classList.add('d-none');
            
            // Show empty state with error
            document.getElementById('analysis-empty').classList.remove('d-none');
            
            // Show alert
            alert('Error running analysis. Please try again.');
        });
}

// Update visualizations
function updateVisualizations(plots) {
    const container = document.getElementById('visualizations-container');
    container.innerHTML = '';
    
    if (!plots || plots.length === 0) {
        container.innerHTML = '<div class="col-12 text-center py-4 text-muted">No visualizations generated</div>';
        return;
    }
    
    plots.forEach((plot, index) => {
        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4 mb-4';
        
        const img = document.createElement('img');
        img.src = `data:image/png;base64,${plot.image_data}`;
        img.alt = plot.title;
        img.className = 'viz-thumbnail img-fluid mb-2';
        img.setAttribute('data-index', index);
        img.setAttribute('data-title', plot.title);
        
        // Add click handler to open modal
        img.addEventListener('click', function() {
            openVisualizationModal(this);
        });
        
        const title = document.createElement('p');
        title.className = 'text-center mb-0';
        title.textContent = plot.title;
        
        col.appendChild(img);
        col.appendChild(title);
        container.appendChild(col);
    });
}

// Open visualization modal
function openVisualizationModal(imgElement) {
    const modal = document.getElementById('viz-modal');
    const modalTitle = document.getElementById('viz-modal-title');
    const modalImage = document.getElementById('viz-modal-image');
    
    modalTitle.textContent = imgElement.getAttribute('data-title');
    modalImage.src = imgElement.src;
    
    // Reset analysis
    document.getElementById('viz-analysis-content').classList.add('d-none');
    document.getElementById('viz-analysis-loading').classList.add('d-none');
    document.getElementById('analyze-viz-btn').classList.remove('d-none');
    
    // Show modal
    const vizModal = new bootstrap.Modal(modal);
    vizModal.show();
}

// Analyze visualization with AI
function analyzeVisualization() {
    const modalImage = document.getElementById('viz-modal-image');
    const imgData = modalImage.src.split(',')[1];
    
    // Show loading state
    document.getElementById('analyze-viz-btn').classList.add('d-none');
    document.getElementById('viz-analysis-loading').classList.remove('d-none');
    
    // Call API to analyze image
    axios.post('/api/analyze_chart', {
        image_data: imgData
    })
    .then(function(response) {
        // Show analysis
        const analysisText = document.getElementById('viz-analysis-text');
        analysisText.innerHTML = response.data.analysis.analysis;
        
        // Show content
        document.getElementById('viz-analysis-loading').classList.add('d-none');
        document.getElementById('viz-analysis-content').classList.remove('d-none');
    })
    .catch(function(error) {
        console.error('Error analyzing visualization:', error);
        
        // Hide loading state
        document.getElementById('viz-analysis-loading').classList.add('d-none');
        document.getElementById('analyze-viz-btn').classList.remove('d-none');
        
        // Show alert
        alert('Error analyzing visualization. Please try again.');
    });
}

// Update correlations
function updateCorrelations(correlationData) {
    const container = document.getElementById('strong-correlations');
    container.innerHTML = '';
    
    if (!correlationData || !correlationData.strong_correlations || correlationData.strong_correlations.length === 0) {
        container.innerHTML = '<div class="text-center py-4 text-muted">No strong correlations found</div>';
        return;
    }
    
    // Sort by absolute correlation value
    const sortedCorrelations = [...correlationData.strong_correlations].sort((a, b) => {
        return Math.abs(b.correlation) - Math.abs(a.correlation);
    });
    
    sortedCorrelations.forEach(correlation => {
        const card = document.createElement('div');
        card.className = 'card mb-3';
        
        const cardBody = document.createElement('div');
        cardBody.className = 'card-body';
        
        const variables = correlation.variables.join(' and ');
        const corrValue = correlation.correlation.toFixed(2);
        const isPositive = correlation.correlation > 0;
        const badgeClass = isPositive ? 'correlation-high' : 'correlation-negative';
        
        cardBody.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-2">
                <div>
                    <strong>${escapeHtml(variables)}</strong>
                    <span class="correlation-badge ${badgeClass}">
                        ${isPositive ? '+' : ''}${corrValue}
                    </span>
                </div>
            </div>
            <p class="mb-0 text-muted">
                ${escapeHtml(capitalizeFirst(correlation.interpretation))} correlation.
                ${isPositive 
                    ? 'As one variable increases, the other tends to increase as well.' 
                    : 'As one variable increases, the other tends to decrease.'}
            </p>
        `;
        
        card.appendChild(cardBody);
        container.appendChild(card);
    });
}

// Update outliers
function updateOutliers(outliersData) {
    const container = document.getElementById('outliers-summary');
    container.innerHTML = '';
    
    if (!outliersData || Object.keys(outliersData).length === 0 || outliersData.message) {
        container.innerHTML = '<div class="text-center py-4 text-muted">No significant outliers detected</div>';
        return;
    }
    
    // Create cards for each column with outliers
    Object.entries(outliersData).forEach(([column, info]) => {
        const card = document.createElement('div');
        card.className = 'card mb-3';
        
        const cardBody = document.createElement('div');
        cardBody.className = 'card-body';
        
        cardBody.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="mb-0">${escapeHtml(column)}</h5>
                <span class="badge bg-warning text-dark">${info.count} outliers (${info.percentage}%)</span>
            </div>
            <div class="row mb-2">
                <div class="col-6">
                    <small class="text-muted">Lower bound:</small>
                    <div>${info.bounds.lower.toFixed(2)}</div>
                </div>
                <div class="col-6">
                    <small class="text-muted">Upper bound:</small>
                    <div>${info.bounds.upper.toFixed(2)}</div>
                </div>
            </div>
            ${info.examples.length > 0 ? `
                <div>
                    <small class="text-muted">Example outliers:</small>
                    <div>${info.examples.map(val => val.toFixed(2)).join(', ')}</div>
                </div>
            ` : ''}
        `;
        
        card.appendChild(cardBody);
        container.appendChild(card);
    });
}

// Update clusters
function updateClusters(clustersData) {
    const container = document.getElementById('clusters-summary');
    container.innerHTML = '';
    
    if (!clustersData || clustersData.message) {
        container.innerHTML = '<div class="text-center py-4 text-muted">Clustering analysis not applicable for this dataset</div>';
        return;
    }
    
    // Create summary card
    const summaryCard = document.createElement('div');
    summaryCard.className = 'card mb-3';
    
    const summaryBody = document.createElement('div');
    summaryBody.className = 'card-body';
    
    summaryBody.innerHTML = `
        <h5 class="mb-3">Cluster Analysis Summary</h5>
        <p>Optimal number of clusters: <strong>${clustersData.optimal_clusters}</strong></p>
        <div class="mb-4">
            <h6 class="mb-2">Cluster Distribution:</h6>
            <div class="row">
                ${Object.entries(clustersData.cluster_analysis).map(([cluster, info]) => `
                    <div class="col-md-4 mb-2">
                        <div class="p-2 bg-light rounded">
                            <div class="d-flex justify-content-between mb-1">
                                <div>${escapeHtml(cluster)}</div>
                                <div><strong>${info.size}</strong> (${info.percentage}%)</div>
                            </div>
                            <div class="progress" style="height: 8px;">
                                <div class="progress-bar" style="width: ${info.percentage}%"></div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    summaryCard.appendChild(summaryBody);
    container.appendChild(summaryCard);
    
    // Create detailed cluster cards
    Object.entries(clustersData.cluster_analysis).forEach(([cluster, info]) => {
        // Skip if no summary data
        if (!info.summary || Object.keys(info.summary).length === 0) return;
        
        const card = document.createElement('div');
        card.className = 'card mb-3 border-start border-primary border-3';
        
        const cardHeader = document.createElement('div');
        cardHeader.className = 'card-header';
        cardHeader.innerHTML = `<h5 class="mb-0">${escapeHtml(cluster)}: ${info.size} records (${info.percentage}%)</h5>`;
        
        const cardBody = document.createElement('div');
        cardBody.className = 'card-body';
        
        let featuresHtml = '';
        for (const [feature, values] of Object.entries(info.summary)) {
            featuresHtml += `
                <div class="mb-3">
                    <h6>${escapeHtml(feature)}</h6>
                    <div class="row text-muted">
                        <div class="col-md-4">
                            <small>Mean: <strong>${values.mean.toFixed(2)}</strong></small>
                        </div>
                        <div class="col-md-4">
                            <small>Median: <strong>${values.median.toFixed(2)}</strong></small>
                        </div>
                        <div class="col-md-4">
                            <small>Std: <strong>${values.std.toFixed(2)}</strong></small>
                        </div>
                    </div>
                </div>
            `;
        }
        
        cardBody.innerHTML = featuresHtml;
        
        card.appendChild(cardHeader);
        card.appendChild(cardBody);
        container.appendChild(card);
    });
}

// Update feature importance
function updateFeatureImportance(featureData) {
    const container = document.getElementById('feature-importance');
    container.innerHTML = '';
    
    if (!featureData || Object.keys(featureData).length === 0 || featureData.message) {
        container.innerHTML = '<div class="text-center py-4 text-muted">Feature importance analysis not applicable for this dataset</div>';
        return;
    }
    
    // Create accordion for each target variable
    let accordionHtml = '<div class="accordion" id="feature-importance-accordion">';
    
    Object.entries(featureData).forEach(([target, data], index) => {
        // Skip if no features
        if (!data.features || data.features.length === 0) return;
        
        // Sort features by importance
        const sortedFeatures = [...data.features].sort((a, b) => b.importance - a.importance);
        
        // Get max importance for scaling
        const maxImportance = sortedFeatures[0].importance;
        
        accordionHtml += `
            <div class="accordion-item">
                <h2 class="accordion-header">
                    <button class="accordion-button ${index !== 0 ? 'collapsed' : ''}" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${index}">
                        <strong>Predicting ${escapeHtml(target)}</strong>
                        <span class="badge bg-primary ms-2">R² = ${data.model_score.toFixed(3)}</span>
                    </button>
                </h2>
                <div id="collapse-${index}" class="accordion-collapse collapse ${index === 0 ? 'show' : ''}" data-bs-parent="#feature-importance-accordion">
                    <div class="accordion-body">
                        <div class="mb-3">
                            <small class="text-muted">Model Score (R²): <strong>${data.model_score.toFixed(3)}</strong></small>
                        </div>
                        <p class="mb-3">Features ranked by importance:</p>
                        <div class="feature-importance-list">
                            ${sortedFeatures.map(feature => `
                                <div class="mb-3">
                                    <div class="d-flex justify-content-between mb-1">
                                        <div>${escapeHtml(feature.feature)}</div>
                                        <div><strong>${(feature.importance * 100).toFixed(1)}%</strong></div>
                                    </div>
                                    <div class="feature-importance-bar">
                                        <div class="feature-importance-fill" style="width: ${(feature.importance / maxImportance) * 100}%"></div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    accordionHtml += '</div>';
    
    container.innerHTML = accordionHtml;
}

// Get AI insights
function getInsights() {
    // Check if analysis was run
    if (!analysisResults) {
        alert('Please run data analysis first before getting AI insights.');
        return;
    }
    
    // Show loading state
    document.getElementById('insights-empty').classList.add('d-none');
    document.getElementById('insights-results').classList.add('d-none');
    document.getElementById('insights-loading').classList.remove('d-none');
    
    // Switch to insights tab
    document.getElementById('insights-tab').click();
    
    // Get insights
    axios.get('/api/insights')
        .then(function(response) {
            insightsData = response.data.insights;
            
            // Update insights display
            updateInsightsDisplay(insightsData);
            
            // Show results
            document.getElementById('insights-loading').classList.add('d-none');
            document.getElementById('insights-results').classList.remove('d-none');
        })
        .catch(function(error) {
            console.error('Error getting insights:', error);
            
            // Hide loading state
            document.getElementById('insights-loading').classList.add('d-none');
            
            // Show empty state with error
            document.getElementById('insights-empty').classList.remove('d-none');
            
            // Show alert
            alert('Error getting AI insights. Please try again.');
        });
}

// Update insights display
function updateInsightsDisplay(insights) {
    // Update key insights list
    const keyInsightsList = document.getElementById('key-insights-list');
    keyInsightsList.innerHTML = '';
    
    if (insights.key_insights && insights.key_insights.length > 0) {
        insights.key_insights.forEach(insight => {
            const li = document.createElement('li');
            li.className = 'list-group-item';
            li.innerHTML = `<i class="fas fa-lightbulb text-warning me-2"></i>${escapeHtml(insight)}`;
            keyInsightsList.appendChild(li);
        });
    } else {
        keyInsightsList.innerHTML = '<li class="list-group-item text-center text-muted">No key insights provided</li>';
    }
    
    // Update patterns and trends
    const patternsContent = document.getElementById('patterns-content');
    patternsContent.innerHTML = insights.patterns_and_trends ? 
        formatMarkdown(insights.patterns_and_trends) : 
        '<p class="text-center text-muted">No patterns or trends identified</p>';
    
    // Update unusual findings
    const unusualFindingsContent = document.getElementById('unusual-findings-content');
    unusualFindingsContent.innerHTML = insights.unusual_findings ? 
        formatMarkdown(insights.unusual_findings) : 
        '<p class="text-center text-muted">No unusual findings identified</p>';
    
    // Update important relationships
    const relationshipsContent = document.getElementById('relationships-content');
    relationshipsContent.innerHTML = insights.important_relationships ? 
        formatMarkdown(insights.important_relationships) : 
        '<p class="text-center text-muted">No significant relationships identified</p>';
    
    // Update business implications
    const implicationsContent = document.getElementById('implications-content');
    implicationsContent.innerHTML = insights.business_implications ? 
        formatMarkdown(insights.business_implications) : 
        '<p class="text-center text-muted">No business implications provided</p>';
    
    // Update recommendations
    const recommendationsContent = document.getElementById('recommendations-content');
    recommendationsContent.innerHTML = insights.recommendations ? 
        formatMarkdown(insights.recommendations) : 
        '<p class="text-center text-muted">No recommendations provided</p>';
}

// Prepare focus areas for story generation
function prepareFocusAreas() {
    const container = document.getElementById('focus-areas-container');
    container.innerHTML = '';
    
    // Only show focus areas if we have analysis results
    if (!analysisResults) return;
    
    // Add options for strong correlations
    if (analysisResults.correlation && 
        analysisResults.correlation.strong_correlations && 
        analysisResults.correlation.strong_correlations.length > 0) {
        
        analysisResults.correlation.strong_correlations.forEach(corr => {
            const variables = corr.variables.join(' and ');
            addFocusAreaCheckbox(container, `correlation_${variables}`, `Correlation between ${variables}`);
        });
    }
    
    // Add options for outliers
    if (analysisResults.outliers && Object.keys(analysisResults.outliers).length > 0) {
        Object.keys(analysisResults.outliers).forEach(col => {
            addFocusAreaCheckbox(container, `outliers_${col}`, `Outliers in ${col}`);
        });
    }
    
    // Add options for clusters
    if (analysisResults.clusters && analysisResults.clusters.cluster_analysis) {
        Object.keys(analysisResults.clusters.cluster_analysis).forEach(cluster => {
            addFocusAreaCheckbox(container, `cluster_${cluster}`, `${capitalizeFirst(cluster)} profile`);
        });
    }
    
    // If no focus areas available
    if (container.children.length === 0) {
        container.innerHTML = '<p class="text-muted">No specific focus areas available. The story will cover all aspects of the analysis.</p>';
    }
}

// Add focus area checkbox
function addFocusAreaCheckbox(container, id, label) {
    const div = document.createElement('div');
    div.className = 'form-check';
    div.innerHTML = `
        <input class="form-check-input" type="checkbox" value="${id}" id="${id}">
        <label class="form-check-label" for="${id}">
            ${escapeHtml(label)}
        </label>
    `;
    container.appendChild(div);
}

// Generate data story
function generateStory() {
    // Check if analysis was run
    if (!analysisResults) {
        alert('Please run data analysis first before generating a story.');
        return;
    }
    
    // Get story title
    const title = document.getElementById('story-title-input').value || 'Data Analysis Findings';
    
    // Get selected focus areas
    const focusAreas = [];
    document.querySelectorAll('#focus-areas-container input:checked').forEach(checkbox => {
        focusAreas.push(checkbox.value);
    });
    
    // Show loading state
    document.getElementById('story-empty').classList.add('d-none');
    document.getElementById('story-results').classList.add('d-none');
    document.getElementById('story-loading').classList.remove('d-none');
    
    // Switch to story tab
    document.getElementById('story-tab').click();
    
    // Close modal
    const storyModal = bootstrap.Modal.getInstance(document.getElementById('story-modal'));
    if (storyModal) {
        storyModal.hide();
    }
    
    // Generate story
    axios.post('/api/story', {
        title: title,
        focus_areas: focusAreas.length > 0 ? focusAreas : null
    })
    .then(function(response) {
        storyData = response.data.story;
        
        // Update story display
        updateStoryDisplay(storyData, title);
        
        // Show results
        document.getElementById('story-loading').classList.add('d-none');
        document.getElementById('story-results').classList.remove('d-none');
    })
    .catch(function(error) {
        console.error('Error generating story:', error);
        
        // Hide loading state
        document.getElementById('story-loading').classList.add('d-none');
        
        // Show empty state with error
        document.getElementById('story-empty').classList.remove('d-none');
        
        // Show alert
        alert('Error generating data story. Please try again.');
    });
}

// Update story display
function updateStoryDisplay(story, title) {
    // Set title
    document.getElementById('story-title').textContent = title;
    
    // Update executive summary
    document.getElementById('executive-summary').innerHTML = formatMarkdown(story.executive_summary);
    
    // Update background
    document.getElementById('story-background').innerHTML = formatMarkdown(story.background);
    
    // Update main narrative
    const mainNarrativeEl = document.getElementById('main-narrative');
    mainNarrativeEl.innerHTML = '';
    
    if (story.main_narrative && story.main_narrative.length > 0) {
        story.main_narrative.forEach(insight => {
            const section = document.createElement('div');
            section.className = 'mb-4';
            section.innerHTML = `
                <h4>${escapeHtml(insight.title)}</h4>
                <p class="text-muted">${escapeHtml(insight.insight)}</p>
                <div>${formatMarkdown(insight.explanation)}</div>
            `;
            mainNarrativeEl.appendChild(section);
        });
    } else {
        mainNarrativeEl.innerHTML = '<p class="text-center text-muted">No narrative insights provided</p>';
    }
    
    // Update business implications
    const businessImplicationsEl = document.getElementById('business-implications');
    businessImplicationsEl.innerHTML = '';
    
    if (story.business_implications) {
        if (story.business_implications.key_points && story.business_implications.key_points.length > 0) {
            const pointsList = document.createElement('ul');
            story.business_implications.key_points.forEach(point => {
                const li = document.createElement('li');
                li.innerHTML = escapeHtml(point);
                pointsList.appendChild(li);
            });
            businessImplicationsEl.appendChild(pointsList);
        }
        
        if (story.business_implications.details) {
            const details = document.createElement('div');
            details.className = 'mt-3';
            details.innerHTML = formatMarkdown(story.business_implications.details);
            businessImplicationsEl.appendChild(details);
        }
    }
    
    if (businessImplicationsEl.innerHTML === '') {
        businessImplicationsEl.innerHTML = '<p class="text-center text-muted">No business implications provided</p>';
    }
    
    // Update recommended actions
    const actionsEl = document.getElementById('recommended-actions');
    actionsEl.innerHTML = '';
    
    if (story.recommended_actions && story.recommended_actions.length > 0) {
        const actionsList = document.createElement('ol');
        story.recommended_actions.forEach(action => {
            const li = document.createElement('li');
            li.className = 'mb-2';
            li.innerHTML = escapeHtml(action);
            actionsList.appendChild(li);
        });
        actionsEl.appendChild(actionsList);
    } else {
        actionsEl.innerHTML = '<p class="text-center text-muted">No recommended actions provided</p>';
    }
    
    // Update next steps
    const nextStepsEl = document.getElementById('next-steps');
    nextStepsEl.innerHTML = '';
    
    if (story.next_steps && story.next_steps.length > 0) {
        const stepsList = document.createElement('ul');
        story.next_steps.forEach(step => {
            const li = document.createElement('li');
            li.className = 'mb-2';
            li.innerHTML = escapeHtml(step);
            stepsList.appendChild(li);
        });
        nextStepsEl.appendChild(stepsList);
    } else {
        nextStepsEl.innerHTML = '<p class="text-center text-muted">No next steps provided</p>';
    }
}

// Prepare model form
function prepareModelForm() {
    // Reset form
    document.getElementById('model-form').reset();
    document.getElementById('model-error').classList.add('d-none');
    
    // Populate target column dropdown
    const targetColumn = document.getElementById('target-column');
    targetColumn.innerHTML = '<option value="">Select column to predict</option>';
    
    // Populate features container
    const featuresContainer = document.getElementById('features-container');
    featuresContainer.innerHTML = '';
    
    // Only populate if we have columns info
    if (!columnsInfo) return;
    
    // Add options for target column and features
    columnsInfo.forEach(col => {
        // Add to target dropdown
        const option = document.createElement('option');
        option.value = col.name;
        option.textContent = `${col.name} (${col.dtype})`;
        targetColumn.appendChild(option);
        
        // Add to features container
        const div = document.createElement('div');
        div.className = 'form-check';
        div.innerHTML = `
            <input class="form-check-input feature-checkbox" type="checkbox" value="${col.name}" id="feature-${col.name}">
            <label class="form-check-label" for="feature-${col.name}">
                ${escapeHtml(col.name)}
            </label>
        `;
        featuresContainer.appendChild(div);
    });
}

// Build prediction model
function buildModel() {
    // Get model parameters
    const targetColumn = document.getElementById('target-column').value;
    
    if (!targetColumn) {
        document.getElementById('model-error').textContent = 'Please select a target column to predict';
        document.getElementById('model-error').classList.remove('d-none');
        return;
    }
    
    // Get selected features
    const features = [];
    document.querySelectorAll('.feature-checkbox:checked').forEach(checkbox => {
        features.push(checkbox.value);
    });
    
    const testSize = parseFloat(document.getElementById('test-size').value);
    const includeCategorical = document.getElementById('include-categorical').checked;
    
    // Close modal
    const modelModal = bootstrap.Modal.getInstance(document.getElementById('model-modal'));
    if (modelModal) {
        modelModal.hide();
    }
    
    // Show loading state
    document.getElementById('models-empty').classList.add('d-none');
    document.getElementById('models-results').classList.add('d-none');
    document.getElementById('models-loading').classList.remove('d-none');
    
    // Switch to models tab
    document.getElementById('models-tab').click();
    
    // Build model
    axios.post('/api/predict', {
        target_column: targetColumn,
        features: features.length > 0 ? features : null,
        test_size: testSize,
        include_categorical: includeCategorical
    })
    .then(function(response) {
        modelResults = response.data.results;
        
        // Update model display
        updateModelDisplay(modelResults);
        
        // Show results
        document.getElementById('models-loading').classList.add('d-none');
        document.getElementById('models-results').classList.remove('d-none');
    })
    .catch(function(error) {
        console.error('Error building model:', error);
        
        // Hide loading state
        document.getElementById('models-loading').classList.add('d-none');
        
        // Show empty state with error
        document.getElementById('models-empty').classList.remove('d-none');
        
        // Show alert
        let errorMessage = 'Error building prediction model. Please try again.';
        if (error.response && error.response.data && error.response.data.error) {
            errorMessage = error.response.data.error;
        }
        
        alert(errorMessage);
    });
}

// Update model display
function updateModelDisplay(model) {
    const container = document.getElementById('models-results');
    container.innerHTML = '';
    
    if (!model || model.error) {
        container.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-circle me-2"></i>
                ${escapeHtml(model.error || 'Error building model')}
            </div>
            <div class="text-center">
                <button id="models-try-again-btn" class="btn btn-dark" data-bs-toggle="modal" data-bs-target="#model-modal">
                    <i class="fas fa-redo me-1"></i>Try Again
                </button>
            </div>
        `;
        return;
    }
    
    // Create model overview card
    const overviewCard = document.createElement('div');
    overviewCard.className = 'card mb-4';
    
    const overviewHeader = document.createElement('div');
    overviewHeader.className = 'card-header d-flex justify-content-between align-items-center';
    
    const modelTypeClass = model.model_type === 'classification' ? 'bg-info' : 'bg-primary';
    
    overviewHeader.innerHTML = `
        <h5 class="mb-0">
            <i class="fas fa-cogs me-2"></i>Prediction Model: ${escapeHtml(model.target_column)}
        </h5>
        <span class="badge ${modelTypeClass}">${capitalizeFirst(model.model_type)} Model</span>
    `;
    
    const overviewBody = document.createElement('div');
    overviewBody.className = 'card-body';
    
    let performanceMetrics = '';
    if (model.model_type === 'classification') {
        performanceMetrics = `
            <div class="row mb-3">
                <div class="col-md-4">
                    <div class="p-3 bg-light rounded">
                        <h6 class="text-center mb-1">Accuracy</h6>
                        <h3 class="text-center mb-0">${(model.performance.test_accuracy * 100).toFixed(1)}%</h3>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="p-3 bg-light rounded">
                        <h6 class="text-center mb-1">Training Score</h6>
                        <h3 class="text-center mb-0">${(model.performance.train_accuracy * 100).toFixed(1)}%</h3>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="p-3 bg-light rounded">
                        <h6 class="text-center mb-1">Difference</h6>
                        <h3 class="text-center mb-0">${((model.performance.train_accuracy - model.performance.test_accuracy) * 100).toFixed(1)}%</h3>
                    </div>
                </div>
            </div>
        `;
    } else {
        performanceMetrics = `
            <div class="row mb-3">
                <div class="col-md-4">
                    <div class="p-3 bg-light rounded">
                        <h6 class="text-center mb-1">R² Score</h6>
                        <h3 class="text-center mb-0">${model.performance.test_r2.toFixed(3)}</h3>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="p-3 bg-light rounded">
                        <h6 class="text-center mb-1">RMSE</h6>
                        <h3 class="text-center mb-0">${model.performance.rmse.toFixed(3)}</h3>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="p-3 bg-light rounded">
                        <h6 class="text-center mb-1">Training R²</h6>
                        <h3 class="text-center mb-0">${model.performance.train_r2.toFixed(3)}</h3>
                    </div>
                </div>
            </div>
        `;
    }
    
    overviewBody.innerHTML = `
        <div class="mb-3">
            <small class="text-muted">Model predicts <strong>${escapeHtml(model.target_column)}</strong> using ${model.features_used.length} features</small>
        </div>
        ${performanceMetrics}
        <h5 class="mb-3">Model Evaluation</h5>
        <p class="mb-4">
            ${model.model_type === 'classification' ? 
                `This classification model achieved ${(model.performance.test_accuracy * 100).toFixed(1)}% accuracy on the test data.` : 
                `This regression model achieved an R² score of ${model.performance.test_r2.toFixed(3)} and RMSE of ${model.performance.rmse.toFixed(3)}.`}
            ${Math.abs(model.performance.train_r2 - model.performance.test_r2) > 0.1 || 
              (model.model_type === 'classification' && Math.abs(model.performance.train_accuracy - model.performance.test_accuracy) > 0.1) ?
                `There appears to be some overfitting as the training score is significantly higher than the test score.` : 
                `The model generalizes well as the training and test scores are close.`}
        </p>
    `;
    
    overviewCard.appendChild(overviewHeader);
    overviewCard.appendChild(overviewBody);
    container.appendChild(overviewCard);
    
    // Create feature importance card
    const featureCard = document.createElement('div');
    featureCard.className = 'card mb-4';
    
    const featureHeader = document.createElement('div');
    featureHeader.className = 'card-header';
    featureHeader.innerHTML = '<h5 class="mb-0"><i class="fas fa-star me-2"></i>Feature Importance</h5>';
    
    const featureBody = document.createElement('div');
    featureBody.className = 'card-body';
    
    // Sort features by importance
    const sortedFeatures = [...model.feature_importance].sort((a, b) => b.importance - a.importance);
    
    // Get max importance for scaling
    const maxImportance = sortedFeatures[0].importance;
    
    let featuresHtml = '<div class="feature-importance-list">';
    sortedFeatures.forEach(feature => {
        featuresHtml += `
            <div class="mb-3">
                <div class="d-flex justify-content-between mb-1">
                    <div>${escapeHtml(feature.feature)}</div>
                    <div><strong>${(feature.importance * 100).toFixed(1)}%</strong></div>
                </div>
                <div class="feature-importance-bar">
                    <div class="feature-importance-fill" style="width: ${(feature.importance / maxImportance) * 100}%"></div>
                </div>
            </div>
        `;
    });
    featuresHtml += '</div>';
    
    featureBody.innerHTML = featuresHtml;
    
    featureCard.appendChild(featureHeader);
    featureCard.appendChild(featureBody);
    container.appendChild(featureCard);
    
    // If it's a classification model, add classification report
    if (model.model_type === 'classification' && model.performance.classification_report) {
        const reportCard = document.createElement('div');
        reportCard.className = 'card';
        
        const reportHeader = document.createElement('div');
        reportHeader.className = 'card-header';
        reportHeader.innerHTML = '<h5 class="mb-0"><i class="fas fa-table me-2"></i>Classification Report</h5>';
        
        const reportBody = document.createElement('div');
        reportBody.className = 'card-body';
        
        const report = model.performance.classification_report;
        
        let reportHtml = '<div class="table-responsive"><table class="table table-bordered">';
        reportHtml += `
            <thead>
                <tr>
                    <th>Class</th>
                    <th>Precision</th>
                    <th>Recall</th>
                    <th>F1-Score</th>
                    <th>Support</th>
                </tr>
            </thead>
            <tbody>
        `;
        
        // Add rows for each class
        for (const [className, metrics] of Object.entries(report)) {
            // Skip aggregated metrics
            if (['accuracy', 'macro avg', 'weighted avg', 'samples avg'].includes(className)) continue;
            
            reportHtml += `
                <tr>
                    <td>${escapeHtml(className)}</td>
                    <td>${metrics.precision ? metrics.precision.toFixed(3) : 'N/A'}</td>
                    <td>${metrics.recall ? metrics.recall.toFixed(3) : 'N/A'}</td>
                    <td>${metrics.f1-score ? metrics['f1-score'].toFixed(3) : 'N/A'}</td>
                    <td>${metrics.support}</td>
                </tr>
            `;
        }
        
        // Add aggregated metrics
        if (report['macro avg']) {
            reportHtml += `
                <tr class="table-secondary">
                    <td><strong>Macro Avg</strong></td>
                    <td>${report['macro avg'].precision.toFixed(3)}</td>
                    <td>${report['macro avg'].recall.toFixed(3)}</td>
                    <td>${report['macro avg']['f1-score'].toFixed(3)}</td>
                    <td>${report['macro avg'].support}</td>
                </tr>
            `;
        }
        
        if (report['weighted avg']) {
            reportHtml += `
                <tr class="table-secondary">
                    <td><strong>Weighted Avg</strong></td>
                    <td>${report['weighted avg'].precision.toFixed(3)}</td>
                    <td>${report['weighted avg'].recall.toFixed(3)}</td>
                    <td>${report['weighted avg']['f1-score'].toFixed(3)}</td>
                    <td>${report['weighted avg'].support}</td>
                </tr>
            `;
        }
        
        reportHtml += '</tbody></table></div>';
        
        reportBody.innerHTML = reportHtml;
        
        reportCard.appendChild(reportHeader);
        reportCard.appendChild(reportBody);
        container.appendChild(reportCard);
    }
}

// Update tab content
function updateTabContent(tabId) {
    // If switching to data explorer tab, make sure data is loaded
    if (tabId === 'explorer') {
        // If we haven't loaded the data yet, do it now
        if (document.getElementById('data-table').querySelector('tbody').children.length <= 1) {
            fetchData();
        }
        
        // If we haven't loaded the columns yet, do it now
        if (document.getElementById('columns-table').querySelector('tbody').children.length <= 1) {
            fetchColumns();
        }
    }
}

// Helper Functions

// Escape HTML to prevent XSS
function escapeHtml(html) {
    if (html === null || html === undefined) return '';
    return String(html)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Capitalize first letter
function capitalizeFirst(string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Format markdown-like text to HTML
function formatMarkdown(text) {
    if (!text) return '';
    
    // Replace newlines with <br>
    let html = text.replace(/\n/g, '<br>');
    
    // Bold text
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Italic text
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Make lists
    if (html.includes('\n- ')) {
        const lines = html.split('<br>');
        let inList = false;
        let formattedLines = [];
        
        lines.forEach(line => {
            if (line.trim().startsWith('- ')) {
                if (!inList) {
                    formattedLines.push('<ul>');
                    inList = true;
                }
                formattedLines.push('<li>' + line.trim().substring(2) + '</li>');
            } else {
                if (inList) {
                    formattedLines.push('</ul>');
                    inList = false;
                }
                formattedLines.push(line);
            }
        });
        
        if (inList) {
            formattedLines.push('</ul>');
        }
        
        html = formattedLines.join('');
    }
    
    return html;
}