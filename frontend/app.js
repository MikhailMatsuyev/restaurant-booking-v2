const API_URL = 'http://localhost:3000';

let events = [];
let userBookings = [];

function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type} show`;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 4000);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getSeatsClass(availableSeats, totalSeats) {
    const percentage = (availableSeats / totalSeats) * 100;
    if (availableSeats === 0) return 'seats-full';
    if (percentage < 20) return 'seats-low';
    return 'seats-available';
}

async function fetchEvents() {
    try {
        const response = await fetch(`${API_URL}/events`);
        const result = await response.json();
        
        if (result.success) {
            events = result.data;
            renderEvents();
        } else {
            showNotification('Failed to load events', 'error');
        }
    } catch (error) {
        console.error('Error fetching events:', error);
        showNotification('Error connecting to server', 'error');
    }
}

async function reserveBooking(eventId) {
    const userId = document.getElementById('userId').value.trim();
    
    if (!userId) {
        showNotification('Please enter your User ID', 'error');
        return;
    }

    const button = document.querySelector(`[data-event-id="${eventId}"]`);
    button.disabled = true;
    button.textContent = 'Booking...';

    try {
        const response = await fetch(`${API_URL}/api/bookings/reserve`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                event_id: eventId,
                user_id: userId,
            }),
        });

        const result = await response.json();

        if (result.success) {
            showNotification(
                `✅ Booking successful! Booking ID: ${result.data.booking_id}`,
                'success'
            );

            // Refresh events to update available seats
            await fetchEvents();
        } else {
            // Более понятные сообщения об ошибках
            let errorMessage = result.error;

            if (errorMessage.includes('already booked')) {
                errorMessage = '⚠️ You have already booked this event!';
            } else if (errorMessage.includes('No available seats')) {
                errorMessage = '😢 Sorry, no seats available for this event!';
            }

            showNotification(errorMessage, 'error');
        }
    } catch (error) {
        console.error('Error creating booking:', error);
        showNotification('Error creating booking', 'error');
    } finally {
        button.disabled = false;
        button.textContent = 'Book Now';
    }
}

async function fetchUserBookings() {
    const userId = document.getElementById('userId').value.trim();
    
    if (!userId) {
        showNotification('Please enter your User ID', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/bookings/user/${userId}`);
        const result = await response.json();
        
        if (result.success) {
            userBookings = result.data;
            renderUserBookings();
            showNotification(`Loaded ${userBookings.length} bookings`, 'success');
        } else {
            showNotification('Failed to load bookings', 'error');
        }
    } catch (error) {
        console.error('Error fetching user bookings:', error);
        showNotification('Error loading bookings', 'error');
    }
}

function renderEvents() {
    const eventsList = document.getElementById('eventsList');
    
    if (events.length === 0) {
        eventsList.innerHTML = '<div class="empty-state">No events available</div>';
        return;
    }

    eventsList.innerHTML = events.map(event => {
        const seatsClass = getSeatsClass(parseInt(event.available_seats), parseInt(event.total_seats));
        const isFullyBooked = parseInt(event.available_seats) === 0;
        
        return `
            <div class="event-card">
                <h3>${event.name}</h3>
                <div class="event-info">
                    <div class="event-info-item">
                        <span class="event-info-label">Total Seats:</span>
                        <span class="event-info-value">${event.total_seats}</span>
                    </div>
                    <div class="event-info-item">
                        <span class="event-info-label">Booked:</span>
                        <span class="event-info-value">${event.booked_seats}</span>
                    </div>
                    <div class="event-info-item">
                        <span class="event-info-label">Available:</span>
                        <span class="event-info-value ${seatsClass}">
                            ${event.available_seats}
                        </span>
                    </div>
                </div>
                <button 
                    class="btn btn-primary" 
                    data-event-id="${event.id}"
                    onclick="reserveBooking(${event.id})"
                    ${isFullyBooked ? 'disabled' : ''}
                >
                    ${isFullyBooked ? 'Fully Booked' : 'Book Now'}
                </button>
            </div>
        `;
    }).join('');
}

function renderUserBookings() {
    const bookingsList = document.getElementById('bookingsList');
    
    if (userBookings.length === 0) {
        bookingsList.innerHTML = '<div class="empty-state">No bookings found</div>';
        return;
    }

    bookingsList.innerHTML = userBookings.map(booking => `
        <div class="booking-card">
            <h4>🎫 ${booking.event_name}</h4>
            <p><strong>Booking ID:</strong> ${booking.id}</p>
            <p><strong>Event ID:</strong> ${booking.event_id}</p>
            <p><strong>Booked at:</strong> ${formatDate(booking.created_at)}</p>
        </div>
    `).join('');
}

document.getElementById('loadBookingsBtn').addEventListener('click', fetchUserBookings);

document.addEventListener('DOMContentLoaded', () => {
    fetchEvents();
    console.log('🚀 Event Booking System initialized');
});
