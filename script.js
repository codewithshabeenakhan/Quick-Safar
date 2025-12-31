// Initialize localStorage
if (!localStorage.getItem('users')) {
    localStorage.setItem('users', JSON.stringify([]));
}
if (!localStorage.getItem('drivers')) {
    localStorage.setItem('drivers', JSON.stringify([]));
}
if (!localStorage.getItem('rides')) {
    localStorage.setItem('rides', JSON.stringify([]));
}
if (!localStorage.getItem('bookings')) {
    localStorage.setItem('bookings', JSON.stringify([]));
}
if (!localStorage.getItem('ratings')) {
    localStorage.setItem('ratings', JSON.stringify([]));
}
if (!localStorage.getItem('notifications')) {
    localStorage.setItem('notifications', JSON.stringify([
        {
            id: '1',
            title: 'Welcome to Quick Safar!',
            message: 'Start booking your rides now.',
            type: 'info',
            read: false,
            date: new Date().toISOString()
        },
        {
            id: '2',
            title: 'Special Offer',
            message: 'Get 20% off on your first ride.',
            type: 'promo',
            read: false,
            date: new Date().toISOString()
        },
        {
            id: '3',
            title: 'Safety Reminder',
            message: 'Always wear your seatbelt.',
            type: 'warning',
            read: false,
            date: new Date().toISOString()
        }
    ]));
}

// Global variables
let currentUser = null;
let isLoggedIn = false;
let currentBookingForRating = null;
let selectedRating = 0;

// DOM Elements
const authModal = document.getElementById('authModal');
const mainContainer = document.querySelector('.container');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const goToSignup = document.getElementById('goToSignup');
const goToLogin = document.getElementById('goToLogin');
const logoutBtn = document.getElementById('logoutBtn');
const passengerBtn = document.getElementById('passengerBtn');
const driverBtn = document.getElementById('driverBtn');
const passengerSection = document.getElementById('passengerSection');
const driverSection = document.getElementById('driverSection');
const historySection = document.getElementById('historySection');
const helpSection = document.getElementById('helpSection');
const notificationBtn = document.getElementById('notificationBtn');
const notificationModal = document.getElementById('notificationModal');

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
    setupEventListeners();
    setupLocationAutocomplete();
    setupNavigation();
    
    // Set minimum dates
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('travelDate').min = today;
    document.getElementById('driverDate').min = today;
    
    // Set current time
    const now = new Date();
    const currentTime = now.toTimeString().substring(0, 5);
    document.getElementById('travelTime').value = currentTime;
    document.getElementById('departureTime').value = currentTime;
    
    // Initialize seat display
    updateSeatDisplay();
});

// Setup Event Listeners
function setupEventListeners() {
    // Auth tab switching
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
            
            this.classList.add('active');
            document.getElementById(`${this.dataset.tab}Form`).classList.add('active');
        });
    });
    
    // User type switching in login
    document.querySelectorAll('.user-type-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.user-type-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Signup user type buttons
    document.querySelectorAll('.user-type-select-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.user-type-select-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const userType = this.dataset.type;
            const driverFields = document.getElementById('driverFields');
            driverFields.classList.toggle('hidden', userType !== 'driver');
        });
    });
    
    // File upload preview
    document.getElementById('driverPhoto').addEventListener('change', handlePhotoUpload);
    
    // Password toggle
    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', function() {
            const input = this.parentElement.querySelector('input');
            const icon = this.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });
    
    // Login
    loginBtn.addEventListener('click', handleLogin);
    signupBtn.addEventListener('click', handleSignup);
    goToSignup.addEventListener('click', () => switchAuthTab('signup'));
    goToLogin.addEventListener('click', () => switchAuthTab('login'));
    
    // Logout
    logoutBtn.addEventListener('click', handleLogout);
    
    // Passenger/Driver switching
    passengerBtn.addEventListener('click', () => switchDashboard('passenger'));
    driverBtn.addEventListener('click', () => switchDashboard('driver'));
    
    // Passenger count
    document.querySelectorAll('.count-btn').forEach(btn => {
        btn.addEventListener('click', function() {
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
    
    // Ride type selection
    document.querySelectorAll('.ride-type-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.ride-type-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            calculateDistance();
        });
    });
    
    // Search rides
    document.getElementById('searchRides').addEventListener('click', searchAvailableRides);
    
    // Add route
    document.getElementById('addRoute').addEventListener('click', addDriverRoute);
    
    // Location inputs
    ['fromLocation', 'toLocation', 'driverFrom', 'driverTo'].forEach(id => {
        document.getElementById(id).addEventListener('input', debounce(calculateDistance, 500));
    });
    
    // Rating modal
    document.querySelectorAll('.rating-stars i').forEach(star => {
        star.addEventListener('click', function() {
            selectedRating = parseInt(this.dataset.rating);
            setStarRating(selectedRating);
        });
    });
    
    document.getElementById('submitRating').addEventListener('click', submitRating);
    document.getElementById('cancelRating').addEventListener('click', () => {
        document.getElementById('ratingModal').classList.remove('active');
    });
    
    // Notification button
    notificationBtn.addEventListener('click', showNotifications);
    
    // Add money modal
    document.querySelectorAll('.amount-option').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.amount-option').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            document.getElementById('customAmount').value = this.dataset.amount;
        });
    });
    
    document.getElementById('confirmAddMoney').addEventListener('click', confirmAddMoney);
    document.getElementById('cancelAddMoney').addEventListener('click', () => {
        document.getElementById('addMoneyModal').classList.remove('active');
    });
    
    // FAQ toggle
    document.querySelectorAll('.faq-question').forEach(question => {
        question.addEventListener('click', function() {
            const answer = this.nextElementSibling;
            const icon = this.querySelector('i');
            
            answer.style.display = answer.style.display === 'block' ? 'none' : 'block';
            icon.style.transform = answer.style.display === 'block' ? 'rotate(180deg)' : 'rotate(0deg)';
        });
    });
}

