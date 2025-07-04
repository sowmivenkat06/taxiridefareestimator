document.addEventListener('DOMContentLoaded', function() {
    // Sample ride history data
    const sampleRides = [
        {
            id: 1,
            datetime: '2024-03-15 14:30',
            from: 'Chennai Central',
            to: 'Chennai Airport',
            distance: '18.5 km',
            taxiType: 'Electric',
            fare: '₹450'
        },
        {
            id: 2,
            datetime: '2024-03-14 09:15',
            from: 'T Nagar',
            to: 'Besant Nagar',
            distance: '8.2 km',
            taxiType: 'Regular',
            fare: '₹280'
        }
    ];

    // Function to populate ride history table
    function populateRideHistory() {
        const tableBody = document.getElementById('ride-history-table');
        const loadingDiv = document.getElementById('ride-history-loading');
        const emptyDiv = document.getElementById('ride-history-empty');
        const contentDiv = document.getElementById('ride-history-content');

        if (sampleRides.length === 0) {
            loadingDiv.classList.add('d-none');
            emptyDiv.classList.remove('d-none');
            return;
        }

        tableBody.innerHTML = '';
        sampleRides.forEach(ride => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${ride.datetime}</td>
                <td>${ride.from}</td>
                <td>${ride.to}</td>
                <td>${ride.distance}</td>
                <td>${ride.taxiType}</td>
                <td>${ride.fare}</td>
            `;
            tableBody.appendChild(row);
        });

        loadingDiv.classList.add('d-none');
        contentDiv.classList.remove('d-none');
    }

    // Function to show ride details in modal
    window.showRideDetails = function(rideId) {
        const ride = sampleRides.find(r => r.id === rideId);
        if (!ride) return;

        // Update modal content
        document.getElementById('detail-pickup').textContent = ride.from;
        document.getElementById('detail-dropoff').textContent = ride.to;
        document.getElementById('detail-distance').textContent = ride.distance;
        document.getElementById('detail-taxi-type').textContent = ride.taxiType;
        document.getElementById('detail-datetime').textContent = ride.datetime;
        
        document.getElementById('detail-base-fare').textContent = ride.details.baseFare;
        document.getElementById('detail-distance-fare').textContent = ride.details.distanceFare;
        document.getElementById('detail-time-fare').textContent = ride.details.timeFare;
        document.getElementById('detail-adjustments').textContent = ride.details.adjustments;
        document.getElementById('detail-total-fare').textContent = ride.details.totalFare;
        
        document.getElementById('detail-traffic').textContent = ride.details.traffic;
        document.getElementById('detail-weather').textContent = ride.details.weather;
        document.getElementById('detail-time').textContent = ride.details.time;
        document.getElementById('detail-demand').textContent = ride.details.demand;

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('rideDetailsModal'));
        modal.show();
    };

    // Initialize everything
    populateRideHistory();
}); 