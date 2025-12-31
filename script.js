// Data Storage
let users = JSON.parse(localStorage.getItem('quickSafarUsers')) || [];
let currentUser = JSON.parse(localStorage.getItem('quickSafarCurrentUser')) || null;
let rides = JSON.parse(localStorage.getItem('quickSafarRides')) || [];
let bookings = JSON.parse(localStorage.getItem('quickSafarBookings')) || [];
let locationSuggestions = [];

// DOM Elements
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const mobileLoginBtn = document.getElementById('mobileLoginBtn');
const mobileSignupBtn = document.getElementById('mobileSignupBtn');
const logoutBtn = document.getElementById('logoutBtn');
const authModal = document.getElementById('authModal');
const closeModal = document.querySelector('.close');
const tabBtns = document.querySelectorAll('.tab-btn');
const loginForm = document.getElementById('loginForm');
const passengerSignupForm = document.getElementById('passengerSignupForm');
const driverSignupForm = document.getElementById('driverSignupForm');
const userProfile = document.getElementById('userProfile');
const userName = document.getElementById('userName');
const userType = document.getElementById('userType');
const authButtons = document.querySelector('.auth-buttons');
const searchRidesBtn = document.getElementById('searchRidesBtn');
const fromLocation = document.getElementById('fromLocation');
const toLocation = document.getElementById('toLocation');
const travelDate = document.getElementById('travelDate');
const passengerCount = document.getElementById('passengerCount');
const availableRides = document.getElementById('availableRides');
const bookingSection = document.getElementById('bookingSection');
const bookingForm = document.getElementById('bookingForm');
const driverDashboard = document.getElementById('driverDashboard');
const publishRideForm = document.getElementById('publishRideForm');
const publishedRides = document.getElementById('publishedRides');
const offerRideBtn = document.getElementById('offerRideBtn');
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const mobileMenu = document.querySelector('.mobile-menu');
const ridesTitle = document.getElementById('ridesTitle');

// Indian Cities for Auto-suggestions
const indianCities = [
    "Delhi", "Mumbai", "Bangalore", "Hyderabad", "Chennai", "Kolkata",
    "Pune", "Ahmedabad", "Jaipur", "Lucknow", "Chandigarh", "Dehradun",
    "Noida", "Gurgaon", "Faridabad", "Ghaziabad", "Meerut", "Agra",
    "Varanasi", "Patna", "Ranchi", "Bhubaneswar", "Guwahati", "Shillong",
    "Imphal", "Kohima", "Aizawl", "Itanagar", "Dispur", "Gangtok",
    "Siliguri", "Darjeeling", "Kalimpong", "Kurseong", "Mirik"
];

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadUserSession();
    setupEventListeners();
    setupLocationSuggestions();
    loadDemoData();
    
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('travelDate').min = today;
    document.getElementById('rideDate').min = today;
    
    // Load initial data
    updateUIForUser();
    loadAvailableRides();
    loadDriverDashboard();
});