// Setup navigation
function setupNavigation() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Update active nav link
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            // Show selected section
            const sectionId = this.dataset.section;
            document.querySelectorAll('.dashboard-section').forEach(s => s.classList.remove('active'));
            document.getElementById(sectionId).classList.add('active');
        });
    });
}

// Switch auth tab
function switchAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    
    document.querySelector(`.auth-tab[data-tab="${tab}"]`).classList.add('active');
    document.getElementById(`${tab}Form`).classList.add('active');
}

// Check login status
function checkLoginStatus() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (user) {
        currentUser = user;
        isLoggedIn = true;
        showMainApp();
        loadUserDashboard();
        updateNotificationCount();
    }
}

// Handle Login
async function handleLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const userType = document.querySelector('.user-type-btn.active').dataset.type;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    if (!email || !password) {
        showAlert('Please enter email and password', 'warning');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('users'));
    const user = users.find(u => u.email === email && u.password === password && u.type === userType);
    
    if (user) {
        // Remove sensitive data
        const { password: _, ...safeUser } = user;
        currentUser = safeUser;
        
        if (rememberMe) {
            localStorage.setItem('currentUser', JSON.stringify(safeUser));
        } else {
            sessionStorage.setItem('currentUser', JSON.stringify(safeUser));
        }
        
        isLoggedIn = true;
        
        // Add login notification
        addNotification('Login Successful', `Welcome back, ${user.name}!`, 'success');
        
        showMainApp();
        loadUserDashboard();
        updateNotificationCount();
        
        // Clear form
        document.getElementById('loginEmail').value = '';
        document.getElementById('loginPassword').value = '';
        
        showAlert('Login successful!', 'success');
    } else {
        showAlert('Invalid credentials or user type', 'error');
    }
}

// Handle Signup
async function handleSignup() {
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const phone = document.getElementById('signupPhone').value.trim();
    const password = document.getElementById('signupPassword').value.trim();
    const confirmPassword = document.getElementById('confirmPassword').value.trim();
    const userType = document.querySelector('.user-type-select-btn.active').dataset.type;
    const agreeTerms = document.getElementById('agreeTerms').checked;
    
    // Validation
    if (!name || !email || !phone || !password || !confirmPassword) {
        showAlert('Please fill all required fields', 'warning');
        return;
    }
    
    if (password.length < 6) {
        showAlert('Password must be at least 6 characters', 'warning');
        return;
    }
    
    if (password !== confirmPassword) {
        showAlert('Passwords do not match', 'warning');
        return;
    }
    
    if (!agreeTerms) {
        showAlert('Please agree to terms and conditions', 'warning');
        return;
    }
    
    if (userType === 'driver') {
        const license = document.getElementById('driverLicense').value.trim();
        const vehicleModel = document.getElementById('vehicleModel').value.trim();
        const vehicleNumber = document.getElementById('vehicleNumber').value.trim();
        
        if (!license || !vehicleModel || !vehicleNumber) {
            showAlert('Please fill all driver fields', 'warning');
            return;
        }
    }
    
    // Check if user already exists
    const users = JSON.parse(localStorage.getItem('users'));
    if (users.some(u => u.email === email)) {
        showAlert('User with this email already exists', 'error');
        return;
    }
    
    // Create user object
    const user = {
        id: Date.now().toString(),
        name,
        email,
        phone,
        password,
        type: userType,
        createdAt: new Date().toISOString(),
        wallet: 1000, // Initial wallet balance
        rating: userType === 'driver' ? 5.0 : null,
        totalRides: 0,
        totalEarnings: userType === 'driver' ? 0 : null,
        isActive: true
    };
    
    // Add driver specific data
    if (userType === 'driver') {
        user.licenseNumber = document.getElementById('driverLicense').value.trim();
        user.vehicleModel = document.getElementById('vehicleModel').value.trim();
        user.vehicleNumber = document.getElementById('vehicleNumber').value.trim();
        user.profilePhoto = null;
        user.isVerified = false;
        user.ratings = [];
    }
    
    // Save user
    users.push(user);
    localStorage.setItem('users', JSON.stringify(users));
    
    // Login automatically
    const { password: _, ...safeUser } = user;
    currentUser = safeUser;
    localStorage.setItem('currentUser', JSON.stringify(safeUser));
    isLoggedIn = true;
    
    // Add welcome notification
    addNotification('Welcome to Quick Safar!', 'Your account has been created successfully.', 'success');
    
    showMainApp();
    loadUserDashboard();
    updateNotificationCount();
    
    // Clear form
    clearSignupForm();
    
    showAlert('Account created successfully!', 'success');
}

// Show main application
function showMainApp() {
    authModal.classList.remove('active');
    mainContainer.classList.add('active');
}

// Load user dashboard based on type
function loadUserDashboard() {
    if (!currentUser) return;
    
    // Update user info in header
    updateUserInfo();
    
    // Switch to appropriate dashboard
    if (currentUser.type === 'passenger') {
        switchDashboard('passenger');
        loadPassengerDashboard();
    } else {
        switchDashboard('driver');
        loadDriverDashboard();
    }
    
    // Update notification count
    updateNotificationCount();
}

