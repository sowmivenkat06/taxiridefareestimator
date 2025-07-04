document.addEventListener('DOMContentLoaded', function() {
    // Get form elements
    const form = document.getElementById('quick-fare-form');
    const distanceSlider = document.getElementById('distance-quick');
    const durationSlider = document.getElementById('duration-quick');
    const distanceValue = document.getElementById('distance-value-quick');
    const durationValue = document.getElementById('duration-value-quick');
    const fareResult = document.getElementById('fare-result');
    
    // Base rates per taxi type (₹)
    const BASE_RATES = {
        'Sedan': { base: 50, perKm: 12, perMin: 2 },
        'SUV': { base: 80, perKm: 15, perMin: 2.5 },
        'Electric': { base: 60, perKm: 10, perMin: 1.8 }
    };
    
    // Update distance and duration values
    distanceSlider.addEventListener('input', function() {
        distanceValue.textContent = this.value;
        if (form.checkValidity()) calculateFare();
    });
    
    durationSlider.addEventListener('input', function() {
        durationValue.textContent = this.value;
        if (form.checkValidity()) calculateFare();
    });
    
    // Handle taxi type selection
    document.querySelectorAll('input[name="taxi-type-quick"]').forEach(radio => {
        radio.addEventListener('change', function() {
            if (form.checkValidity()) calculateFare();
        });
    });

    // Handle passenger count changes
    document.getElementById('passengers-quick').addEventListener('change', function() {
        if (form.checkValidity()) calculateFare();
    });
    
    // Handle form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        calculateFare();
    });
    
    // Calculate fare
    function calculateFare() {
        // Get input values
        const distance = parseFloat(distanceSlider.value);
        const duration = parseFloat(durationSlider.value);
        const taxiType = document.querySelector('input[name="taxi-type-quick"]:checked').value;
        const passengerCount = parseInt(document.getElementById('passengers-quick').value) || 1;
        
        // Get rates for selected taxi type
        const rates = BASE_RATES[taxiType];
        
        // Calculate base fare
        const baseFare = rates.base;
        const distanceFare = distance * rates.perKm;
        const durationFare = duration * rates.perMin;
        
        // Calculate total fare with passenger multiplier
        const totalFare = (baseFare + distanceFare + durationFare) * (passengerCount >= 5 ? 5 : passengerCount);
        
        // Add 10% variation for min/max estimates
        const minFare = Math.round(totalFare * 0.9);
        const maxFare = Math.round(totalFare * 1.1);
        
        // Update display
        document.getElementById('estimated-fare').textContent = `₹${Math.round(totalFare)}`;
        document.getElementById('min-fare').textContent = `₹${minFare}`;
        document.getElementById('max-fare').textContent = `₹${maxFare}`;
        
        // Show result
        fareResult.classList.remove('d-none');
    }
}); 