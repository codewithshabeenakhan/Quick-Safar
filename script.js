// Data Storage
let passengers = JSON.parse(localStorage.getItem('passengers')) || [];
let drivers = JSON.parse(localStorage.getItem('drivers')) || [];
let bookings = JSON.parse(localStorage.getItem('bookings')) || [];

// DOM Elements
const passengerBtn = document.getElementById('passengerBtn');
const driverBtn = document.getElementById('driverBtn');
const passengerSection = document.getElementById('passengerSection');
const driverSection = document.getElementById('driverSection');
const passengerCount = document.getElementById('passengerCount');
const seatDisplay = document.getElementById('seatDisplay');
const searchRidesBtn = document.getElementById('searchRides');
const availableRides = document.getElementById('availableRides');
const addRouteBtn = document.getElementById('addRoute');
const activeRoutes = document.getElementById('activeRoutes');
const passengerBookings = document.getElementById('passengerBookings');
const driverBookings = document.getElementById('driverBookings');

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    updateSeatDisplay();
    loadDriverRoutes();
    loadPassengerBookings();
    loadDriverBookings();
    
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('travelDate').min = today;
    document.getElementById('driverDate').min = today;
});

// User Type Switching
passengerBtn.addEventListener('click', () => {
    passengerBtn.classList.add('active');
    driverBtn.classList.remove('active');
    passengerSection.classList.add('active-section');
    driverSection.classList.remove('active-section');
});

driverBtn.addEventListener('click', () => {
    driverBtn.classList.add('active');
    passengerBtn.classList.remove('active');
    driverSection.classList.add('active-section');
    passengerSection.classList.remove('active-section');
});

// Passenger Count Selector
document.querySelectorAll('.count-btn').forEach(button => {
    button.addEventListener('click', function() {
        const isDriver = this.getAttribute('data-for') === 'driver';
        const input = isDriver ? 
            document.getElementById('availableSeats') : 
            document.getElementById('passengerCount');
        
        let currentValue = parseInt(input.value);
        const change = parseInt(this.getAttribute('data-change'));
        const newValue = currentValue + change;
        
        if (newValue >= 1 && newValue <= 8) {
            input.value = newValue;
            if (!isDriver) {
                updateSeatDisplay();
            }
        }
    });
});

// Update Seat Display
function updateSeatDisplay() {
    const count = parseInt(passengerCount.value);
    seatDisplay.innerHTML = '';
    
    for (let i = 1; i <= 8; i++) {
        const seat = document.createElement('div');
        seat.className = `seat ${i <= count ? 'selected' : 'available'}`;
        seat.textContent = i;
        seat.title = i <= count ? 'Selected seat' : 'Available seat';
        seatDisplay.appendChild(seat);
    }
}

// Passenger: Search for Rides
searchRidesBtn.addEventListener('click', function() {
    const from = document.getElementById('fromLocation').value;
    const to = document.getElementById('toLocation').value;
    const date = document.getElementById('travelDate').value;
    const seats = parseInt(passengerCount.value);
    
    if (!from || !to || !date) {
        alert('Please fill all fields');
        return;
    }
    
    // Find matching drivers
    const matchedDrivers = drivers.filter(driver => 
        driver.from.toLowerCase().includes(from.toLowerCase()) &&
        driver.to.toLowerCase().includes(to.toLowerCase()) &&
        driver.date === date &&
        driver.availableSeats >= seats &&
        driver.availableSeats > 0
    );
    
    displayAvailableRides(matchedDrivers, seats);
});

// Display Available Rides
function displayAvailableRides(driversList, requiredSeats) {
    if (driversList.length === 0) {
        availableRides.innerHTML = `
            <div class="ride-card">
                <p>No rides available for your search. Please try different criteria.</p>
            </div>
        `;
        return;
    }
    
    availableRides.innerHTML = driversList.map(driver => `
        <div class="ride-card" data-driver-id="${driver.id}">
            <div class="ride-header">
                <h4>${driver.name} - ${driver.vehicle}</h4>
                <span class="status confirmed">Available</span>
            </div>
            <div class="ride-info">
                <div class="info-item">
                    <i class="fas fa-route"></i>
                    <span>${driver.from} → ${driver.to}</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-calendar"></i>
                    <span>${driver.date}</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-clock"></i>
                    <span>${driver.time}</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-chair"></i>
                    <span>${driver.availableSeats} seats left</span>
                </div>
            </div>
            <div class="ride-price">₹${driver.fare} per person</div>
            <div class="ride-price">Total: ₹${driver.fare * requiredSeats} (${requiredSeats} persons)</div>
            <button class="book-btn" onclick="bookRide('${driver.id}', ${requiredSeats})">
                <i class="fas fa-check"></i> Book Now
            </button>
        </div>
    `).join('');
}

// Book a Ride
function bookRide(driverId, seats) {
    const passengerName = prompt("Enter your name:");
    if (!passengerName) return;
    
    const driver = drivers.find(d => d.id === driverId);
    if (!driver || driver.availableSeats < seats) {
        alert('Sorry, seats are no longer available');
        return;
    }
    
    const booking = {
        id: Date.now().toString(),
        passengerName: passengerName,
        driverId: driverId,
        driverName: driver.name,
        from: driver.from,
        to: driver.to,
        date: driver.date,
        time: driver.time,
        seats: seats,
        fare: driver.fare * seats,
        status: 'confirmed',
        bookingDate: new Date().toISOString()
    };
    
    bookings.push(booking);
    driver.availableSeats -= seats;
    
    if (driver.availableSeats === 0) {
        driver.status = 'full';
    }
    
    saveData();
    alert(`Booking confirmed! Total fare: ₹${booking.fare}`);
    
    loadPassengerBookings();
    loadDriverRoutes();
    loadDriverBookings();
}

