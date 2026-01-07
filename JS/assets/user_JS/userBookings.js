// Combined User Bookings JS
// Loads, displays, and allows editing of bookings with modal

document.addEventListener("DOMContentLoaded", () => {
  // Table and modal elements
  const bookingsTable = document.getElementById("bookingsTable");
  const bookingsTableBody = bookingsTable?.querySelector("tbody");
  const searchInput = document.getElementById("bookingsSearch");
  const newBookingBtnTop = document.getElementById("newBookingBtnTop");
  const statTotal = document.getElementById("statTotal");
  const statConfirmed = document.getElementById("statConfirmed");
  const statCancelled = document.getElementById("statCancelled");
  const bookingsCountLabel = document.getElementById("bookingsCountLabel");

  // Modal elements
  const editModal = document.getElementById('editBookingModal');
  const closeEditModal = document.getElementById('closeEditModal');
  const editBookingForm = document.getElementById('editBookingForm');
  // Form fields
  const editBookingId = document.getElementById('editBookingId');
  const editClientName = document.getElementById('editClientName');
  const editClientEmail = document.getElementById('editClientEmail');
  const editClientContact = document.getElementById('editClientContact');
  const editDestination = document.getElementById('editDestination');
  const editPackageName = document.getElementById('editPackageName');
    const editBookingDate = document.getElementById('editBookingDate');
  const editPax = document.getElementById('editPax');
  const editTotalAmount = document.getElementById('editTotalAmount');
  const editStatus = document.getElementById('editStatus');
  const editSpecialRequests = document.getElementById('editSpecialRequests');
  const editAddons = document.getElementById('editAddons');

  let allBookings = [];
  let searchTimeout = null;

  function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function getStatusClass(status) {
    const statusMap = {
      'Pending': 'status-pending',
      'Confirmed': 'status-confirmed',
      'Completed': 'status-completed',
      'Cancelled': 'status-cancelled'
    };
    return statusMap[status] || 'status-pending';
  }

  async function loadBookings(searchQuery = '') {
    try {
      if (bookingsTableBody) {
        bookingsTableBody.innerHTML = '<tr><td colspan="8" class="loading">Loading bookings...</td></tr>';
      }
      const url = searchQuery 
        ? `api/bookings_list.php?q=${encodeURIComponent(searchQuery)}`
        : 'api/bookings_list.php';
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        allBookings = data.bookings;
        renderBookings(allBookings);
        updateStats(data.stats);
      } else {
        throw new Error(data.error || 'Failed to load bookings');
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
      if (bookingsTableBody) {
        bookingsTableBody.innerHTML = '<tr><td colspan="8" class="error">Failed to load bookings. Please refresh the page.</td></tr>';
      }
    }
  }

  function renderBookings(bookings) {
    if (!bookingsTableBody) return;
    if (!bookings.length) {
      bookingsTableBody.innerHTML = `
        <tr>
          <td colspan="8" class="no-data">
            No bookings found. <a href="Bookings/bookings1.html">Create your first booking</a>
          </td>
        </tr>
      `;
      if (bookingsCountLabel) bookingsCountLabel.textContent = `0 booking(s)`;
      return;
    }
    bookingsTableBody.innerHTML = bookings.map(booking => `
      <tr data-id="${booking.id}">
        <td><strong>${booking.ref || 'BK-' + String(booking.id).padStart(4, '0')}</strong></td>
        <td>
          <div class="client-info">
            <span class="client-name">${booking.clientName || 'Unknown'}</span>
            ${booking.clientEmail ? `<span class="client-email">${booking.clientEmail}</span>` : ''}
          </div>
        </td>
        <td>${booking.destination || 'N/A'}</td>
        <td>${booking.packageName || 'N/A'}</td>
        <td>${formatDate(booking.startDate)}</td>
        <td>
          <span class="status-badge ${getStatusClass(booking.status)}">
            ${booking.status || 'Pending'}
          </span>
        </td>
        <td class="actions-cell">
          <button class="btn-action btn-view" data-id="${booking.id}" title="View">👁</button>
          <button class="btn-action btn-edit" data-id="${booking.id}" title="Edit">✏️</button>
          <button class="btn-action btn-delete" data-id="${booking.id}" title="Cancel">🗑️</button>
        </td>
      </tr>
    `).join('');
    if (bookingsCountLabel) {
      bookingsCountLabel.textContent = `${bookings.length} booking(s)`;
    }
  }

  function updateStats(stats) {
    if (statTotal) statTotal.textContent = stats.total || 0;
    if (statConfirmed) statConfirmed.textContent = stats.confirmed || 0;
    if (statCancelled) statCancelled.textContent = stats.cancelled || 0;
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      if (searchTimeout) clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        loadBookings(query);
      }, 300);
    });
  }

  if (newBookingBtnTop) {
    newBookingBtnTop.addEventListener('click', () => {
      sessionStorage.removeItem('cht_booking_state');
      window.location.href = 'Bookings/bookings1.html';
    });
  }

  if (bookingsTableBody) {
    bookingsTableBody.addEventListener('click', async (e) => {
      const btn = e.target.closest('.btn-action');
      if (!btn) return;
      const bookingId = btn.dataset.id;
      const booking = allBookings.find(b => b.id === parseInt(bookingId));
      if (btn.classList.contains('btn-view')) {
        showBookingDetails(booking);
      } else if (btn.classList.contains('btn-edit')) {
        console.log('Edit button clicked for booking:', booking);
        if (!booking) {
          console.warn('No booking found for edit!');
          return;
        }
        editBookingId.value = booking.id;
        editClientName.value = booking.clientName || '';
        editClientEmail.value = booking.clientEmail || '';
        editClientContact.value = booking.clientContact || '';
        editBookingDate.value = booking.startDate ? booking.startDate.split('T')[0] : '';
        editPax.value = booking.pax || 1;
        editTotalAmount.value = booking.totalAmount || 0;
        editStatus.value = booking.status || 'Pending';
        editSpecialRequests.value = booking.specialRequests || '';
        editAddons.value = (booking.addons && Array.isArray(booking.addons)) ? booking.addons.join(', ') : '';
        if (editModal) {
          // Fire event to populate dropdowns and select current values
          const event = new CustomEvent('showEditModal', { detail: { packageName: booking.packageName, destination: booking.destination } });
          editModal.dispatchEvent(event);
          editModal.style.display = 'block';
          console.log('Edit modal opened');
        } else {
          console.warn('Edit modal element not found!');
        }
      } else if (btn.classList.contains('btn-delete')) {
        if (confirm(`Are you sure you want to delete booking ${booking.ref}? This cannot be undone.`)) {
          try {
            const response = await fetch('api/bookings_delete.php', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' }
            });
            const result = await response.json();
            if (result.success) {
              alert('Booking deleted successfully!');
              loadBookings();
            } else {
              alert('Failed to delete booking: ' + (result.error || 'Unknown error'));
            }
          } catch (err) {
            alert('Error deleting booking: ' + err.message);
          }
        }
      }
    });
  }

  if (closeEditModal && editModal) {
    closeEditModal.onclick = () => {
      editModal.style.display = 'none';
    };
  }
  window.onclick = function(event) {
    if (event.target === editModal) {
      editModal.style.display = 'none';
    }
  };

  if (editBookingForm) {
    editBookingForm.onsubmit = async function(e) {
      e.preventDefault();
      const updated = {
        bookingId: editBookingId.value,
        clientName: editClientName.value,
        clientEmail: editClientEmail.value,
        clientContact: editClientContact.value,
        destination: editDestination.value,
        packageName: editPackageName.value,
        bookingDate: editBookingDate.value,
        pax: editPax.value,
        totalAmount: editTotalAmount.value,
        status: editStatus.value,
        specialRequests: editSpecialRequests.value,
        addons: editAddons.value.split(',').map(a => a.trim()).filter(a => a)
      };
      try {
        const response = await fetch('api/bookings_update.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated)
        });
        const result = await response.json();
        if (result.success) {
          alert('Booking updated successfully!');
          if (editModal) editModal.style.display = 'none';
          loadBookings();
        } else {
          alert('Failed to update booking: ' + (result.error || 'Unknown error'));
        }
      } catch (err) {
        alert('Error updating booking: ' + err.message);
      }
    };
  }

  function showBookingDetails(booking) {
    const total = booking.totalAmount || 0;
    const details = `
Booking Reference: ${booking.ref}
----------------------------------------
Customer: ${booking.clientName}
Email: ${booking.clientEmail || 'N/A'}
Contact: ${booking.clientContact || 'N/A'}

Package: ${booking.packageName}
Destination: ${booking.destination}

Hotel: ${booking.hotelName || 'Not selected'}
Transportation: ${booking.vehicleType ? `${booking.vehicleType} - ${booking.vehicleProvider}` : 'Not selected'}

Booking Date: ${formatDate(booking.startDate)}
Number of Pax: ${booking.pax}

Total Amount: PHP ${total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
Status: ${booking.status}

Special Requests: ${booking.specialRequests || 'None'}
    `.trim();
    alert(details);
  }

  async function updateBookingStatus(bookingId, status) {
    try {
      const response = await fetch('api/bookings_update.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, status })
      });
      const result = await response.json();
      if (result.success) {
        alert(`Booking status updated to: ${status}`);
        loadBookings();
      } else {
        throw new Error(result.error || 'Failed to update booking');
      }
    } catch (error) {
      console.error('Error updating booking:', error);
      alert('Failed to update booking status: ' + error.message);
    }
  }

  const logoutBtn = document.getElementById("userLogoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      sessionStorage.removeItem('cht_booking_state');
      localStorage.removeItem('cht_current_username');
      window.location.href = '../log_in.html';
    });
  }

  loadBookings();
});
