// Data Storage
let users = JSON.parse(sessionStorage.getItem('users')) || [];
let currentUser = JSON.parse(sessionStorage.getItem('currentUser')) || null;
let drivers = JSON.parse(sessionStorage.getItem('drivers')) || [];
let bookings = JSON.parse(sessionStorage.getItem('bookings')) || [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    createDemoData();
    updateUIBasedOnLogin();
    
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    const dateInputs = document.querySelectorAll('input[type="date"]');
    dateInputs.forEach(input => {
        if (input) input.min = today;
    });
});

// Initialize page
function initializePage() {
    if (currentUser) {
        showBookingSection();
        loadUserBookings();
    }
}

// Toggle auth dropdown
function toggleAuthDropdown() {
    const dropdown = document.getElementById('authDropdown');
    dropdown.classList.toggle('active');
}

// Close dropdown when clicking outside
document.addEventListener('click', function(e) {
    const dropdown = document.getElementById('authDropdown');
    const authBtn = document.getElementById('authBtn');
    if (!authBtn.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.remove('active');
    }
});

// Update UI based on login status
function updateUIBasedOnLogin() {
    const userInfo = document.getElementById('userInfo');
    const loginLink = document.getElementById('loginLink');
    const signupLink = document.getElementById('signupLink');
    const logoutLink = document.getElementById('logoutLink');
    const userName = document.getElementById('userName');
    const userType = document.getElementById('userType');
    
    if (currentUser) {
        userInfo.style.display = 'flex';
        userName.textContent = currentUser.name;
        userType.textContent = currentUser.type.charAt(0).toUpperCase() + currentUser.type.slice(1);
        loginLink.style.display = 'none';
        signupLink.style.display = 'none';
        logoutLink.style.display = 'block';
    } else {
        userInfo.style.display = 'none';
        loginLink.style.display = 'block';
        signupLink.style.display = 'block';
        logoutLink.style.display = 'none';
    }
}

// Modal functions
function openLoginModal() {
    document.getElementById('loginModal').classList.add('active');
    document.getElementById('authDropdown').classList.remove('active');
}

function openSignupModal() {
    document.getElementById('signupModal').classList.add('active');
    document.getElementById('authDropdown').classList.remove('active');
}

function openDriverSignup() {
    document.getElementById('signupModal').classList.add('active');
    document.getElementById('signupUserType').value = 'driver';
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function switchToSignup() {
    closeModal('loginModal');
    openSignupModal();
}

function switchToLogin() {
    closeModal('signupModal');
    openLoginModal();
}

// Handle Login
function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const userType = document.getElementById('loginUserType').value;
    
    const user = users.find(u => 
        u.email === email && 
        u.password === password && 
        u.type === userType
    );
    
    if (user) {
        currentUser = user;
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
        closeModal('loginModal');
        updateUIBasedOnLogin();
        showBookingSection();
        alert('Login successful! Welcome back, ' + currentUser.name);
        document.getElementById('loginForm').reset();
    } else {
        alert('Invalid credentials or user type. Please try again.');
    }
}

