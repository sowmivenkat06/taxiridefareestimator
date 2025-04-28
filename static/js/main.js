// Global variables
let fareData = null;
let predictionData = null;
let predictionChart = null;
let currencySymbol = '$';

// DOM Ready
document.addEventListener('DOMContentLoaded', function() {
    // Setup range input value displays
    setupRangeInputs();
    
    // Setup form submission - only if the form exists (on fare calculator page)
    const fareForm = document.getElementById('fare-form');
    if (fareForm) {
        fareForm.addEventListener('submit', function(e) {
            e.preventDefault();
            calculateFare();
        });
        
        // Initial calculation on page load - only for fare calculator page
        calculateFare();
    }
    
    // Setup quick fare form on homepage
    const quickFareForm = document.getElementById('quick-fare-form');
    if (quickFareForm) {
        quickFareForm.addEventListener('submit', function(e) {
            e.preventDefault();
            calculateQuickFare();
        });
    }
    
    // Setup currency change handler
    const currencySelect = document.getElementById('currency-select');
    if (currencySelect) {
        currencySelect.addEventListener('change', function() {
            if (fareData) {
                if (document.getElementById('fare-form')) {
                    calculateFare();
                } else if (document.getElementById('quick-fare-form')) {
                    calculateQuickFare();
                }
            }
        });
    }
});

// Setup range input displays
function setupRangeInputs() {
    // Regular fare calculator page inputs
    const distanceInput = document.getElementById('distance');
    const distanceValue = document.getElementById('distance-value');
    
    if (distanceInput && distanceValue) {
        distanceInput.addEventListener('input', function() {
            distanceValue.textContent = this.value + ' km';
        });
    }
    
    const durationInput = document.getElementById('duration');
    const durationValue = document.getElementById('duration-value');
    
    if (durationInput && durationValue) {
        durationInput.addEventListener('input', function() {
            durationValue.textContent = this.value + ' min';
        });
    }
    
    // Quick calculator inputs on homepage
    const distanceQuickInput = document.getElementById('distance-quick');
    const distanceQuickValue = document.getElementById('distance-value-quick');
    
    if (distanceQuickInput && distanceQuickValue) {
        distanceQuickInput.addEventListener('input', function() {
            distanceQuickValue.textContent = this.value + ' km';
        });
    }
    
    const durationQuickInput = document.getElementById('duration-quick');
    const durationQuickValue = document.getElementById('duration-value-quick');
    
    if (durationQuickInput && durationQuickValue) {
        durationQuickInput.addEventListener('input', function() {
            durationQuickValue.textContent = this.value + ' min';
        });
    }
}

// Get selected taxi type
function getSelectedTaxiType() {
    const taxiOptions = document.getElementsByName('taxi-type');
    for (const option of taxiOptions) {
        if (option.checked) {
            return option.value;
        }
    }
    return 'Sedan'; // Default
}

// Calculate fare based on form inputs
function calculateFare() {
    // Show loading states
    showLoadingState();
    
    // Get form values
    const distance = parseFloat(document.getElementById('distance').value);
    const duration = parseFloat(document.getElementById('duration').value);
    const taxiType = getSelectedTaxiType();
    const location = document.getElementById('location').value;
    const timeOfDay = document.getElementById('time-of-day').value;
    const currency = document.getElementById('currency-select').value;
    
    // Set currency symbol for display
    setCurrencySymbol(currency);
    
    // Prepare request data
    const requestData = {
        distance: distance,
        duration: duration,
        taxi_type: taxiType,
        location: location,
        time_of_day: timeOfDay,
        currency: currency
    };
    
    // Call API for fare estimation
    axios.post('/api/fare/estimate', requestData)
        .then(function(response) {
            fareData = response.data;
            updateFareDisplay(fareData);
            updateEcoDisplay(fareData);
            
            // Now get predictions
            return axios.post('/api/fare/predict', {
                ...requestData,
                time_offset: 60 // Get predictions for an hour
            });
        })
        .then(function(response) {
            predictionData = response.data;
            updatePredictionDisplay(predictionData);
            generateSuggestions();
            
            // Hide all loading states
            hideLoadingState();
        })
        .catch(function(error) {
            console.error('Error calculating fare:', error);
            showError('Failed to calculate fare. Please try again.');
            hideLoadingState();
        });
}