// Driver: Add Route
addRouteBtn.addEventListener('click', function() {
    const driverName = document.getElementById('driverName').value;
    const vehicle = document.getElementById('vehicleNumber').value;
    const from = document.getElementById('driverFrom').value;
    const to = document.getElementById('driverTo').value;
    const seats = parseInt(document.getElementById('availableSeats').value);
    const date = document.getElementById('driverDate').value;
    const fare = parseInt(document.getElementById('farePerPerson').value);
    const time = document.getElementById('departureTime').value;
    
    if (!driverName || !vehicle || !from || !to || !date || !time) {
        alert('Please fill all fields');
        return;
    }
    
    const route = {
        id: Date.now().toString(),
        name: driverName,
        vehicle: vehicle,
        from: from,
        to: to,
        availableSeats: seats,
        totalSeats: seats,
        date: date,
        time: time,
        fare: fare,
        status: 'active'
    };
    
    drivers.push(route);
    saveData();
    loadDriverRoutes();
    
    // Clear form
    document.getElementById('driverName').value = '';
    document.getElementById('vehicleNumber').value = '';
    document.getElementById('driverFrom').value = '';
    document.getElementById('driverTo').value = '';
    document.getElementById('farePerPerson').value = '200';
    
    alert('Route added successfully!');
});

// Load Driver Routes
function loadDriverRoutes() {
    const driverRoutes = drivers.filter(d => d.status === 'active');
    
    if (driverRoutes.length === 0) {
        activeRoutes.innerHTML = '<p>No active routes. Add a new route above.</p>';
        return;
    }
    
    activeRoutes.innerHTML = driverRoutes.map(route => `
        <div class="route-card">
            <div class="ride-header">
                <h4>${route.name} - ${route.vehicle}</h4>
                <span class="status ${route.availableSeats > 0 ? 'confirmed' : 'pending'}">
                    ${route.availableSeats} seats available
                </span>
            </div>
            <div class="ride-info">
                <div class="info-item">
                    <i class="fas fa-route"></i>
                    <span>${route.from} → ${route.to}</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-calendar"></i>
                    <span>${route.date}</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-clock"></i>
                    <span>${route.time}</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-money-bill-wave"></i>
                    <span>₹${route.fare} per person</span>
                </div>
            </div>
            <div class="ride-price">Total capacity: ${route.totalSeats} seats</div>
            <button class="book-btn" onclick="editRoute('${route.id}')" style="background: #f59e0b;">
                <i class="fas fa-edit"></i> Edit Route
            </button>
        </div>
    `).join('');
}

// Load Passenger Bookings
function loadPassengerBookings() {
    const passengerBookingsList = bookings.slice(-5).reverse(); // Show last 5 bookings
    
    if (passengerBookingsList.length === 0) {
        passengerBookings.innerHTML = '<p>No bookings yet.</p>';
        return;
    }
    
    passengerBookings.innerHTML = passengerBookingsList.map(booking => `
        <div class="booking-card">
            <div class="booking-header">
                <h4>${booking.from} → ${booking.to}</h4>
                <span class="status ${booking.status}">${booking.status}</span>
            </div>
            <div class="ride-info">
                <div class="info-item">
                    <i class="fas fa-user"></i>
                    <span>Driver: ${booking.driverName}</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-calendar"></i>
                    <span>${booking.date}</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-clock"></i>
                    <span>${booking.time}</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-chair"></i>
                    <span>${booking.seats} seats</span>
                </div>
            </div>
            <div class="ride-price">Total Paid: ₹${booking.fare}</div>
        </div>
    `).join('');
}

// Load Driver Bookings
function loadDriverBookings() {
    const driverBookingsList = bookings.slice(-10).reverse(); // Show last 10 bookings
    
    if (driverBookingsList.length === 0) {
        driverBookings.innerHTML = '<p>No passenger bookings yet.</p>';
        return;
    }
    
    driverBookings.innerHTML = driverBookingsList.map(booking => `
        <div class="booking-card">
            <div class="booking-header">
                <h4>${booking.from} → ${booking.to}</h4>
                <span class="status ${booking.status}">${booking.status}</span>
            </div>
            <div class="ride-info">
                <div class="info-item">
                    <i class="fas fa-user"></i>
                    <span>Passenger: ${booking.passengerName}</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-calendar"></i>
                    <span>${booking.date}</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-chair"></i>
                    <span>${booking.seats} seats</span>
                </div>
            </div>
            <div class="ride-price">Earnings: ₹${booking.fare}</div>
        </div>
    `).join('');
}

// Edit Route (for driver)
function editRoute(routeId) {
    const route = drivers.find(d => d.id === routeId);
    if (!route) return;
    
    const newFare = prompt(`Enter new fare per person (current: ₹${route.fare}):`, route.fare);
    if (newFare && !isNaN(newFare)) {
        route.fare = parseInt(newFare);
        saveData();
        loadDriverRoutes();
        alert('Fare updated successfully!');
    }
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('drivers', JSON.stringify(drivers));
    localStorage.setItem('bookings', JSON.stringify(bookings));
}

// Demo data (for first time users)
if (drivers.length === 0) {
    drivers = [
        {
            id: '1',
            name: 'Rajesh Kumar',
            vehicle: 'DL-1234',
            from: 'Delhi',
            to: 'Noida',
            availableSeats: 4,
            totalSeats: 4,
            date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
            time: '08:00',
            fare: 150,
            status: 'active'
        },
        {
            id: '2',
            name: 'Amit Singh',
            vehicle: 'UP-5678',
            from: 'Delhi',
            to: 'Gurgaon',
            availableSeats: 6,
            totalSeats: 6,
            date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
            time: '09:30',
            fare: 200,
            status: 'active'
        }
    ];
    saveData();
}