// Handle Signup
function handleSignup(event) {
    event.preventDefault();
    
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const userType = document.getElementById('signupUserType').value;
    
    if (users.find(u => u.email === email)) {
        alert('Email already registered! Please login instead.');
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
    
    alert('Account created successfully! Please login to continue.');
    document.getElementById('signupForm').reset();
    closeModal('signupModal');
    openLoginModal();
}

// Logout
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        currentUser = null;
        sessionStorage.removeItem('currentUser');
        updateUIBasedOnLogin();
        document.getElementById('bookingSection').style.display = 'none';
        alert('Logged out successfully!');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// Show booking section based on user type
function showBookingSection() {
    const bookingSection = document.getElementById('bookingSection');
    const passengerBooking = document.getElementById('passengerBooking');
    const driverBooking = document.getElementById('driverBooking');
    
    if (currentUser) {
        bookingSection.style.display = 'block';
        
        if (currentUser.type === 'passenger') {
            passengerBooking.style.display = 'block';
            driverBooking.style.display = 'none';
            loadUserBookings();
        } else if (currentUser.type === 'driver') {
            driverBooking.style.display = 'block';
            passengerBooking.style.display = 'none';
            loadDriverRoutes();
            loadDriverBookings();
        }
        
        // Scroll to booking section
        setTimeout(() => {
            bookingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
    }
}

// Search rides from hero section
function searchRidesFromHero() {
    const from = document.getElementById('heroFromLocation').value;
    const to = document.getElementById('heroToLocation').value;
    const date = document.getElementById('heroTravelDate').value;
    const passengers = document.getElementById('heroPassengerCount').value;
    
    if (!from || !to || !date) {
        alert('Please fill all search fields');
        return;
    }
    
    if (!currentUser) {
        alert('Please login to search and book rides');
        openLoginModal();
        return;
    }
    
    if (currentUser.type !== 'passenger') {
        alert('Only passengers can search for rides. Please login with a passenger account.');
        return;
    }
    
    // Fill the booking form
    document.getElementById('bookingFrom').value = from;
    document.getElementById('bookingTo').value = to;
    document.getElementById('bookingDate').value = date;
    document.getElementById('bookingPassengers').value = passengers;
    
    // Show booking section and search
    showBookingSection();
    setTimeout(() => {
        searchAvailableRides();
    }, 500);
}

// Search available rides
function searchAvailableRides() {
    if (!currentUser) {
        alert('Please login to search rides');
        openLoginModal();
        return;
    }
    
    const from = document.getElementById('bookingFrom').value;
    const to = document.getElementById('bookingTo').value;
    const date = document.getElementById('bookingDate').value;
    const passengers = parseInt(document.getElementById('bookingPassengers').value);
    
    if (!from || !to || !date) {
        alert('Please fill all search fields');
        return;
    }
    
    const matchedRides = drivers.filter(driver => 
        driver.from.toLowerCase().includes(from.toLowerCase()) &&
        driver.to.toLowerCase().includes(to.toLowerCase()) &&
        driver.date === date &&
        driver.availableSeats >= passengers &&
        driver.status === 'active'
    );
    
    displaySearchResults(matchedRides, passengers);
}

// Display search results
function displaySearchResults(rides, passengers) {
    const resultsSection = document.getElementById('ridesResults');
    
    if (rides.length === 0) {
        resultsSection.innerHTML = `
            <div class="ride-card">
                <p style="text-align: center; color: #666; padding: 20px;">
                    <i class="fas fa-search" style="font-size: 48px; color: #ccc; margin-bottom: 15px;"></i><br>
                    No rides found matching your search criteria.<br>
                    Try adjusting your search or check back later.
                </p>
            </div>
        `;
        return;
    }
    
    resultsSection.innerHTML = `
        <h3 style="margin-bottom: 20px; color: #00838f;">
            <i class="fas fa-car"></i> Available Rides (${rides.length})
        </h3>
        ${rides.map(ride => `
            <div class="ride-card">
                <div class="ride-header">
                    <h4>${ride.name} - ${ride.vehicle}</h4>
                    <span class="status-badge">
                        <i class="fas fa-circle" style="font-size: 8px;"></i> Available
                    </span>
                </div>
                <div class="ride-info">
                    <div class="info-item">
                        <i class="fas fa-route"></i>
                        <span><strong>${ride.from}</strong> → <strong>${ride.to}</strong></span>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-calendar"></i>
                        <span>${formatDate(ride.date)}</span>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-clock"></i>
                        <span>${ride.time}</span>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-chair"></i>
                        <span>${ride.availableSeats} seats available</span>
                    </div>
                </div>
                <div class="price-info">
                    ₹${ride.fare} per person | Total: ₹${ride.fare * passengers} for ${passengers} passenger${passengers > 1 ? 's' : ''}
                </div>
                <button class="book-now-btn" onclick="bookRide('${ride.id}', ${passengers})">
                    <i class="fas fa-check-circle"></i> Book Now
                </button>
            </div>
        `).join('')}
    `;
}

// Book a ride
function bookRide(rideId, passengers) {
    if (!currentUser) {
        alert('Please login to book a ride');
        openLoginModal();
        return;
    }
    
    const ride = drivers.find(d => d.id === rideId);
    
    if (!ride || ride.availableSeats < passengers) {
        alert('Sorry, this ride is no longer available or doesn\'t have enough seats.');
        searchAvailableRides();
        return;
    }
    
    const totalFare = ride.fare * passengers;
    
    if (confirm(`Confirm booking?\n\nRide: ${ride.from} → ${ride.to}\nDriver: ${ride.name}\nSeats: ${passengers}\nTotal Fare: ₹${totalFare}`)) {
        const booking = {
            id: Date.now().toString(),
            passengerId: currentUser.id,
            passengerName: currentUser.name,
            driverId: ride.driverId,
            rideId: ride.id,
            driverName: ride.name,
            vehicle: ride.vehicle,
            from: ride.from,
            to: ride.to,
            date: ride.date,
            time: ride.time,
            seats: passengers,
            fare: totalFare,
            status: 'confirmed',
            bookingDate: new Date().toISOString()
        };
        
        bookings.push(booking);
        ride.availableSeats -= passengers;
        
        if (ride.availableSeats === 0) {
            ride.status = 'full';
        }
        
        saveData();
        
        alert(`🎉 Booking Confirmed!\n\nBooking ID: ${booking.id}\nTotal Amount: ₹${totalFare}\n\nThank you for choosing Quick Safar!`);
        
        loadUserBookings();
        searchAvailableRides();
    }
}

// Publish ride (for drivers)
function publishRide() {
    if (!currentUser) {
        alert('Please login to publish a ride');
        openLoginModal();
        return;
    }
    
    if (currentUser.type !== 'driver') {
        alert('Only drivers can publish rides');
        return;
    }
    
    const name = document.getElementById('driverName').value;
    const vehicle = document.getElementById('vehicleNumber').value;
    const from = document.getElementById('driverFrom').value;
    const to = document.getElementById('driverTo').value;
    const date = document.getElementById('driverDate').value;
    const time = document.getElementById('departureTime').value;
    const seats = parseInt(document.getElementById('availableSeats').value);
    const fare = parseInt(document.getElementById('fareAmount').value);
    
    if (!name || !vehicle || !from || !to || !date || !time || !fare) {
        alert('Please fill all fields');
        return;
    }
    
    const newRide = {
        id: Date.now().toString(),
        driverId: currentUser.id,
        name: name,
        vehicle: vehicle,
        from: from,
        to: to,
        date: date,
        time: time,
        availableSeats: seats,
        totalSeats: seats,
        fare: fare,
        status: 'active'
    };
    
    drivers.push(newRide);
    saveData();
    
    alert('🚗 Ride published successfully!\n\nYour ride is now visible to passengers.');
    
    // Clear form
    document.getElementById('driverName').value = '';
    document.getElementById('vehicleNumber').value = '';
    document.getElementById('driverFrom').value = '';
    document.getElementById('driverTo').value = '';
    document.getElementById('driverDate').value = '';
    document.getElementById('departureTime').value = '';
    document.getElementById('availableSeats').value = '4';
    document.getElementById('fareAmount').value = '200';
    
    loadDriverRoutes();
}

// Load user bookings (for passengers)
function loadUserBookings() {
    if (!currentUser || currentUser.type !== 'passenger') return;
    
    const userBookings = bookings
        .filter(b => b.passengerId === currentUser.id)
        .sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate));
    
    const listElement = document.getElementById('passengerBookingsList');
    
    if (userBookings.length === 0) {
        listElement.innerHTML = `
            <p style="text-align: center; color: #999; padding: 30px;">
                <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 15px;"></i><br>
                No bookings yet. Search and book your first ride!
            </p>
        `;
        return;
    }
    
    listElement.innerHTML = userBookings.map(booking => `
        <div class="ride-card">
            <div class="ride-header">
                <h4>${booking.from} → ${booking.to}</h4>
                <span class="status-badge" style="background: #c8e6c9; color: #2e7d32;">
                    ${booking.status}
                </span>
            </div>
            <div class="ride-info">
                <div class="info-item">
                    <i class="fas fa-user"></i>
                    <span>Driver: ${booking.driverName}</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-car"></i>
                    <span>${booking.vehicle}</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-calendar"></i>
                    <span>${formatDate(booking.date)}</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-clock"></i>
                    <span>${booking.time}</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-chair"></i>
                    <span>${booking.seats} seat${booking.seats > 1 ? 's' : ''}</span>
                </div>
            </div>
            <div class="price-info" style="font-size: 20px;">
                Total Paid: ₹${booking.fare}
            </div>
            <p style="color: #999; font-size: 13px; margin-top: 10px;">
                <i class="fas fa-info-circle"></i> Booked on ${formatDateTime(booking.bookingDate)}
            </p>
        </div>
    `).join('');
}

// Load driver routes
function loadDriverRoutes() {
    if (!currentUser || currentUser.type !== 'driver') return;
    
    const driverRoutes = drivers
        .filter(d => d.driverId === currentUser.id && d.status === 'active')
        .sort((a, b) => new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time));
    
    const listElement = document.getElementById('driverRoutesList');
    
    if (driverRoutes.length === 0) {
        listElement.innerHTML = `
            <p style="text-align: center; color: #999; padding: 30px;">
                <i class="fas fa-road" style="font-size: 48px; margin-bottom: 15px;"></i><br>
                No active routes. Publish your first ride above!
            </p>
        `;
        return;
    }
    
    listElement.innerHTML = driverRoutes.map(route => `
        <div class="ride-card">
            <div class="ride-header">
                <h4>${route.from} → ${route.to}</h4>
                <span class="status-badge" style="background: ${route.availableSeats > 0 ? '#c8e6c9' : '#ffccbc'}; color: ${route.availableSeats > 0 ? '#2e7d32' : '#d84315'};">
                    ${route.availableSeats} / ${route.totalSeats} seats
                </span>
            </div>
            <div class="ride-info">
                <div class="info-item">
                    <i class="fas fa-car"></i>
                    <span>${route.vehicle}</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-calendar"></i>
                    <span>${formatDate(route.date)}</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-clock"></i>
                    <span>${route.time}</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-rupee-sign"></i>
                    <span>₹${route.fare} per seat</span>
                </div>
            </div>
            <div class="price-info" style="font-size: 18px;">
                Potential Earnings: ₹${route.fare * (route.totalSeats - route.availableSeats)}
            </div>
        </div>
    `).join('');
}