// Update user info in header
function updateUserInfo() {
    const userInfo = document.getElementById('userInfo');
    userInfo.innerHTML = `
        <div class="user-avatar">
            ${currentUser.profilePhoto ? 
                `<img src="${currentUser.profilePhoto}" alt="${currentUser.name}">` :
                `<i class="fas fa-user"></i>`
            }
        </div>
        <div class="user-details">
            <h3>${currentUser.name}</h3>
            <p>${currentUser.type === 'driver' ? 'Professional Driver' : 'Premium Passenger'}</p>
        </div>
    `;
    
    // Update wallet balance
    document.getElementById('walletBalance').textContent = currentUser.wallet || 0;
}

// Switch dashboard
function switchDashboard(type) {
    // Update buttons
    passengerBtn.classList.toggle('active', type === 'passenger');
    driverBtn.classList.toggle('active', type === 'driver');
    
    // Update sections
    document.querySelectorAll('.dashboard-section').forEach(s => s.classList.remove('active'));
    document.getElementById(`${type}Section`).classList.add('active');
    
    // Update navigation
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    document.querySelector('.nav-link[data-section="passengerSection"]').classList.add('active');
    
    // Update specific elements
    if (type === 'passenger') {
        updateSeatDisplay();
        loadPassengerBookings();
    } else {
        loadDriverRoutes();
        loadDriverBookings();
        updateDriverStats();
    }
}

// Update seat display
function updateSeatDisplay() {
    const count = parseInt(document.getElementById('passengerCount').value);
    const seatDisplay = document.getElementById('seatDisplay');
    seatDisplay.innerHTML = '';
    
    for (let i = 1; i <= 8; i++) {
        const seat = document.createElement('div');
        seat.className = `seat ${i <= count ? 'selected' : ''}`;
        seat.textContent = i;
        seatDisplay.appendChild(seat);
    }
}

// File upload handling
function handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        showAlert('Please select an image file', 'warning');
        return;
    }
    
    if (file.size > 2 * 1024 * 1024) { // 2MB limit
        showAlert('Image too large. Max 2MB', 'warning');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('photoPreview');
        preview.innerHTML = `
            <div class="preview-item">
                <img src="${e.target.result}" alt="Profile Photo">
                <button class="remove-file" onclick="removeFile(this)">×</button>
            </div>
        `;
    };
    reader.readAsDataURL(file);
}

function removeFile(button) {
    button.parentElement.remove();
}

// Location autocomplete setup
function setupLocationAutocomplete() {
    const popularLocations = [
        "Delhi", "Mumbai", "Bangalore", "Chennai", "Kolkata",
        "Hyderabad", "Pune", "Ahmedabad", "Jaipur", "Lucknow",
        "Noida", "Gurgaon", "Faridabad", "Ghaziabad", "Chandigarh"
    ];
    
    ['fromLocation', 'toLocation', 'driverFrom', 'driverTo'].forEach(id => {
        const input = document.getElementById(id);
        const suggestions = document.getElementById(id + 'Suggestions');
        
        input.addEventListener('input', function() {
            const value = this.value.toLowerCase();
            if (value.length < 2) {
                suggestions.style.display = 'none';
                return;
            }
            
            const filtered = popularLocations.filter(loc => 
                loc.toLowerCase().includes(value)
            );
            
            if (filtered.length > 0) {
                suggestions.innerHTML = filtered.map(loc => `
                    <div class="suggestion-item" onclick="selectLocation('${id}', '${loc}')">
                        ${loc}
                    </div>
                `).join('');
                suggestions.style.display = 'block';
            } else {
                suggestions.style.display = 'none';
            }
        });
        
        // Hide suggestions when clicking outside
        document.addEventListener('click', function(e) {
            if (!input.contains(e.target) && !suggestions.contains(e.target)) {
                suggestions.style.display = 'none';
            }
        });
    });
}

function selectLocation(inputId, location) {
    document.getElementById(inputId).value = location;
    document.getElementById(inputId + 'Suggestions').style.display = 'none';
    calculateDistance();
}

// Get current location
function getCurrentLocation(field) {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                
                // In production, reverse geocode to get address
                const locations = ["Current Location", "Nearby Location", "Your Location"];
                const randomLocation = locations[Math.floor(Math.random() * locations.length)];
                
                document.getElementById(field === 'from' ? 'fromLocation' : 
                                      field === 'to' ? 'toLocation' :
                                      field === 'driverFrom' ? 'driverFrom' : 'driverTo').value = randomLocation;
                
                calculateDistance();
                showAlert('Location detected successfully!', 'success');
            },
            (error) => {
                showAlert('Unable to get your location. Please enter manually.', 'warning');
            }
        );
    } else {
        showAlert('Geolocation is not supported by your browser', 'warning');
    }
}

