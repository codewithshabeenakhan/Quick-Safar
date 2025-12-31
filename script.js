// Data Storage
let users = JSON.parse(sessionStorage.getItem('users')) || [];
let currentUser = JSON.parse(sessionStorage.getItem('currentUser')) || null;
let drivers = [];
let bookings = [];

// DOM Elements
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const loginModal = document.getElementById('loginModal');
const closeModal = document.querySelector('.close');
const tabBtns = document.querySelectorAll('.tab-btn');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
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
const userInfoDisplay = document.getElementById('userInfoDisplay');
const displayUserName = document.getElementById('displayUserName');
const displayUserType = document.getElementById('displayUserType');

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadUserSession();
    updateSeatDisplay();
    
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('travelDate').min = today;
    document.getElementById('driverDate').min = today;

    // Create demo data
    if (!sessionStorage.getItem('demoDataLoaded')) {
        createDemoData();
        sessionStorage.setItem('demoDataLoaded', 'true');
    }
    
    loadData();
    loadDriverRoutes();
    loadPassengerBookings();
    loadDriverBookings();
});

// Load user session
function loadUserSession() {
    if (currentUser) {
        loginBtn.classList.add('hidden');
        logoutBtn.classList.remove('hidden');
        userInfoDisplay.classList.remove('hidden');
        displayUserName.textContent = currentUser.name;
        displayUserType.textContent = `(${currentUser.type})`;
    }
}

// Modal Controls
loginBtn.addEventListener('click', () => {
    loginModal.style.display = 'block';
});

logoutBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to logout?')) {
        currentUser = null;
        sessionStorage.removeItem('currentUser');
        loginBtn.classList.remove('hidden');
        logoutBtn.classList.add('hidden');
        userInfoDisplay.classList.add('hidden');
        alert('Logged out successfully!');
    }
});

closeModal.addEventListener('click', () => {
    loginModal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === loginModal) {
        loginModal.style.display = 'none';
    }
});

// Tab switching
tabBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        tabBtns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        
        const tab = this.getAttribute('data-tab');
        if (tab === 'login') {
            loginForm.classList.add('active');
            signupForm.classList.remove('active');
        } else {
            signupForm.classList.add('active');
            loginForm.classList.remove('active');
        }
    });
});

// Login Form
loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const userType = document.getElementById('loginUserType').value;
    
    const user = users.find(u => u.email === email && u.password === password && u.type === userType);
    
    if (user) {
        currentUser = user;
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
        loginModal.style.display = 'none';
        loadUserSession();
        alert('Login successful!');
        loginForm.reset();
    } else {
        alert('Invalid credentials or user type!');
    }
});

// Signup Form
signupForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const userType = document.getElementById('signupUserType').value;
    
    if (users.find(u => u.email === email)) {
        alert('Email already registered!');
        return;
    }
    
    const newUser = {
        id: Date.now().toString(),
        name: name,
        email: email,
        password: password,
        type: userType
    };
    
    users.push(newUser);
    sessionStorage.setItem('users', JSON.stringify(users));
    alert('Signup successful! Please login.');
    signupForm.reset();
    
    // Switch to login tab
    tabBtns[0].click();
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

// Check login before action
function checkLogin() {
    if (!currentUser) {
        alert('Please login first!');
        loginModal.style.display = 'block';
        return false;
    }
    return true;
}

// Passenger: Search for Rides
searchRidesBtn.addEventListener('click', function() {
    if (!checkLogin()) return;
    
    const from = document.getElementById('fromLocation').value;
    const to = document.getElementById('toLocation').value;
    const date = document.getElementById('travelDate').value;
    const seats = parseInt(passengerCount.value);
    
    if (!from || !to || !date) {
        alert('Please fill all fields');
        return;
    }
    
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
    if (!checkLogin()) return;
    
    const driver = drivers.find(d => d.id === driverId);
    if (!driver || driver.availableSeats < seats) {
        alert('Sorry, seats are no longer available');
        return;
    }
    
    const booking = {
        id: Date.now().toString(),
        passengerName: currentUser.name,
        passengerId: currentUser.id,
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
    if (!checkLogin()) return;
    if (currentUser.type !== 'driver') {
        alert('Only drivers can add routes!');
        return;
    }
    
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
        driverId: currentUser.id,
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
        </div>
    `).join('');
}

// Load Passenger Bookings
function loadPassengerBookings() {
    if (!currentUser) {
        passengerBookings.innerHTML = '<p>Please login to view bookings.</p>';
        return;
    }
    
    const userBookings = bookings.filter(b => b.passengerId === currentUser.id).slice(-5).reverse();
    
    if (userBookings.length === 0) {
        passengerBookings.innerHTML = '<p>No bookings yet.</p>';
        return;
    }
    
    passengerBookings.innerHTML = userBookings.map(booking => `
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
    if (!currentUser) {
        driverBookings.innerHTML = '<p>Please login to view bookings.</p>';
        return;
    }
    
    const driverRouteIds = drivers.filter(d => d.driverId === currentUser.id).map(d => d.id);
    const driverBookingsList = bookings.filter(b => driverRouteIds.includes(b.driverId)).slice(-10).reverse();
    
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

// Save data
function saveData() {
    sessionStorage.setItem('drivers', JSON.stringify(drivers));
    sessionStorage.setItem('bookings', JSON.stringify(bookings));
}

// Load data
function loadData() {
    drivers = JSON.parse(sessionStorage.getItem('drivers')) || [];
    bookings = JSON.parse(sessionStorage.getItem('bookings')) || [];
}

// Create demo data
function createDemoData() {
    drivers = [
        {
            id: '1',
            driverId: 'demo1',
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
            driverId: 'demo2',
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