// Setup Event Listeners
function setupEventListeners() {
    // Auth buttons
    loginBtn?.addEventListener('click', () => showAuthModal('login'));
    signupBtn?.addEventListener('click', () => showAuthModal('signup-passenger'));
    mobileLoginBtn?.addEventListener('click', () => showAuthModal('login'));
    mobileSignupBtn?.addEventListener('click', () => showAuthModal('signup-passenger'));
    
    logoutBtn?.addEventListener('click', handleLogout);
    closeModal?.addEventListener('click', () => authModal.style.display = 'none');
    
    // Modal close on outside click
    window.addEventListener('click', (e) => {
        if (e.target === authModal) {
            authModal.style.display = 'none';
        }
    });
    
    // Tab switching
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.getAttribute('data-tab');
            switchTab(tab);
        });
    });
    
    // Switch between login and signup
    document.querySelectorAll('.switch-to-signup').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            showAuthModal('signup-passenger');
        });
    });
    
    document.querySelectorAll('.switch-to-login').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            showAuthModal('login');
        });
    });
    
    // Passenger count buttons
    document.querySelectorAll('.passenger-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const isMinus = this.classList.contains('minus');
            let count = parseInt(passengerCount.textContent);
            count = isMinus ? Math.max(1, count - 1) : Math.min(8, count + 1);
            passengerCount.textContent = count;
        });
    });
    
    // Search rides
    searchRidesBtn?.addEventListener('click', handleSearchRides);
    
    // Offer ride button
    offerRideBtn?.addEventListener('click', () => {
        if (!currentUser) {
            showAuthModal('signup-driver');
        } else if (currentUser.type !== 'driver') {
            alert('Please sign up as a driver to offer rides');
            showAuthModal('signup-driver');
        } else {
            driverDashboard.classList.remove('hidden');
            driverDashboard.scrollIntoView({ behavior: 'smooth' });
        }
    });
    
    // Publish ride form
    publishRideForm?.addEventListener('submit', handlePublishRide);
    
    // Booking form
    bookingForm?.addEventListener('submit', handleBooking);
    
    // Seat selection in driver dashboard
    document.querySelectorAll('.seat-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const isMinus = this.classList.contains('minus');
            const seatCount = document.getElementById('seatCount');
            let count = parseInt(seatCount.textContent);
            count = isMinus ? Math.max(1, count - 1) : Math.min(8, count + 1);
            seatCount.textContent = count;
        });
    });
    
    // Mobile menu
    mobileMenuBtn?.addEventListener('click', () => {
        mobileMenu.style.display = mobileMenu.style.display === 'block' ? 'none' : 'block';
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!mobileMenuBtn.contains(e.target) && !mobileMenu.contains(e.target)) {
            mobileMenu.style.display = 'none';
        }
    });
    
    // Login form submission
    loginForm?.addEventListener('submit', handleLogin);
    
    // Passenger signup form submission
    passengerSignupForm?.addEventListener('submit', handlePassengerSignup);
    
    // Driver signup form submission
    driverSignupForm?.addEventListener('submit', handleDriverSignup);
}

// Setup Location Suggestions
function setupLocationSuggestions() {
    const fromInput = document.getElementById('fromLocation');
    const toInput = document.getElementById('toLocation');
    const fromSuggestions = document.getElementById('fromSuggestions');
    const toSuggestions = document.getElementById('toSuggestions');
    
    [fromInput, toInput].forEach((input, index) => {
        input.addEventListener('input', function() {
            const suggestions = index === 0 ? fromSuggestions : toSuggestions;
            const value = this.value.toLowerCase();
            
            if (value.length < 2) {
                suggestions.style.display = 'none';
                return;
            }
            
            const filtered = indianCities.filter(city => 
                city.toLowerCase().includes(value)
            );
            
            if (filtered.length > 0) {
                suggestions.innerHTML = filtered.map(city => `
                    <div class="location-suggestion" data-value="${city}">${city}</div>
                `).join('');
                suggestions.style.display = 'block';
            } else {
                suggestions.style.display = 'none';
            }
        });
        
        input.addEventListener('blur', function() {
            setTimeout(() => {
                const suggestions = index === 0 ? fromSuggestions : toSuggestions;
                suggestions.style.display = 'none';
            }, 200);
        });
    });
    
    // Handle suggestion selection
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('location-suggestion')) {
            const value = e.target.getAttribute('data-value');
            const inputId = e.target.closest('.location-suggestions').id === 'fromSuggestions' ? 'fromLocation' : 'toLocation';
            document.getElementById(inputId).value = value;
            document.getElementById(inputId === 'fromLocation' ? 'fromSuggestions' : 'toSuggestions').style.display = 'none';
        }
    });
}

// Show Auth Modal
function showAuthModal(tab) {
    authModal.style.display = 'flex';
    switchTab(tab);
}