// Calculate distance between locations
async function calculateDistance() {
    const from = document.getElementById('fromLocation')?.value || 
                 document.getElementById('driverFrom')?.value;
    const to = document.getElementById('toLocation')?.value || 
               document.getElementById('driverTo')?.value;
    
    if (!from || !to || from === to) return;
    
    try {
        // Simplified distance calculation
        // In production, use Google Maps Distance Matrix API
        const baseDistance = 10; // km
        const randomFactor = Math.random() * 20 + 5; // 5-25 km additional
        const distance = baseDistance + randomFactor;
        const time = distance * 2; // minutes
        
        // Get ride type multiplier
        const rideTypeBtn = document.querySelector('.ride-type-btn.active');
        const rideType = rideTypeBtn ? rideTypeBtn.dataset.type : 'economy';
        const fare = calculateFare(distance, rideType);
        
        // Update UI based on current section
        if (document.getElementById('passengerSection').classList.contains('active')) {
            document.getElementById('estimatedDistance').textContent = distance.toFixed(1);
            document.getElementById('estimatedTime').textContent = Math.round(time);
            document.getElementById('estimatedFare').textContent = '₹' + fare;
        } else {
            document.getElementById('routeDistance').textContent = distance.toFixed(1);
            document.getElementById('recommendedFare').textContent = Math.round(fare / 4); // Per person
            document.getElementById('farePerPerson').value = Math.round(fare / 4);
        }
    } catch (error) {
        console.error('Error calculating distance:', error);
    }
}

function calculateFare(distance, rideType = 'economy') {
    const passengers = parseInt(document.getElementById('passengerCount')?.value || 1);
    
    let perKmRate = 10;
    switch (rideType) {
        case 'premium': perKmRate = 15; break;
        case 'luxury': perKmRate = 20; break;
    }
    
    const baseFare = 50;
    const totalFare = baseFare + (distance * perKmRate);
    
    return Math.round(totalFare * passengers);
}

// Search available rides
async function searchAvailableRides() {
    const from = document.getElementById('fromLocation').value;
    const to = document.getElementById('toLocation').value;
    const date = document.getElementById('travelDate').value;
    const seats = parseInt(document.getElementById('passengerCount').value);
    const rideType = document.querySelector('.ride-type-btn.active').dataset.type;
    
    if (!from || !to || !date) {
        showAlert('Please fill all fields', 'warning');
        return;
    }
    
    // Show loading
    const container = document.getElementById('availableRides');
    container.innerHTML = '<div class="spinner"></div>';
    
    // Simulate API delay
    setTimeout(() => {
        // Get all drivers
        const users = JSON.parse(localStorage.getItem('users'));
        const drivers = users.filter(u => u.type === 'driver');
        const rides = JSON.parse(localStorage.getItem('rides'));
        
        // Filter available rides
        const availableRides = rides.filter(ride => 
            ride.from.toLowerCase().includes(from.toLowerCase()) &&
            ride.to.toLowerCase().includes(to.toLowerCase()) &&
            ride.date === date &&
            ride.availableSeats >= seats &&
            ride.status === 'active'
        );
        
        // Add driver info to rides
        const ridesWithDriverInfo = availableRides.map(ride => {
            const driver = drivers.find(d => d.id === ride.driverId);
            return { ...ride, driver };
        }).filter(ride => ride.driver); // Remove rides without driver info
        
        displayAvailableRides(ridesWithDriverInfo, seats, rideType);
    }, 1000);
}