// Load driver bookings
function loadDriverBookings() {
    if (!currentUser || currentUser.type !== 'driver') return;
    
    const driverRouteIds = drivers
        .filter(d => d.driverId === currentUser.id)
        .map(d => d.id);
    
    const driverBookings = bookings
        .filter(b => driverRouteIds.includes(b.rideId))
        .sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate));
    
    const listElement = document.getElementById('driverBookingsList');
    
    if (driverBookings.length === 0) {
        listElement.innerHTML = `
            <p style="text-align: center; color: #999; padding: 30px;">
                <i class="fas fa-users" style="font-size: 48px; margin-bottom: 15px;"></i><br>
                No passenger bookings yet. Wait for passengers to book your rides!
            </p>
        `;
        return;
    }
    
    listElement.innerHTML = driverBookings.map(booking => `
        <div class="ride-card">
            <div class="ride-header">
                <h4>${booking.from} → ${booking.to}</h4>
                <span class="status-badge" style="background: #c8e6c9; color: #2e7d32;">
                    ${booking.status}
                </span>
            </div>
            <div class="ride-info">
                <div class="info-item">
                    <i class="fas fa-user"></i>
                    <span>Passenger: ${booking.passengerName}</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-calendar"></i>
                    <span>${formatDate(booking.date)}</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-clock"></i>
                    <span>${booking.time}</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-chair"></i>
                    <span>${booking.seats} seat${booking.seats > 1 ? 's' : ''}</span>
                </div>
            </div>
            <div class="price-info" style="font-size: 20px; color: #00897b;">
                Your Earnings: ₹${booking.fare}
            </div>
            <p style="color: #999; font-size: 13px; margin-top: 10px;">
                <i class="fas fa-info-circle"></i> Booked on ${formatDateTime(booking.bookingDate)}
            </p>
        </div>
    `).join('');
}

