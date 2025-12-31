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

// Global variables
let currentUser = null;
let isLoggedIn = false;
let currentBookingForRating = null;

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
const userTypeSelect = document.getElementById('userType');
const driverFields = document.getElementById('driverFields');
const passengerBtn = document.getElementById('passengerBtn');
const driverBtn = document.getElementById('driverBtn');
const passengerSection = document.getElementById('passengerSection');
const driverSection = document.getElementById('driverSection');

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
    setupEventListeners();
    setupLocationAutocomplete();
    
    // Set minimum dates
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('travelDate').min = today;
    document.getElementById('driverDate').min = today;
    
    // Set current time
    const now = new Date();
    const currentTime = now.toTimeString().substring(0, 5);
    document.getElementById('travelTime').value = currentTime;
    document.getElementById('departureTime').value = currentTime;
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
    
    // Signup user type change
    userTypeSelect.addEventListener('change', function() {
        driverFields.classList.toggle('hidden', this.value !== 'driver');
    });
    
    // File upload preview
    document.getElementById('vehicleDocs').addEventListener('change', handleFileUpload);
    document.getElementById('driverPhoto').addEventListener('change', handlePhotoUpload);
    
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
            const rating = parseInt(this.dataset.rating);
            setStarRating(rating);
        });
    });
    
    document.getElementById('submitRating').addEventListener('click', submitRating);
    document.getElementById('cancelRating').addEventListener('click', () => {
        document.getElementById('ratingModal').classList.remove('active');
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
    }
}

// Handle Login
async function handleLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const userType = document.querySelector('.user-type-btn.active').dataset.type;
    
    if (!email || !password) {
        alert('Please enter email and password');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('users'));
    const user = users.find(u => u.email === email && u.password === password && u.type === userType);
    
    if (user) {
        // Remove sensitive data
        const { password: _, ...safeUser } = user;
        currentUser = safeUser;
        localStorage.setItem('currentUser', JSON.stringify(safeUser));
        isLoggedIn = true;
        
        showMainApp();
        loadUserDashboard();
        
        // Clear form
        document.getElementById('loginEmail').value = '';
        document.getElementById('loginPassword').value = '';
    } else {
        alert('Invalid credentials or user type');
    }
}

// Handle Signup
async function handleSignup() {
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const phone = document.getElementById('signupPhone').value.trim();
    const password = document.getElementById('signupPassword').value.trim();
    const userType = document.getElementById('userType').value;
    const agreeTerms = document.getElementById('agreeTerms').checked;
    
    // Validation
    if (!name || !email || !phone || !password) {
        alert('Please fill all required fields');
        return;
    }
    
    if (password.length < 6) {
        alert('Password must be at least 6 characters');
        return;
    }
    
    if (!agreeTerms) {
        alert('Please agree to terms and conditions');
        return;
    }
    
    if (userType === 'driver') {
        const license = document.getElementById('driverLicense').value.trim();
        const vehicleModel = document.getElementById('vehicleModel').value.trim();
        const vehicleNumber = document.getElementById('vehicleNumber').value.trim();
        
        if (!license || !vehicleModel || !vehicleNumber) {
            alert('Please fill all driver fields');
            return;
        }
    }
    
    // Check if user already exists
    const users = JSON.parse(localStorage.getItem('users'));
    if (users.some(u => u.email === email)) {
        alert('User with this email already exists');
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
        totalEarnings: userType === 'driver' ? 0 : null
    };
    
    // Add driver specific data
    if (userType === 'driver') {
        user.licenseNumber = document.getElementById('driverLicense').value.trim();
        user.vehicleModel = document.getElementById('vehicleModel').value.trim();
        user.vehicleNumber = document.getElementById('vehicleNumber').value.trim();
        user.vehicleDocs = []; // In real app, store uploaded file URLs
        user.profilePhoto = null; // In real app, store photo URL
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
    
    showMainApp();
    loadUserDashboard();
    
    // Clear form
    clearSignupForm();
    
    alert('Account created successfully!');
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
            <p>${currentUser.type === 'driver' ? 'Driver' : 'Passenger'}</p>
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
    passengerSection.classList.toggle('active', type === 'passenger');
    driverSection.classList.toggle('active', type === 'driver');
    
    // Update passenger specific elements
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
function handleFileUpload(e) {
    const files = Array.from(e.target.files);
    const preview = document.getElementById('docPreview');
    
    files.forEach(file => {
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            alert('File too large: ' + file.name);
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';
            previewItem.innerHTML = `
                <img src="${e.target.result}" alt="${file.name}">
                <button class="remove-file" onclick="removeFile(this)">×</button>
            `;
            preview.appendChild(previewItem);
        };
        
        if (file.type.startsWith('image/')) {
            reader.readAsDataURL(file);
        } else {
            // For PDFs, show icon
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';
            previewItem.innerHTML = `
                <i class="fas fa-file-pdf" style="font-size: 3rem; color: #e74c3c;"></i>
                <p style="font-size: 0.8rem; margin-top: 5px;">${file.name}</p>
                <button class="remove-file" onclick="removeFile(this)">×</button>
            `;
            preview.appendChild(previewItem);
        }
    });
}

function handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
    }
    
    if (file.size > 2 * 1024 * 1024) { // 2MB limit
        alert('Image too large. Max 2MB');
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
    // This is a simplified version
    // In production, integrate with Google Maps API or similar
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
        const fare = calculateFare(distance);
        
        // Update UI based on current section
        if (document.getElementById('passengerSection').classList.contains('active')) {
            document.getElementById('estimatedDistance').textContent = distance.toFixed(1) + ' km';
            document.getElementById('estimatedTime').textContent = Math.round(time) + ' mins';
            document.getElementById('estimatedFare').textContent = '₹' + fare;
        } else {
            document.getElementById('routeDistance').textContent = distance.toFixed(1) + ' km';
            document.getElementById('recommendedFare').textContent = Math.round(fare / 4); // Per person
            document.getElementById('farePerPerson').value = Math.round(fare / 4);
        }
    } catch (error) {
        console.error('Error calculating distance:', error);
    }
}

