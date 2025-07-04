let map;
let markers = [];
let routeLine;

function initMap() {
    // Initialize the map centered on Tamil Nadu
    map = L.map('map').setView([11.1271, 78.6569], 7);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Add click listener to map
    map.on('click', function(e) {
        placeMarker(e.latlng);
    });
}

function placeMarker(location) {
    if (markers.length >= 2) {
        // Remove existing markers and route if we have 2
        markers.forEach(marker => map.removeLayer(marker));
        if (routeLine) {
            map.removeLayer(routeLine);
        }
        markers = [];
    }

    const marker = L.marker(location, {
        draggable: true
    }).addTo(map);

    markers.push(marker);

    // Update input fields with coordinates
    if (markers.length === 1) {
        document.getElementById('pickup_location').value = `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
    } else {
        document.getElementById('dropoff_location').value = `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
        calculateRoute();
    }

    // Add drag end listener
    marker.on('dragend', function(e) {
        const newLocation = e.target.getLatLng();
        if (markers.length === 1) {
            document.getElementById('pickup_location').value = `${newLocation.lat.toFixed(6)}, ${newLocation.lng.toFixed(6)}`;
        } else {
            document.getElementById('dropoff_location').value = `${newLocation.lat.toFixed(6)}, ${newLocation.lng.toFixed(6)}`;
            calculateRoute();
        }
    });
}

function calculateRoute() {
    if (markers.length !== 2) return;

    const start = markers[0].getLatLng();
    const end = markers[1].getLatLng();

    // Remove existing route if any
    if (routeLine) {
        map.removeLayer(routeLine);
    }

    // Draw a straight line between points (for demonstration)
    routeLine = L.polyline([start, end], {
        color: 'blue',
        weight: 3,
        opacity: 0.7
    }).addTo(map);

    // Calculate distance and duration
    const distance = calculateDistance(start, end);
    const duration = calculateDuration(distance);

    // Update form fields
    document.getElementById('distance').value = distance.toFixed(2);
    document.getElementById('duration').value = duration.toFixed(2);

    // Trigger fare calculation
    calculateFare();
}

function calculateDistance(start, end) {
    // Haversine formula to calculate distance between two points
    const R = 6371; // Earth's radius in km
    const dLat = (end.lat - start.lat) * Math.PI / 180;
    const dLon = (end.lng - start.lng) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(start.lat * Math.PI / 180) * Math.cos(end.lat * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function calculateDuration(distance) {
    // Assuming average speed of 30 km/h
    return (distance / 30) * 60; // Convert to minutes
}

// Initialize map when document is ready
document.addEventListener('DOMContentLoaded', function() {
    initMap();
}); 