// Helper function to safely toggle element classes
function toggleElementClass(id, addClass, removeClass) {
    const element = document.getElementById(id);
    if (element) {
        element.classList.add(addClass);
        element.classList.remove(removeClass);
    }
}

// Show loading state for all sections
function showLoadingState() {
    // Fare section
    toggleElementClass('fare-loading', '', 'd-none');
    toggleElementClass('fare-details', 'd-none', '');
    
    // Factors section
    toggleElementClass('factors-loading', '', 'd-none');
    toggleElementClass('fare-factors', 'd-none', '');
    
    // Eco section
    toggleElementClass('eco-loading', '', 'd-none');
    toggleElementClass('eco-details', 'd-none', '');
    
    // Prediction section
    toggleElementClass('prediction-loading', '', 'd-none');
    toggleElementClass('prediction-details', 'd-none', '');
    
    // Suggestions section
    toggleElementClass('suggestions-loading', '', 'd-none');
    toggleElementClass('suggestions-content', 'd-none', '');
}

// Hide loading state for all sections
function hideLoadingState() {
    // Fare section
    toggleElementClass('fare-loading', 'd-none', '');
    toggleElementClass('fare-details', '', 'd-none');
    
    // Factors section
    toggleElementClass('factors-loading', 'd-none', '');
    toggleElementClass('fare-factors', '', 'd-none');
    
    // Eco section
    toggleElementClass('eco-loading', 'd-none', '');
    toggleElementClass('eco-details', '', 'd-none');
    
    // Prediction section
    toggleElementClass('prediction-loading', 'd-none', '');
    toggleElementClass('prediction-details', '', 'd-none');
    
    // Suggestions section
    toggleElementClass('suggestions-loading', 'd-none', '');
    toggleElementClass('suggestions-content', '', 'd-none');
}

// Set currency symbol based on selected currency
function setCurrencySymbol(currencyCode) {
    const symbols = {
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
        'JPY': '¥',
        'CAD': 'C$',
        'AUD': 'A$',
        'CNY': '¥',
        'INR': '₹'
    };
    
    currencySymbol = symbols[currencyCode] || '$';
}

// Update fare display with calculation results
function updateFareDisplay(data) {
    // Update main fare amount
    document.getElementById('fare-amount').textContent = currencySymbol + data.adjusted_fare.toFixed(2);
    
    // Update fare description
    const taxiType = getSelectedTaxiType();
    document.getElementById('fare-description').textContent = 
        `Estimated ${taxiType} fare (${data.currency})`;
    
    // Update fare breakdown
    document.getElementById('base-fare').textContent = currencySymbol + data.base_fare.toFixed(2);
    document.getElementById('distance-fare').textContent = currencySymbol + data.distance_fare.toFixed(2);
    document.getElementById('time-fare').textContent = currencySymbol + data.time_fare.toFixed(2);
    document.getElementById('raw-fare').textContent = currencySymbol + data.raw_fare.toFixed(2);
    
    // Update fare factors
    updateFactorBadge('traffic-factor', data.factors.traffic.condition, data.factors.traffic.modifier);
    updateFactorBadge('weather-factor', data.factors.weather.condition, data.factors.weather.modifier);
    updateFactorBadge('time-factor', data.factors.time.period, data.factors.time.modifier);
    updateFactorBadge('demand-factor', data.factors.demand.level, data.factors.demand.modifier);
    
    // Show eco discount if applicable
    const ecoDiscountRow = document.getElementById('eco-discount-row');
    const ecoDiscount = document.getElementById('eco-discount');
    
    if (data.factors.eco_discount > 0) {
        ecoDiscountRow.classList.remove('d-none');
        ecoDiscount.textContent = '-' + (data.factors.eco_discount * 100) + '%';
    } else {
        ecoDiscountRow.classList.add('d-none');
    }
}