// Switch Tab in Modal
function switchTab(tab) {
    // Update tab buttons
    tabBtns.forEach(btn => {
        if (btn.getAttribute('data-tab') === tab) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Update forms
    document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
    
    if (tab === 'login') {
        loginForm.classList.add('active');
    } else if (tab === 'signup-passenger') {
        passengerSignupForm.classList.add('active');
    } else if (tab === 'signup-driver') {
        driverSignupForm.classList.add('active');
    }
}

// Handle Login
function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const userType = document.querySelector('input[name="userType"]:checked').value;
    
    const user = users.find(u => 
        u.email === email && 
        u.password === password && 
        u.type === userType
    );
    
    if (user) {
        currentUser = user;
        localStorage.setItem('quickSafarCurrentUser', JSON.stringify(currentUser));
        authModal.style.display = 'none';
        updateUIForUser();
        loadAvailableRides();
        alert(`Welcome back, ${user.name}!`);
        loginForm.reset();
    } else {
        alert('Invalid credentials or user type! Please check and try again.');
    }
}

// Handle Passenger Signup
function handlePassengerSignup(e) {
    e.preventDefault();
    
    const name = document.getElementById('passengerName').value;
    const email = document.getElementById('passengerEmail').value;
    const phone = document.getElementById('passengerPhone').value;
    const password = document.getElementById('passengerPassword').value;
    
    if (users.find(u => u.email === email)) {
        alert('Email already registered! Please login instead.');
        return;
    }
    
    const newUser = {
        id: Date.now().toString(),
        name: name,
        email: email,
        phone: phone,
        password: password,
        type: 'passenger',
        rating: 5.0,
        bookings: 0
    };
    
    users.push(newUser);
    localStorage.setItem('quickSafarUsers', JSON.stringify(users));
    
    currentUser = newUser;
    localStorage.setItem('quickSafarCurrentUser', JSON.stringify(currentUser));
    
    authModal.style.display = 'none';
    updateUIForUser();
    alert(`Welcome to Quick Safar, ${name}! Your account has been created successfully.`);
    passengerSignupForm.reset();
}

// Handle Driver Signup
function handleDriverSignup(e) {
    e.preventDefault();
    
    const name = document.getElementById('driverName').value;
    const email = document.getElementById('driverEmail').value;
    const phone = document.getElementById('driverPhone').value;
    const vehicleNumber = document.getElementById('vehicleNumber').value;
    const vehicleModel = document.getElementById('vehicleModel').value;
    const password = document.getElementById('driverPassword').value;
    
    if (users.find(u => u.email === email)) {
        alert('Email already registered! Please login instead.');
        return;
    }
    
    const newUser = {
        id: Date.now().toString(),
        name: name,
        email: email,
        phone: phone,
        vehicleNumber: vehicleNumber,
        vehicleModel: vehicleModel,
        password: password,
        type: 'driver',
        rating: 5.0,
        earnings: 0,
        completedRides: 0
    };
    
    users.push(newUser);
    localStorage.setItem('quickSafarUsers', JSON.stringify(users));
    
    currentUser = newUser;
    localStorage.setItem('quickSafarCurrentUser', JSON.stringify(currentUser));
    
    authModal.style.display = 'none';
    updateUIForUser();
    loadDriverDashboard();
    alert(`Welcome to Quick Safar Driver Program, ${name}! Your driver account has been created successfully.`);
    driverSignupForm.reset();
}

// Handle Logout
function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        currentUser = null;
        localStorage.removeItem('quickSafarCurrentUser');
        updateUIForUser();
        loadAvailableRides();
        alert('Logged out successfully!');
    }
}

// Update UI based on user login status
function updateUIForUser() {
    if (currentUser) {
        // Update user profile display
        userName.textContent = currentUser.name;
        userType.textContent = currentUser.type === 'driver' ? 'Driver' : 'Passenger';
        
        // Show user profile, hide auth buttons
        userProfile.classList.remove('hidden');
        authButtons.classList.add('hidden');
        if (mobileMenu) mobileMenu.style.display = 'none';
        
        // Update UI based on user type
        if (currentUser.type === 'driver') {
            driverDashboard.classList.remove('hidden');
            bookingSection.classList.add('hidden');
            loadDriverDashboard();
        } else {
            driverDashboard.classList.add('hidden');
        }
    } else {
        // Hide user profile, show auth buttons
        userProfile.classList.add('hidden');
        authButtons.classList.remove('hidden');
        driverDashboard.classList.add('hidden');
        bookingSection.classList.add('hidden');
    }
}