// Save data to session storage
function saveData() {
    sessionStorage.setItem('drivers', JSON.stringify(drivers));
    sessionStorage.setItem('bookings', JSON.stringify(bookings));
}

// Format date
function formatDate(dateStr) {
    const date = new Date(dateStr);
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-IN', options);
}

// Format date and time
function formatDateTime(dateStr) {
    const date = new Date(dateStr);
    const options = { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleString('en-IN', options);
}

// Create demo data
function createDemoData() {
    if (!sessionStorage.getItem('demoDataCreated')) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        
        drivers = [
            {
                id: 'demo1',
                driverId: 'demo-driver-1',
                name: 'Rajesh Kumar',
                vehicle: 'DL-01-AB-1234',
                from: 'Delhi',
                to: 'Noida',
                date: tomorrowStr,
                time: '08:00',
                availableSeats: 3,
                totalSeats: 4,
                fare: 150,
                status: 'active'
            },
            {
                id: 'demo2',
                driverId: 'demo-driver-2',
                name: 'Amit Singh',
                vehicle: 'UP-16-XY-5678',
                from: 'Delhi',
                to: 'Gurgaon',
                date: tomorrowStr,
                time: '09:30',
                availableSeats: 4,
                totalSeats: 6,
                fare: 200,
                status: 'active'
            },
            {
                id: 'demo3',
                driverId: 'demo-driver-3',
                name: 'Priya Sharma',
                vehicle: 'DL-03-CD-9012',
                from: 'Gurgaon',
                to: 'Delhi',
                date: tomorrowStr,
                time: '18:00',
                availableSeats: 2,
                totalSeats: 4,
                fare: 180,
                status: 'active'
            }
        ];
        
        saveData();
        sessionStorage.setItem('demoDataCreated', 'true');
    }
}