// Update eco display with environmental impact data
function updateEcoDisplay(data) {
    // Update eco score
    const ecoScore = data.eco_score;
    const ecoScoreElement = document.getElementById('eco-score');
    ecoScoreElement.textContent = ecoScore;
    
    // Update eco score circle color
    const ecoScoreCircle = document.querySelector('.eco-score-circle');
    ecoScoreCircle.classList.remove('eco-score-low', 'eco-score-medium', 'eco-score-high');
    
    if (ecoScore < 40) {
        ecoScoreCircle.classList.add('eco-score-low');
    } else if (ecoScore < 70) {
        ecoScoreCircle.classList.add('eco-score-medium');
    } else {
        ecoScoreCircle.classList.add('eco-score-high');
    }
    
    // Update CO2 emissions
    document.getElementById('co2-emission').textContent = 
        formatNumber(data.co2_emissions.total_g) + ' g';
    
    // Update tree equivalent
    const treeEquivalent = data.co2_emissions.trees_equivalent;
    document.getElementById('tree-equivalent').textContent = 
        treeEquivalent.toFixed(4) + (treeEquivalent === 1 ? ' tree' : ' trees');
    
    // Update CO2 savings
    const savings = data.co2_emissions.savings_vs_suv_g;
    const savingsElement = document.getElementById('co2-savings');
    
    if (savings >= 0) {
        savingsElement.textContent = formatNumber(savings) + ' g saved';
        savingsElement.classList.remove('text-danger');
        savingsElement.classList.add('text-success');
    } else {
        savingsElement.textContent = formatNumber(Math.abs(savings)) + ' g extra';
        savingsElement.classList.remove('text-success');
        savingsElement.classList.add('text-danger');
    }
}

// Update prediction display with chart
function updatePredictionDisplay(data) {
    const predictions = data.predictions;
    
    // Prepare data for chart
    const labels = ['Now'];
    const fareValues = [data.current.adjusted_fare];
    const colors = ['#2684FF'];
    
    // Add prediction data points
    predictions.forEach(prediction => {
        const timeLabel = prediction.time_offset + 'm';
        labels.push(timeLabel);
        fareValues.push(prediction.fare);
        
        // Use color based on change
        if (prediction.change_percentage > 5) {
            colors.push('#DE350B'); // Red for significant increase
        } else if (prediction.change_percentage > 0) {
            colors.push('#FFAB00'); // Yellow for slight increase
        } else if (prediction.change_percentage < -5) {
            colors.push('#00875A'); // Green for significant decrease
        } else if (prediction.change_percentage < 0) {
            colors.push('#00B8D9'); // Blue for slight decrease
        } else {
            colors.push('#6B778C'); // Gray for no change
        }
    });
    
    // Get the canvas element
    const ctx = document.getElementById('fare-prediction-chart').getContext('2d');
    
    // Destroy previous chart if it exists
    if (predictionChart) {
        predictionChart.destroy();
    }
    
    // Create the chart
    predictionChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Estimated Fare',
                data: fareValues,
                borderColor: '#2684FF',
                backgroundColor: 'rgba(38, 132, 255, 0.1)',
                pointBackgroundColor: colors,
                pointBorderColor: colors,
                pointRadius: 6,
                pointHoverRadius: 8,
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            label += currencySymbol + context.raw.toFixed(2);
                            
                            // Add change percentage for prediction points
                            if (context.dataIndex > 0) {
                                const prediction = predictions[context.dataIndex - 1];
                                const changeText = prediction.change_percentage > 0 ? 
                                    `+${prediction.change_percentage}%` : 
                                    `${prediction.change_percentage}%`;
                                label += ` (${changeText})`;
                            }
                            
                            return label;
                        },
                        afterLabel: function(context) {
                            // Add traffic and weather info for prediction points
                            if (context.dataIndex > 0) {
                                const prediction = predictions[context.dataIndex - 1];
                                return [
                                    `Traffic: ${capitalizeFirst(prediction.traffic)}`,
                                    `Weather: ${capitalizeFirst(prediction.weather)}`
                                ];
                            }
                            return null;
                        }
                    }
                },
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        callback: function(value) {
                            return currencySymbol + value.toFixed(2);
                        }
                    },
                    title: {
                        display: true,
                        text: 'Fare Amount'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Time'
                    }
                }
            }
        }
    });
}