// Handle Search Rides
function handleSearchRides() {
    const from = fromLocation.value.trim();
    const to = toLocation.value.trim();
    const date = travelDate.value;
    const passengers = parseInt(passengerCount.textContent);
    
    if (!from || !to || !date) {
        alert('Please fill in all search fields: From, To, and Date');
        return;
    }
    
    if (!currentUser) {
        showAuthModal('login');
        alert('Please login to search for rides');
        return;
    }
    
    // Update title
    ridesTitle.textContent = `Available Rides from ${from} to ${to}`;
    
    // Filter rides
    const matchingRides = rides.filter(ride => 
        ride.from.toLowerCase().includes(from.toLowerCase()) &&
        ride.to.toLowerCase().includes(to.toLowerCase()) &&
        ride.date === date &&
        ride.availableSeats >= passengers &&
        ride.status === 'active' &&
        ride.driverId !== currentUser.id // Don't show driver their own rides
    );
    
    displayAvailableRides(matchingRides, passengers);
}

// Display Available Rides
function displayAvailableRides(ridesList, requiredSeats) {
    if (ridesList.length === 0) {
        availableRides.innerHTML = `
            <div class="rides-placeholder">
                <i class="fas fa-car"></i>
                <h3>No rides found matching your criteria</h3>
                <p>Try adjusting your search or check back later for new rides</p>
            </div>
        `;
        return;
    }
    
    availableRides.innerHTML = ridesList.map(ride => {
        const driver = users.find(u => u.id === ride.driverId);
        const totalFare = ride.farePerSeat * requiredSeats;
        
        return `
            <div class="ride-card" data-ride-id="${ride.id}">
                <div class="ride-header">
                    <div class="ride-driver">
                        <div class="driver-avatar">
                            <i class="fas fa-user-circle"></i>
                        </div>
                        <div class="driver-info">
                            <h4>${driver?.name || 'Driver'}</h4>
                            <p class="vehicle-info">${driver?.vehicleModel || 'Car'} • ${driver?.vehicleNumber || 'XX-XX-XXXX'}</p>
                        </div>
                    </div>
                    <div class="ride-price">₹${totalFare}</div>
                </div>
                
                <div class="ride-details">
                    <div class="detail-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <div>
                            <strong>From</strong>
                            <p>${ride.from}</p>
                        </div>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-flag-checkered"></i>
                        <div>
                            <strong>To</strong>
                            <p>${ride.to}</p>
                        </div>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-calendar"></i>
                        <div>
                            <strong>Date</strong>
                            <p>${formatDate(ride.date)}</p>
                        </div>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-clock"></i>
                        <div>
                            <strong>Time</strong>
                            <p>${ride.time}</p>
                        </div>
                    </div>
                </div>
                
                <div class="ride-footer">
                    <div class="seats-available">
                        <i class="fas fa-chair"></i> ${ride.availableSeats} seats available
                    </div>
                    <button class="book-ride-btn" onclick="showBookingForm('${ride.id}', ${requiredSeats})">
                        <i class="fas fa-check-circle"></i> Book Now (₹${ride.farePerSeat}/seat)
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Show Booking Form
function showBookingForm(rideId, seats) {
    if (!currentUser || currentUser.type !== 'passenger') {
        alert('Please login as a passenger to book rides');
        showAuthModal('login');
        return;
    }
    
    const ride = rides.find(r => r.id === rideId);
    if (!ride || ride.availableSeats < seats) {
        alert('Sorry, this ride is no longer available');
        return;
    }
    
    const totalFare = ride.farePerSeat * seats;
    
    // Update booking form
    document.getElementById('bookingName').value = currentUser.name;
    document.getElementById('bookingPhone').value = currentUser.phone || '';
    document.getElementById('summaryRide').textContent = `${ride.from} to ${ride.to}`;
    document.getElementById('summaryPassengers').textContent = `${seats} passenger${seats > 1 ? 's' : ''}`;
    document.getElementById('summaryFare').textContent = `₹${totalFare}`;
    
    // Store ride info for booking
    bookingForm.dataset.rideId = rideId;
    bookingForm.dataset.seats = seats;
    
    // Show booking form
    bookingSection.classList.remove('hidden');
    bookingSection.scrollIntoView({ behavior: 'smooth' });
}

// Handle Booking
function handleBooking(e) {
    e.preventDefault();
    
    const rideId = e.target.dataset.rideId;
    const seats = parseInt(e.target.dataset.seats);
    const ride = rides.find(r => r.id === rideId);
    
    if (!ride || ride.availableSeats < seats) {
        alert('Sorry, seats are no longer available');
        return;
    }
    
    const booking = {
        id: Date.now().toString(),
        passengerId: currentUser.id,
        passengerName: currentUser.name,
        passengerPhone: document.getElementById('bookingPhone').value,
        driverId: ride.driverId,
        rideId: rideId,
        from: ride.from,
        to: ride.to,
        date: ride.date,
        time: ride.time,
        seats: seats,
        farePerSeat: ride.farePerSeat,
        totalFare: ride.farePerSeat * seats,
        status: 'confirmed',
        bookingDate: new Date().toISOString(),
        specialRequests: document.getElementById('specialRequests').value
    };
    
    // Update ride availability
    ride.availableSeats -= seats;
    if (ride.availableSeats === 0) {
        ride.status = 'full';
    }
    
    // Update driver earnings
    const driver = users.find(u => u.id === ride.driverId);
    if (driver) {
        driver.earnings = (driver.earnings || 0) + booking.totalFare;
        driver.completedRides = (driver.completedRides || 0) + 1;
    }
    
    // Save booking
    bookings.push(booking);
    saveData();
    
    alert(`Booking confirmed! Your ride from ${ride.from} to ${ride.to} is booked. Total fare: ₹${booking.totalFare}`);
    
    // Reset and reload
    bookingForm.reset();
    bookingSection.classList.add('hidden');
    loadAvailableRides();
    if (driver && currentUser.id === driver.id) {
        loadDriverDashboard();
    }
}

// Handle Publish Ride
function handlePublishRide(e) {
    e.preventDefault();
    
    if (!currentUser || currentUser.type !== 'driver') {
        alert('Please login as a driver to publish rides');
        showAuthModal('signup-driver');
        return;
    }
    
    const from = document.getElementById('rideFrom').value.trim();
    const to = document.getElementById('rideTo').value.trim();
    const date = document.getElementById('rideDate').value;
    const time = document.getElementById('rideTime').value;
    const seats = parseInt(document.getElementById('seatCount').textContent);
    const farePerSeat = parseInt(document.getElementById('farePerSeat').value);
    
    if (!from || !to || !date || !time) {
        alert('Please fill in all required fields');
        return;
    }
    
    const newRide = {
        id: Date.now().toString(),
        driverId: currentUser.id,
        from: from,
        to: to,
        date: date,
        time: time,
        availableSeats: seats,
        totalSeats: seats,
        farePerSeat: farePerSeat,
        status: 'active',
        createdAt: new Date().toISOString()
    };
    
    rides.push(newRide);
    saveData();
    
    alert('Ride published successfully!');
    publishRideForm.reset();
    document.getElementById('seatCount').textContent = '4';
    loadDriverDashboard();
}

// Load Driver Dashboard
function loadDriverDashboard() {
    if (!currentUser || currentUser.type !== 'driver') return;
    
    // Update stats
    document.getElementById('totalEarnings').textContent = `₹${currentUser.earnings || 0}`;
    document.getElementById('completedRides').textContent = currentUser.completedRides || 0;
    document.getElementById('driverRating').textContent = `${currentUser.rating || 5.0}★`;
    
    // Load driver's published rides
    const driverRides = rides.filter(ride => ride.driverId === currentUser.id);
    
    if (driverRides.length === 0) {
        publishedRides.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-car"></i>
                <p>No rides published yet. Publish your first ride above!</p>
            </div>
        `;
    } else {
        publishedRides.innerHTML = driverRides.map(ride => `
            <div class="ride-card">
                <div class="ride-header">
                    <div>
                        <h4>${ride.from} → ${ride.to}</h4>
                        <p class="vehicle-info">${formatDate(ride.date)} at ${ride.time}</p>
                    </div>
                    <div class="ride-price">₹${ride.farePerSeat}/seat</div>
                </div>
                
                <div class="ride-details">
                    <div class="detail-item">
                        <i class="fas fa-chair"></i>
                        <div>
                            <strong>Seats</strong>
                            <p>${ride.availableSeats}/${ride.totalSeats} available</p>
                        </div>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-rupee-sign"></i>
                        <div>
                            <strong>Earnings Potential</strong>
                            <p>₹${ride.farePerSeat * (ride.totalSeats - ride.availableSeats)}</p>
                        </div>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-calendar"></i>
                        <div>
                            <strong>Status</strong>
                            <p class="${ride.status === 'active' ? 'seats-available' : 'text-light'}">${ride.status}</p>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }
}

// Load Available Rides for Display
function loadAvailableRides() {
    const today = new Date().toISOString().split('T')[0];
    const upcomingRides = rides.filter(ride => 
        ride.date >= today && 
        ride.status === 'active' &&
        (!currentUser || ride.driverId !== currentUser.id)
    ).slice(0, 5); // Show only 5 upcoming rides
    
    if (upcomingRides.length > 0) {
        displayAvailableRides(upcomingRides, 1);
    } else {
        availableRides.innerHTML = `
            <div class="rides-placeholder">
                <i class="fas fa-search"></i>
                <h3>Search for rides to see available options</h3>
                <p>Enter your journey details above to find matching rides</p>
            </div>
        `;
    }
}

// Load Demo Data
function loadDemoData() {
    if (localStorage.getItem('quickSafarDemoLoaded')) return;
    
    // Demo drivers
    const demoDrivers = [
        {
            id: 'driver1',
            name: 'Rajesh Kumar',
            email: 'rajesh@example.com',
            phone: '9876543210',
            password: 'password123',
            type: 'driver',
            vehicleNumber: 'DL-01-AB-1234',
            vehicleModel: 'Hyundai Creta',
            rating: 4.8,
            earnings: 12500,
            completedRides: 24
        },
        {
            id: 'driver2',
            name: 'Priya Sharma',
            email: 'priya@example.com',
            phone: '9876543211',
            password: 'password123',
            type: 'driver',
            vehicleNumber: 'UP-16-CD-5678',
            vehicleModel: 'Maruti Suzuki Swift',
            rating: 4.9,
            earnings: 8900,
            completedRides: 18
        }
    ];
    
    // Demo passengers
    const demoPassengers = [
        {
            id: 'passenger1',
            name: 'Amit Singh',
            email: 'amit@example.com',
            phone: '9876543212',
            password: 'password123',
            type: 'passenger',
            rating: 5.0,
            bookings: 12
        }
    ];
    
    // Demo rides
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const demoRides = [
        {
            id: 'ride1',
            driverId: 'driver1',
            from: 'Delhi',
            to: 'Noida',
            date: tomorrow.toISOString().split('T')[0],
            time: '08:30',
            availableSeats: 3,
            totalSeats: 4,
            farePerSeat: 150,
            status: 'active',
            createdAt: new Date().toISOString()
        },
        {
            id: 'ride2',
            driverId: 'driver2',
            from: 'Delhi',
            to: 'Gurgaon',
            date: tomorrow.toISOString().split('T')[0],
            time: '09:15',
            availableSeats: 2,
            totalSeats: 4,
            farePerSeat: 200,
            status: 'active',
            createdAt: new Date().toISOString()
        }
    ];
    
    // Save demo data
    users = [...demoDrivers, ...demoPassengers];
    rides = demoRides;
    
    localStorage.setItem('quickSafarUsers', JSON.stringify(users));
    localStorage.setItem('quickSafarRides', JSON.stringify(rides));
    localStorage.setItem('quickSafarDemoLoaded', 'true');
}

// Save Data
function saveData() {
    localStorage.setItem('quickSafarUsers', JSON.stringify(users));
    localStorage.setItem('quickSafarRides', JSON.stringify(rides));
    localStorage.setItem('quickSafarBookings', JSON.stringify(bookings));
    if (currentUser) {
        localStorage.setItem('quickSafarCurrentUser', JSON.stringify(currentUser));
    }
}

// Load User Session
function loadUserSession() {
    if (currentUser) {
        // Refresh user data from storage
        const storedUser = users.find(u => u.id === currentUser.id);
        if (storedUser) {
            currentUser = storedUser;
            localStorage.setItem('quickSafarCurrentUser', JSON.stringify(currentUser));
        }
    }
}

// Utility Functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Make functions available globally
window.showBookingForm = showBookingForm;