function calculateFare(distance) {
    const baseFare = 50;
    const perKm = 15;
    const passengers = parseInt(document.getElementById('passengerCount')?.value || 1);
    const rideType = document.getElementById('rideType')?.value || 'economy';
    
    let multiplier = 1;
    switch (rideType) {
        case 'premium': multiplier = 1.5; break;
        case 'luxury': multiplier = 2; break;
    }
    
    return Math.round((baseFare + (distance * perKm)) * multiplier * passengers);
}

// Search available rides
async function searchAvailableRides() {
    const from = document.getElementById('fromLocation').value;
    const to = document.getElementById('toLocation').value;
    const date = document.getElementById('travelDate').value;
    const seats = parseInt(document.getElementById('passengerCount').value);
    
    if (!from || !to || !date) {
        alert('Please fill all fields');
        return;
    }
    
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
    
    displayAvailableRides(ridesWithDriverInfo, seats);
}

// Display available rides
function displayAvailableRides(rides, requiredSeats) {
    const container = document.getElementById('availableRides');
    
    if (rides.length === 0) {
        container.innerHTML = `
            <div class="ride-card">
                <p>No rides available for your search. Please try different criteria.</p>
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
                            <span>${driverRating.toFixed(1)}</span>
                        </div>
                        <p>${ride.driver.vehicleModel} • ${ride.driver.vehicleNumber}</p>
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
                    <button class="btn-book" onclick="bookRide('${ride.id}', ${requiredSeats})">
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
function bookRide(rideId, seats) {
    const ride = JSON.parse(localStorage.getItem('rides')).find(r => r.id === rideId);
    if (!ride) {
        alert('Ride not found');
        return;
    }
    
    if (currentUser.wallet < (ride.farePerPerson * seats)) {
        alert('Insufficient wallet balance. Please add money.');
        return;
    }
    
    // Create booking
    const booking = {
        id: Date.now().toString(),
        passengerId: currentUser.id,
        passengerName: currentUser.name,
        driverId: ride.driverId,
        rideId: rideId,
        from: ride.from,
        to: ride.to,
        date: ride.date,
        time: ride.time,
        seats: seats,
        fare: ride.farePerPerson * seats,
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
    }
    
    // Save data
    const bookings = JSON.parse(localStorage.getItem('bookings'));
    bookings.push(booking);
    
    const rides = JSON.parse(localStorage.getItem('rides'));
    const rideIndex = rides.findIndex(r => r.id === rideId);
    rides[rideIndex] = ride;
    
    users.find(u => u.id === currentUser.id).wallet = currentUser.wallet;
    
    localStorage.setItem('bookings', JSON.stringify(bookings));
    localStorage.setItem('rides', JSON.stringify(rides));
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    // Update UI
    updateUserInfo();
    loadPassengerBookings();
    
    alert(`Booking confirmed! ₹${booking.fare} deducted from wallet.`);
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
        alert('Please fill all fields');
        return;
    }
    
    if (fare < 50) {
        alert('Minimum fare is ₹50 per person');
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
    
    // Clear form
    document.getElementById('driverFrom').value = '';
    document.getElementById('driverTo').value = '';
    document.getElementById('farePerPerson').value = '200';
    
    loadDriverRoutes();
    alert('Route published successfully!');
}

// Load driver routes
function loadDriverRoutes() {
    const rides = JSON.parse(localStorage.getItem('rides'));
    const driverRides = rides.filter(r => r.driverId === currentUser.id && r.status === 'active');
    
    const container = document.getElementById('activeRoutes');
    
    if (driverRides.length === 0) {
        container.innerHTML = '<p>No active routes. Add a new route above.</p>';
        return;
    }
    
    container.innerHTML = driverRides.map(ride => `
        <div class="ride-card">
            <div class="route">
                <i class="fas fa-route"></i>
                <strong>${ride.from} → ${ride.to}</strong>
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
                <button class="btn-book" onclick="cancelRoute('${ride.id}')" style="background: #ef4444;">
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
                                     .sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate));
    
    const container = document.getElementById('passengerBookings');
    
    if (passengerBookings.length === 0) {
        container.innerHTML = '<p>No bookings yet.</p>';
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
                    <p>Driver: ${booking.driverName || 'Unknown'}</p>
                </div>
                <div class="booking-right">
                    <div class="booking-price">₹${booking.fare}</div>
                    ${canRate ? `
                        <button class="btn-secondary" onclick="showRatingModal('${booking.id}')">
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
        container.innerHTML = '<p>No passenger bookings yet.</p>';
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
                    <p>Passenger: ${booking.passengerName}</p>
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
        
        if (status === 'completed') {
            currentBookingForRating = bookingId;
            showRatingModal(bookingId);
        }
        
        loadDriverBookings();
    }
}

// Show rating modal
function showRatingModal(bookingId) {
    currentBookingForRating = bookingId;
    document.getElementById('ratingModal').classList.add('active');
}

// Set star rating
function setStarRating(rating) {
    const stars = document.querySelectorAll('.rating-stars i');
    stars.forEach((star, index) => {
        star.classList.toggle('active', index < rating);
    });
}

// Submit rating
function submitRating() {
    const stars = document.querySelectorAll('.rating-stars i.active');
    const rating = stars.length;
    const comment = document.getElementById('ratingComment').value;
    
    if (rating === 0) {
        alert('Please select a rating');
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
            rating,
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
            users[driverIndex].ratings.push(rating);
            
            // Calculate average rating
            const avgRating = users[driverIndex].ratings.reduce((a, b) => a + b, 0) / 
                             users[driverIndex].ratings.length;
            users[driverIndex].rating = avgRating.toFixed(1);
        }
        
        // Save data
        localStorage.setItem('bookings', JSON.stringify(bookings));
        localStorage.setItem('ratings', JSON.stringify(ratings));
        localStorage.setItem('users', JSON.stringify(users));
        
        // Close modal
        document.getElementById('ratingModal').classList.remove('active');
        
        // Reset form
        setStarRating(0);
        document.getElementById('ratingComment').value = '';
        
        alert('Thank you for your rating!');
        
        // Reload data
        if (currentUser.type === 'passenger') {
            loadPassengerBookings();
        } else {
            loadDriverBookings();
            updateDriverStats();
        }
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
    const amount = prompt('Enter amount to add (₹):');
    if (!amount || isNaN(amount) || amount <= 0) {
        alert('Please enter a valid amount');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('users'));
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    
    if (userIndex !== -1) {
        users[userIndex].wallet = (users[userIndex].wallet || 0) + parseInt(amount);
        currentUser.wallet = users[userIndex].wallet;
        
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        updateUserInfo();
        alert(`₹${amount} added to wallet successfully!`);
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
        alert('Fare updated successfully!');
    }
}

// Cancel route
function cancelRoute(rideId) {
    if (!confirm('Are you sure you want to cancel this route?')) return;
    
    const rides = JSON.parse(localStorage.getItem('rides'));
    const rideIndex = rides.findIndex(r => r.id === rideId);
    
    if (rideIndex !== -1) {
        rides[rideIndex].status = 'cancelled';
        localStorage.setItem('rides', JSON.stringify(rides));
        loadDriverRoutes();
        alert('Route cancelled successfully!');
    }
}

// Show ride details
function showRideDetails(rideId) {
    const rides = JSON.parse(localStorage.getItem('rides'));
    const ride = rides.find(r => r.id === rideId);
    
    if (!ride) return;
    
    alert(`Ride Details:\n
From: ${ride.from}\n
To: ${ride.to}\n
Date: ${ride.date}\n
Time: ${ride.time}\n
Available Seats: ${ride.availableSeats}\n
Fare per person: ₹${ride.farePerPerson}\n
Status: ${ride.status}`);
}

// Logout
function handleLogout() {
    currentUser = null;
    isLoggedIn = false;
    localStorage.removeItem('currentUser');
    
    mainContainer.classList.remove('active');
    authModal.classList.add('active');
    switchAuthTab('login');
}

// Clear signup form
function clearSignupForm() {
    document.getElementById('signupName').value = '';
    document.getElementById('signupEmail').value = '';
    document.getElementById('signupPhone').value = '';
    document.getElementById('signupPassword').value = '';
    document.getElementById('driverLicense').value = '';
    document.getElementById('vehicleModel').value = '';
    document.getElementById('vehicleNumber').value = '';
    document.getElementById('agreeTerms').checked = false;
    document.getElementById('docPreview').innerHTML = '';
    document.getElementById('photoPreview').innerHTML = '';
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