// Generate smart suggestions based on fare data
function generateSuggestions() {
    const distance = parseFloat(document.getElementById('distance').value);
    const duration = parseFloat(document.getElementById('duration').value);
    const taxiType = getSelectedTaxiType();
    const suggestions = [];
    
    // Suggest electric taxi if not already selected
    if (taxiType !== 'Electric') {
        suggestions.push({
            icon: 'leaf',
            title: 'Choose an Electric Taxi',
            description: 'Reduce your CO2 emissions by up to 84% and get a 10% fare discount.'
        });
    }
    
    // Suggest public transport for short to medium distances
    if (distance < 10) {
        suggestions.push({
            icon: 'bus',
            title: 'Consider Public Transport',
            description: 'For this distance, public transportation could be a more eco-friendly option.'
        });
    }
    
    // If current time is rush hour, suggest time change
    const timeOfDay = document.getElementById('time-of-day').value;
    if (timeOfDay === 'morning_rush' || timeOfDay === 'evening_rush') {
        suggestions.push({
            icon: 'clock',
            title: 'Travel Outside Rush Hours',
            description: 'Shifting your travel time could reduce your fare by up to 50%.'
        });
    }
    
    // If traffic is heavy or extreme, suggest route optimization
    if (fareData.factors.traffic.condition === 'heavy' || fareData.factors.traffic.condition === 'extreme') {
        suggestions.push({
            icon: 'route',
            title: 'Optimize Your Route',
            description: 'Current traffic is heavy. Consider alternative routes or waiting for traffic to clear.'
        });
    }
    
    // If weather is poor, suggest preparation
    if (fareData.factors.weather.condition === 'rain' || fareData.factors.weather.condition === 'snow' || fareData.factors.weather.condition === 'storm') {
        suggestions.push({
            icon: 'umbrella',
            title: 'Prepare for ' + capitalizeFirst(fareData.factors.weather.condition),
            description: 'Current weather conditions may affect travel times and comfort.'
        });
    }
    
    // If distance is very short, suggest walking
    if (distance < 2) {
        suggestions.push({
            icon: 'walking',
            title: 'Consider Walking',
            description: 'For this short distance, walking could be a healthier and eco-friendly option.'
        });
    }
    
    // If demand is very high, suggest waiting
    if (fareData.factors.demand.level === 'very_high' || fareData.factors.demand.level === 'extreme') {
        suggestions.push({
            icon: 'hourglass-half',
            title: 'Consider Waiting',
            description: 'Current demand is high, which increases fares. Waiting may reduce your fare.'
        });
    }
    
    // If predictions show significant decrease, suggest waiting
    const predictions = predictionData.predictions;
    const lastPrediction = predictions[predictions.length - 1];
    if (lastPrediction && lastPrediction.change_percentage < -10) {
        suggestions.push({
            icon: 'chart-line',
            title: 'Wait for Lower Fare',
            description: `Fares are predicted to drop by ${Math.abs(lastPrediction.change_percentage)}% in the next hour.`
        });
    }
    
    // Display suggestions
    const suggestionsContainer = document.getElementById('suggestions-list');
    suggestionsContainer.innerHTML = '';
    
    suggestions.forEach(suggestion => {
        const suggestionElement = document.createElement('div');
        suggestionElement.className = 'col-md-4 mb-3';
        suggestionElement.innerHTML = `
            <div class="suggestion-card">
                <div class="suggestion-icon"><i class="fas fa-${suggestion.icon}"></i></div>
                <h5>${suggestion.title}</h5>
                <p>${suggestion.description}</p>
            </div>
        `;
        suggestionsContainer.appendChild(suggestionElement);
    });
    
    // If no suggestions, show a default message
    if (suggestions.length === 0) {
        suggestionsContainer.innerHTML = `
            <div class="col-12 text-center py-4">
                <i class="fas fa-check-circle text-success mb-3" style="font-size: 3rem;"></i>
                <h5>Great choice!</h5>
                <p class="text-muted">Your current selection is already optimized for this trip.</p>
            </div>
        `;
    }
}

// Update badge for fare factors
function updateFactorBadge(elementId, condition, modifier) {
    const element = document.getElementById(elementId);
    element.textContent = capitalizeFirst(condition.replace('_', ' ')) + ' (' + modifier.toFixed(2) + 'x)';
    
    // Remove all badge classes
    element.classList.remove('badge-factor-low', 'badge-factor-moderate', 'badge-factor-high', 'badge-factor-extreme');
    
    // Add appropriate class based on condition severity
    if (condition === 'low' || modifier <= 1.05) {
        element.classList.add('badge-factor-low');
    } else if (condition === 'moderate' || modifier <= 1.2) {
        element.classList.add('badge-factor-moderate');
    } else if (condition === 'heavy' || modifier <= 1.5) {
        element.classList.add('badge-factor-high');
    } else {
        element.classList.add('badge-factor-extreme');
    }
}

// Utility function to capitalize first letter
function capitalizeFirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Format number with thousand separators
function formatNumber(number) {
    return new Intl.NumberFormat().format(number);
}

// Show error message
function showError(message) {
    // Implement error display (e.g., toast notification)
    console.error(message);
    alert(message);
}
