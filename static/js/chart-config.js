// Chart.js Global Configuration
Chart.defaults.font.family = "'Segoe UI', 'Helvetica Neue', 'Arial', sans-serif";
Chart.defaults.font.size = 12;
Chart.defaults.color = '#6B778C';
Chart.defaults.plugins.tooltip.padding = 10;
Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(23, 43, 77, 0.9)';
Chart.defaults.plugins.tooltip.titleColor = '#FFFFFF';
Chart.defaults.plugins.tooltip.bodyColor = '#FFFFFF';
Chart.defaults.plugins.tooltip.borderColor = 'rgba(255, 255, 255, 0.2)';
Chart.defaults.plugins.tooltip.borderWidth = 1;
Chart.defaults.plugins.tooltip.displayColors = true;
Chart.defaults.plugins.tooltip.boxPadding = 5;
Chart.defaults.elements.line.tension = 0.4;
Chart.defaults.elements.line.borderWidth = 3;
Chart.defaults.elements.point.radius = 5;
Chart.defaults.elements.point.hoverRadius = 7;
Chart.defaults.responsive = true;
Chart.defaults.maintainAspectRatio = false;

// Custom chart gradients and patterns
function createPriceChart(ctx, labels, currentData, predictedData) {
    // Create gradient for fill
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(38, 132, 255, 0.4)');
    gradient.addColorStop(1, 'rgba(38, 132, 255, 0)');
    
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Current Fare',
                    data: currentData,
                    borderColor: '#2684FF',
                    backgroundColor: gradient,
                    fill: true,
                    pointBackgroundColor: '#2684FF',
                    pointBorderColor: '#FFFFFF',
                    pointBorderWidth: 2,
                    tension: 0.4
                },
                {
                    label: 'Predicted Fare',
                    data: predictedData,
                    borderColor: '#00875A',
                    backgroundColor: 'rgba(0, 135, 90, 0.1)',
                    borderDash: [5, 5],
                    fill: false,
                    pointBackgroundColor: '#00875A',
                    pointBorderColor: '#FFFFFF',
                    pointBorderWidth: 2,
                    tension: 0.4
                }
            ]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: false,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    align: 'end',
                    labels: {
                        boxWidth: 12,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
}

// Create eco comparison chart
function createEcoComparisonChart(ctx, vehicleTypes, emissions) {
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: vehicleTypes,
            datasets: [{
                label: 'CO2 Emissions (g/km)',
                data: emissions,
                backgroundColor: [
                    'rgba(0, 135, 90, 0.7)',   // Electric
                    'rgba(38, 132, 255, 0.7)', // Sedan
                    'rgba(255, 171, 0, 0.7)',  // SUV
                    'rgba(222, 53, 11, 0.7)'   // Luxury
                ],
                borderColor: [
                    'rgb(0, 135, 90)',
                    'rgb(38, 132, 255)',
                    'rgb(255, 171, 0)',
                    'rgb(222, 53, 11)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'CO2 Emissions (g/km)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Vehicle Type'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}