// Display available rides
function displayAvailableRides(rides, requiredSeats, rideType) {
    const container = document.getElementById('availableRides');
    
    if (rides.length === 0) {
        container.innerHTML = `
            <div class="ride-card">
                <div style="text-align: center; padding: 40px;">
                    <i class="fas fa-car" style="font-size: 3rem; color: var(--gray-300); margin-bottom: 20px;"></i>
                    <h3 style="color: var(--gray-600); margin-bottom: 10px;">No rides available</h3>
                    <p style="color: var(--gray-500);">Try adjusting your search criteria or try again later.</p>
                </div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = rides.map(ride => {
        const totalFare = ride.farePerPerson * requiredSeats;
        const driverRating = calculateDriverRating(ride.driverId);
        
        return `
            <div class="ride-card" data-ride-id="${ride.id}">
                <div class="driver-info">
                    <div class="driver-avatar">
                        ${ride.driver.profilePhoto ? 
                            `<img src="${ride.driver.profilePhoto}" alt="${ride.driver.name}">` :
                            `<i class="fas fa-user-circle"></i>`
                        }
                    </div>
                    <div class="driver-details">
                        <h4>${ride.driver.name}</h4>
                        <div class="rating">
                            ${getStarRating(driverRating)}
                            <span style="color: var(--gray-600); margin-left: 5px;">${driverRating.toFixed(1)}</span>
                        </div>
                        <p style="color: var(--gray-600); font-size: 0.9rem;">${ride.driver.vehicleModel} • ${ride.driver.vehicleNumber}</p>
                    </div>
                </div>
                
                <div class="ride-details">
                    <div class="route">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${ride.from}</span>
                    </div>
                    <div class="route">
                        <i class="fas fa-flag-checkered"></i>
                        <span>${ride.to}</span>
                    </div>
                    <div class="route">
                        <i class="fas fa-calendar"></i>
                        <span>${ride.date} at ${ride.time}</span>
                    </div>
                    <div class="route">
                        <i class="fas fa-chair"></i>
                        <span>${ride.availableSeats} seats available</span>
                    </div>
                </div>
                
                <div class="fare">₹${totalFare}</div>
                <div class="ride-actions">
                    <button class="btn-book" onclick="bookRide('${ride.id}', ${requiredSeats}, '${rideType}')">
                        <i class="fas fa-check"></i> Book Now
                    </button>
                    <button class="btn-details" onclick="showRideDetails('${ride.id}')">
                        <i class="fas fa-info-circle"></i> Details
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Book a ride
function bookRide(rideId, seats, rideType) {
    const rides = JSON.parse(localStorage.getItem('rides'));
    const ride = rides.find(r => r.id === rideId);
    
    if (!ride) {
        showAlert('Ride not found', 'error');
        return;
    }
    
    const totalFare = ride.farePerPerson * seats;
    
    if (currentUser.wallet < totalFare) {
        showAlert('Insufficient wallet balance. Please add money.', 'warning');
        document.getElementById('addMoneyModal').classList.add('active');
        return;
    }
    
    // Create booking
    const booking = {
        id: Date.now().toString(),
        passengerId: currentUser.id,
        passengerName: currentUser.name,
        passengerPhone: currentUser.phone,
        driverId: ride.driverId,
        rideId: rideId,
        from: ride.from,
        to: ride.to,
        date: ride.date,
        time: ride.time,
        seats: seats,
        fare: totalFare,
        rideType: rideType,
        status: 'confirmed',
        bookingDate: new Date().toISOString(),
        paymentStatus: 'paid',
        isRated: false
    };
    
    // Update ride availability
    ride.availableSeats -= seats;
    if (ride.availableSeats <= 0) {
        ride.status = 'full';
    }
    
    // Update user wallet
    currentUser.wallet -= booking.fare;
    
    // Update driver earnings
    const users = JSON.parse(localStorage.getItem('users'));
    const driverIndex = users.findIndex(u => u.id === ride.driverId);
    if (driverIndex !== -1) {
        users[driverIndex].totalEarnings = (users[driverIndex].totalEarnings || 0) + booking.fare;
        users[driverIndex].totalRides = (users[driverIndex].totalRides || 0) + 1;
    }
    
    // Save data
    const bookings = JSON.parse(localStorage.getItem('bookings'));
    bookings.push(booking);
    
    const rideIndex = rides.findIndex(r => r.id === rideId);
    rides[rideIndex] = ride;
    
    users.find(u => u.id === currentUser.id).wallet = currentUser.wallet;
    
    localStorage.setItem('bookings', JSON.stringify(bookings));
    localStorage.setItem('rides', JSON.stringify(rides));
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    // Add notification
    addNotification('Booking Confirmed', `Your ride from ${ride.from} to ${ride.to} is confirmed.`, 'success');
    
    // Update UI
    updateUserInfo();
    loadPassengerBookings();
    
    showAlert(`Booking confirmed! ₹${booking.fare} deducted from wallet.`, 'success');
}

// Add driver route
function addDriverRoute() {
    const from = document.getElementById('driverFrom').value.trim();
    const to = document.getElementById('driverTo').value.trim();
    const seats = parseInt(document.getElementById('availableSeats').value);
    const date = document.getElementById('driverDate').value;
    const time = document.getElementById('departureTime').value;
    const fare = parseInt(document.getElementById('farePerPerson').value);
    
    if (!from || !to || !date || !time) {
        showAlert('Please fill all fields', 'warning');
        return;
    }
    
    if (fare < 50) {
        showAlert('Minimum fare is ₹50 per person', 'warning');
        return;
    }
    
    const ride = {
        id: Date.now().toString(),
        driverId: currentUser.id,
        from,
        to,
        availableSeats: seats,
        date,
        time,
        farePerPerson: fare,
        status: 'active',
        createdAt: new Date().toISOString()
    };
    
    const rides = JSON.parse(localStorage.getItem('rides'));
    rides.push(ride);
    localStorage.setItem('rides', JSON.stringify(rides));
    
    // Add notification
    addNotification('Route Published', `Your route from ${from} to ${to} is now active.`, 'success');
    
    // Clear form
    document.getElementById('driverFrom').value = '';
    document.getElementById('driverTo').value = '';
    document.getElementById('farePerPerson').value = '200';
    
    loadDriverRoutes();
    updateDriverStats();
    
    showAlert('Route published successfully!', 'success');
}

// Load driver routes
function loadDriverRoutes() {
    const rides = JSON.parse(localStorage.getItem('rides'));
    const driverRides = rides.filter(r => r.driverId === currentUser.id && r.status === 'active');
    
    const container = document.getElementById('activeRoutes');
    
    // Update active routes count
    document.getElementById('activeRoutesCount').textContent = driverRides.length;
    
    if (driverRides.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; background: white; border-radius: var(--radius-xl);">
                <i class="fas fa-route" style="font-size: 3rem; color: var(--gray-300); margin-bottom: 20px;"></i>
                <h3 style="color: var(--gray-600); margin-bottom: 10px;">No active routes</h3>
                <p style="color: var(--gray-500);">Add a new route above to start accepting passengers.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = driverRides.map(ride => `
        <div class="ride-card">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
                <h4 style="margin: 0; color: var(--gray-800);">${ride.from} → ${ride.to}</h4>
                <span class="booking-status status-confirmed">Active</span>
            </div>
            <div class="ride-details">
                <div class="route">
                    <i class="fas fa-calendar"></i>
                    <span>${ride.date} at ${ride.time}</span>
                </div>
                <div class="route">
                    <i class="fas fa-chair"></i>
                    <span>${ride.availableSeats} seats available</span>
                </div>
                <div class="route">
                    <i class="fas fa-money-bill-wave"></i>
                    <span>₹${ride.farePerPerson} per person</span>
                </div>
            </div>
            <div class="ride-actions">
                <button class="btn-details" onclick="editRoute('${ride.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn-book" onclick="cancelRoute('${ride.id}')" style="background: linear-gradient(135deg, var(--danger-color), #f87171);">
                    <i class="fas fa-times"></i> Cancel
                </button>
            </div>
        </div>
    `).join('');
}

// Load passenger bookings
function loadPassengerBookings() {
    const bookings = JSON.parse(localStorage.getItem('bookings'));
    const passengerBookings = bookings.filter(b => b.passengerId === currentUser.id)
                                     .sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate))
                                     .slice(0, 5); // Show only recent 5
    
    const container = document.getElementById('passengerBookings');
    
    if (passengerBookings.length === 0) {
        container.innerHTML = '<p style="color: var(--gray-500); text-align: center; padding: 40px;">No bookings yet.</p>';
        return;
    }
    
    container.innerHTML = passengerBookings.map(booking => {
        const statusClass = `status-${booking.status}`;
        const canRate = booking.status === 'completed' && !booking.isRated;
        
        return `
            <div class="booking-item">
                <div class="booking-info">
                    <h4>${booking.from} → ${booking.to}</h4>
                    <div class="booking-meta">
                        <span>${booking.date} • ${booking.time}</span>
                        <span>${booking.seats} seat(s)</span>
                        <span class="booking-status ${statusClass}">${booking.status}</span>
                    </div>
                    <p style="color: var(--gray-600); margin-top: 10px;">${booking.rideType} • ₹${booking.fare}</p>
                </div>
                <div class="booking-right">
                    <div class="booking-price">₹${booking.fare}</div>
                    ${canRate ? `
                        <button class="btn-secondary" onclick="showRatingModal('${booking.id}')" style="margin-top: 10px;">
                            <i class="fas fa-star"></i> Rate
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Load driver bookings
function loadDriverBookings() {
    const bookings = JSON.parse(localStorage.getItem('bookings'));
    const driverBookings = bookings.filter(b => b.driverId === currentUser.id)
                                   .sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate));
    
    const container = document.getElementById('driverBookings');
    
    if (driverBookings.length === 0) {
        container.innerHTML = '<p style="color: var(--gray-500); text-align: center; padding: 40px;">No passenger bookings yet.</p>';
        return;
    }
    
    container.innerHTML = driverBookings.map(booking => {
        const statusClass = `status-${booking.status}`;
        
        return `
            <div class="booking-item">
                <div class="booking-info">
                    <h4>${booking.from} → ${booking.to}</h4>
                    <div class="booking-meta">
                        <span>${booking.date} • ${booking.time}</span>
                        <span>${booking.seats} seat(s)</span>
                        <span class="booking-status ${statusClass}">${booking.status}</span>
                    </div>
                    <p style="color: var(--gray-600); margin-top: 10px;">Passenger: ${booking.passengerName}</p>
                </div>
                <div class="booking-right">
                    <div class="booking-price">₹${booking.fare}</div>
                    <div class="booking-actions">
                        ${booking.status === 'confirmed' ? `
                            <button class="btn-secondary" onclick="updateBookingStatus('${booking.id}', 'started')">
                                Start Ride
                            </button>
                        ` : ''}
                        ${booking.status === 'started' ? `
                            <button class="btn-primary" onclick="updateBookingStatus('${booking.id}', 'completed')">
                                Complete Ride
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Update booking status
function updateBookingStatus(bookingId, status) {
    const bookings = JSON.parse(localStorage.getItem('bookings'));
    const bookingIndex = bookings.findIndex(b => b.id === bookingId);
    
    if (bookingIndex !== -1) {
        bookings[bookingIndex].status = status;
        localStorage.setItem('bookings', JSON.stringify(bookings));
        
        // Add notification
        addNotification('Ride Status Updated', `Ride ${status} successfully.`, 'info');
        
        if (status === 'completed') {
            currentBookingForRating = bookingId;
            setTimeout(() => {
                showRatingModal(bookingId);
            }, 1000);
        }
        
        loadDriverBookings();
        showAlert(`Ride ${status} successfully!`, 'success');
    }
}

// Show rating modal
function showRatingModal(bookingId) {
    currentBookingForRating = bookingId;
    selectedRating = 0;
    setStarRating(0);
    document.getElementById('ratingComment').value = '';
    document.getElementById('ratingModal').classList.add('active');
}

// Set star rating
function setStarRating(rating) {
    const stars = document.querySelectorAll('.rating-stars i');
    const ratingText = document.querySelector('.rating-text');
    
    stars.forEach((star, index) => {
        star.classList.toggle('active', index < rating);
    });
    
    const ratingTexts = ['Select your rating', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
    ratingText.textContent = ratingTexts[rating];
}

// Submit rating
function submitRating() {
    const comment = document.getElementById('ratingComment').value;
    
    if (selectedRating === 0) {
        showAlert('Please select a rating', 'warning');
        return;
    }
    
    // Get booking info
    const bookings = JSON.parse(localStorage.getItem('bookings'));
    const bookingIndex = bookings.findIndex(b => b.id === currentBookingForRating);
    
    if (bookingIndex !== -1) {
        const booking = bookings[bookingIndex];
        
        // Update booking
        booking.isRated = true;
        
        // Add rating
        const ratings = JSON.parse(localStorage.getItem('ratings'));
        ratings.push({
            id: Date.now().toString(),
            bookingId: currentBookingForRating,
            driverId: booking.driverId,
            passengerId: booking.passengerId,
            rating: selectedRating,
            comment,
            date: new Date().toISOString()
        });
        
        // Update driver rating
        const users = JSON.parse(localStorage.getItem('users'));
        const driverIndex = users.findIndex(u => u.id === booking.driverId);
        
        if (driverIndex !== -1) {
            if (!users[driverIndex].ratings) {
                users[driverIndex].ratings = [];
            }
            users[driverIndex].ratings.push(selectedRating);
            
            // Calculate average rating
            const avgRating = users[driverIndex].ratings.reduce((a, b) => a + b, 0) / 
                             users[driverIndex].ratings.length;
            users[driverIndex].rating = avgRating.toFixed(1);
        }
        
        // Save data
        localStorage.setItem('bookings', JSON.stringify(bookings));
        localStorage.setItem('ratings', JSON.stringify(ratings));
        localStorage.setItem('users', JSON.stringify(users));
        
        // Add notification
        addNotification('Rating Submitted', 'Thank you for your feedback!', 'success');
        
        // Close modal
        document.getElementById('ratingModal').classList.remove('active');
        
        // Reset form
        setStarRating(0);
        document.getElementById('ratingComment').value = '';
        
        // Reload data
        if (currentUser.type === 'passenger') {
            loadPassengerBookings();
        } else {
            loadDriverBookings();
            updateDriverStats();
        }
        
        showAlert('Thank you for your rating!', 'success');
    }
}

// Calculate driver rating
function calculateDriverRating(driverId) {
    const ratings = JSON.parse(localStorage.getItem('ratings'));
    const driverRatings = ratings.filter(r => r.driverId === driverId);
    
    if (driverRatings.length === 0) return 5.0;
    
    const average = driverRatings.reduce((sum, r) => sum + r.rating, 0) / driverRatings.length;
    return average;
}

// Get star rating HTML
function getStarRating(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    
    let stars = '';
    for (let i = 0; i < fullStars; i++) stars += '<i class="fas fa-star"></i>';
    if (halfStar) stars += '<i class="fas fa-star-half-alt"></i>';
    for (let i = 0; i < emptyStars; i++) stars += '<i class="far fa-star"></i>';
    
    return stars;
}

// Update driver stats
function updateDriverStats() {
    const users = JSON.parse(localStorage.getItem('users'));
    const driver = users.find(u => u.id === currentUser.id);
    
    if (driver) {
        document.getElementById('driverRating').textContent = driver.rating || '0.0';
        document.getElementById('totalRides').textContent = driver.totalRides || '0';
        
        // Calculate today's earnings
        const bookings = JSON.parse(localStorage.getItem('bookings'));
        const today = new Date().toISOString().split('T')[0];
        const todayEarnings = bookings
            .filter(b => b.driverId === currentUser.id && b.date === today && b.status === 'completed')
            .reduce((sum, b) => sum + b.fare, 0);
        
        document.getElementById('todayEarnings').textContent = todayEarnings;
    }
}

// Add money to wallet
function addMoney() {
    document.getElementById('addMoneyModal').classList.add('active');
}

function confirmAddMoney() {
    const customAmount = document.getElementById('customAmount').value;
    const amount = customAmount ? parseInt(customAmount) : 
                  document.querySelector('.amount-option.active')?.dataset.amount || 0;
    
    if (!amount || isNaN(amount) || amount <= 0) {
        showAlert('Please enter a valid amount', 'warning');
        return;
    }
    
    if (amount > 10000) {
        showAlert('Maximum amount per transaction is ₹10,000', 'warning');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('users'));
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    
    if (userIndex !== -1) {
        users[userIndex].wallet = (users[userIndex].wallet || 0) + parseInt(amount);
        currentUser.wallet = users[userIndex].wallet;
        
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // Add notification
        addNotification('Wallet Recharged', `₹${amount} added to your wallet.`, 'success');
        
        updateUserInfo();
        document.getElementById('addMoneyModal').classList.remove('active');
        
        showAlert(`₹${amount} added to wallet successfully!`, 'success');
    }
}

// Edit route
function editRoute(rideId) {
    const rides = JSON.parse(localStorage.getItem('rides'));
    const ride = rides.find(r => r.id === rideId);
    
    if (!ride) return;
    
    const newFare = prompt('Enter new fare per person:', ride.farePerPerson);
    if (newFare && !isNaN(newFare) && newFare >= 50) {
        ride.farePerPerson = parseInt(newFare);
        localStorage.setItem('rides', JSON.stringify(rides));
        loadDriverRoutes();
        showAlert('Fare updated successfully!', 'success');
    }
}

// Cancel route
function cancelRoute(rideId) {
    if (!confirm('Are you sure you want to cancel this route? All pending bookings will be cancelled.')) return;
    
    const rides = JSON.parse(localStorage.getItem('rides'));
    const rideIndex = rides.findIndex(r => r.id === rideId);
    
    if (rideIndex !== -1) {
        rides[rideIndex].status = 'cancelled';
        localStorage.setItem('rides', JSON.stringify(rides));
        
        // Add notification
        addNotification('Route Cancelled', 'Your route has been cancelled.', 'warning');
        
        loadDriverRoutes();
        updateDriverStats();
        showAlert('Route cancelled successfully!', 'success');
    }
}

// Show ride details
function showRideDetails(rideId) {
    const rides = JSON.parse(localStorage.getItem('rides'));
    const ride = rides.find(r => r.id === rideId);
    
    if (!ride) return;
    
    const details = `
        <strong>Ride Details:</strong><br><br>
        <strong>From:</strong> ${ride.from}<br>
        <strong>To:</strong> ${ride.to}<br>
        <strong>Date:</strong> ${ride.date}<br>
        <strong>Time:</strong> ${ride.time}<br>
        <strong>Available Seats:</strong> ${ride.availableSeats}<br>
        <strong>Fare per person:</strong> ₹${ride.farePerPerson}<br>
        <strong>Status:</strong> ${ride.status}
    `;
    
    alert(details);
}

// Show notifications
function showNotifications() {
    const notifications = JSON.parse(localStorage.getItem('notifications'));
    const container = document.getElementById('notificationList');
    
    container.innerHTML = notifications.map(notification => `
        <div class="notification-item ${notification.read ? 'read' : 'unread'}" onclick="markAsRead('${notification.id}')">
            <div class="notification-icon">
                ${notification.type === 'success' ? '<i class="fas fa-check-circle"></i>' :
                  notification.type === 'warning' ? '<i class="fas fa-exclamation-triangle"></i>' :
                  notification.type === 'promo' ? '<i class="fas fa-gift"></i>' :
                  '<i class="fas fa-info-circle"></i>'}
            </div>
            <div class="notification-content">
                <h4>${notification.title}</h4>
                <p>${notification.message}</p>
                <span class="notification-time">${formatTime(notification.date)}</span>
            </div>
            ${!notification.read ? '<div class="notification-dot"></div>' : ''}
        </div>
    `).join('');
    
    notificationModal.classList.add('active');
}

function closeNotificationModal() {
    notificationModal.classList.remove('active');
}

function markAsRead(notificationId) {
    const notifications = JSON.parse(localStorage.getItem('notifications'));
    const notificationIndex = notifications.findIndex(n => n.id === notificationId);
    
    if (notificationIndex !== -1) {
        notifications[notificationIndex].read = true;
        localStorage.setItem('notifications', JSON.stringify(notifications));
        updateNotificationCount();
        showNotifications();
    }
}

function updateNotificationCount() {
    const notifications = JSON.parse(localStorage.getItem('notifications'));
    const unreadCount = notifications.filter(n => !n.read).length;
    
    const countElement = document.querySelector('.notification-count');
    countElement.textContent = unreadCount;
    countElement.style.display = unreadCount > 0 ? 'flex' : 'none';
}

function addNotification(title, message, type = 'info') {
    const notifications = JSON.parse(localStorage.getItem('notifications'));
    
    notifications.unshift({
        id: Date.now().toString(),
        title,
        message,
        type,
        read: false,
        date: new Date().toISOString()
    });
    
    localStorage.setItem('notifications', JSON.stringify(notifications));
    updateNotificationCount();
}

function formatTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
}

// Logout
function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        currentUser = null;
        isLoggedIn = false;
        localStorage.removeItem('currentUser');
        sessionStorage.removeItem('currentUser');
        
        mainContainer.classList.remove('active');
        authModal.classList.add('active');
        switchAuthTab('login');
        
        showAlert('Logged out successfully!', 'success');
    }
}

// Clear signup form
function clearSignupForm() {
    document.getElementById('signupName').value = '';
    document.getElementById('signupEmail').value = '';
    document.getElementById('signupPhone').value = '';
    document.getElementById('signupPassword').value = '';
    document.getElementById('confirmPassword').value = '';
    document.getElementById('driverLicense').value = '';
    document.getElementById('vehicleModel').value = '';
    document.getElementById('vehicleNumber').value = '';
    document.getElementById('agreeTerms').checked = false;
    document.getElementById('photoPreview').innerHTML = '';
    document.querySelectorAll('.user-type-select-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('.user-type-select-btn[data-type="passenger"]').classList.add('active');
    document.getElementById('driverFields').classList.add('hidden');
}

// Debounce function for API calls
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Load passenger dashboard
function loadPassengerDashboard() {
    updateSeatDisplay();
    loadPassengerBookings();
}

// Load driver dashboard
function loadDriverDashboard() {
    loadDriverRoutes();
    loadDriverBookings();
    updateDriverStats();
}

// Show alert
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.innerHTML = `
        ${type === 'success' ? '<i class="fas fa-check-circle"></i>' :
          type === 'error' ? '<i class="fas fa-exclamation-circle"></i>' :
          type === 'warning' ? '<i class="fas fa-exclamation-triangle"></i>' :
          '<i class="fas fa-info-circle"></i>'}
        <span>${message}</span>
    `;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        alertDiv.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(alertDiv);
        }, 300);
    }, 3000);
}

// Add CSS for alerts
const alertCSS = document.createElement('style');
alertCSS.textContent = `
    .alert {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        border-radius: var(--radius-lg);
        display: flex;
        align-items: center;
        gap: 12px;
        z-index: 9999;
        transform: translateX(100%);
        opacity: 0;
        transition: all 0.3s ease;
        max-width: 400px;
        box-shadow: var(--shadow-xl);
    }
    
    .alert.show {
        transform: translateX(0);
        opacity: 1;
    }
    
    .alert-success {
        background: linear-gradient(135deg, var(--success-color), var(--secondary-dark));
        color: white;
        border-left: 4px solid white;
    }
    
    .alert-error {
        background: linear-gradient(135deg, var(--danger-color), #f87171);
        color: white;
        border-left: 4px solid white;
    }
    
    .alert-warning {
        background: linear-gradient(135deg, var(--warning-color), #fbbf24);
        color: white;
        border-left: 4px solid white;
    }
    
    .alert-info {
        background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
        color: white;
        border-left: 4px solid white;
    }
    
    .alert i {
        font-size: 1.2rem;
    }
`;
document.head.appendChild(alertCSS);
