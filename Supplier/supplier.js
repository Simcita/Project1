/***********************
 * Firebase Initialization
 ***********************/
const firebaseConfig = {
    apiKey: "AIzaSyBEGJ8Sfw8nOZCN3wY8YhBtlGVp67tUCcg",
    authDomain: "project-01-fffa5.firebaseapp.com",
    projectId: "project-01-fffa5",
    storageBucket: "project-01-fffa5.firebasestorage.app",
    messagingSenderId: "989869504960",
    appId: "1:989869504960:web:910d5db9f752a21134f025"
  };
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

/***********************
 * Supplier Dashboard Code
 ***********************/

// DOM elements for supplier dashboard
const newOrderBtn = document.getElementById('newOrderBtn');
const manageInventoryBtn = document.getElementById('manageInventoryBtn');
const orderModal = document.getElementById('orderModal');
const closeBtn = document.querySelector('.close-btn');
const cancelOrderUpdate = document.getElementById('cancelOrderUpdate');
const updateOrderForm = document.getElementById('updateOrderForm');
let currentDocId = ''; // To store the current document ID being edited

// Open supplier modal with specific order data
function openModal(docId, orderId, companyName) {
  currentDocId = docId;
  
  // Fetch current order data to populate the form
  db.collection("orders")
    .doc(docId)
    .get()
    .then((doc) => {
      if (doc.exists) {
        const order = doc.data();
        document.getElementById('orderID').value = orderId;
        document.getElementById('customer').value = companyName;
        
        // Set the current status in dropdown
        const statusDropdown = document.getElementById('status');
        for (let i = 0; i < statusDropdown.options.length; i++) {
          if (statusDropdown.options[i].value === order.status.toLowerCase()) {
            statusDropdown.selectedIndex = i;
            break;
          }
        }
        
        // Set any existing notes
        document.getElementById('notes').value = order.notes || '';
        
        orderModal.style.display = 'block';
      }
    })
    .catch((error) => {
      console.error("Error fetching order details: ", error);
      alert("Error loading order details: " + error.message);
    });
}

// Close supplier modal
function closeModal() {
  orderModal.style.display = 'none';
  currentDocId = '';
}

// Event delegation for supplier update buttons
document.addEventListener('click', function (event) {
  if (event.target.classList.contains('update-btn')) {
    const docId = event.target.getAttribute('data-id');
    const row = event.target.closest('tr');
    const orderId = row.cells[0].textContent;
    const companyName = row.cells[1].textContent;
    openModal(docId, orderId, companyName);
  } else if (event.target.classList.contains('view-btn')) {
    const docId = event.target.getAttribute('data-id');
    viewOrderDetails(docId);
  }
});

// Attach event listeners for supplier modal close buttons
if (closeBtn) closeBtn.addEventListener('click', closeModal);
if (cancelOrderUpdate) cancelOrderUpdate.addEventListener('click', closeModal);

// Close supplier modal if clicked outside of it
window.addEventListener('click', (event) => {
  if (event.target === orderModal) {
    closeModal();
  }
});

// Load orders from Firestore (Supplier)
function loadOrders() {
  db.collection("orders")
    .get()
    .then((querySnapshot) => {
      let ordersHTML = '';
      let orders = [];
      querySnapshot.forEach((doc) => {
        const order = doc.data();
        orders.push({ ...order, id: doc.id });
        const orderDate = order.orderDate ? new Date(order.orderDate.seconds * 1000).toLocaleDateString() : 'Invalid Date';
        ordersHTML += `
          <tr>
            <td>${order.orderId}</td>
            <td>${order.companyName}</td>
            <td>${orderDate}</td>
            <td>R${order.total.toFixed(2)}</td>
            <td><span class="status status-${order.status.toLowerCase()}">${order.status}</span></td>
            <td class="action-buttons">
              <button class="action-btn view-btn" data-id="${doc.id}">View</button>
              <button class="action-btn update-btn" data-id="${doc.id}">Update</button>
            </td>
          </tr>
        `;
      });
      if (ordersHTML === '') {
        ordersHTML = '<tr><td colspan="6" style="text-align: center;">No orders found</td></tr>';
      }
      const ordersSection = document.querySelector('.orders-section tbody');
      if (ordersSection) ordersSection.innerHTML = ordersHTML;

      // Update statistics with real data
      updateStatistics(orders);
    })
    .catch((error) => {
      console.error("Error fetching orders: ", error);
      const ordersSection = document.querySelector('.orders-section tbody');
      if (ordersSection) {
        ordersSection.innerHTML =
          '<tr><td colspan="6" style="text-align: center; color: red;">Error loading orders</td></tr>';
      }
    });
}

// Function to update statistics with real data
function updateStatistics(orders) {
  // Calculate pending orders
  const pendingOrders = orders.filter(order => order.status.toLowerCase() === 'pending').length;
  const pendingStat = document.querySelector('.stat-card:nth-child(1) .value');
  if (pendingStat) {
    pendingStat.textContent = pendingOrders;
  }

  // Calculate total sales for the current month
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlySales = orders
    .filter(order => {
      const orderDate = order.orderDate ? new Date(order.orderDate.seconds * 1000) : null;
      return orderDate && 
             orderDate.getMonth() === currentMonth && 
             orderDate.getFullYear() === currentYear;
    })
    .reduce((sum, order) => sum + (parseFloat(order.total) || 0), 0);
  
  const salesStat = document.querySelector('.stat-card:nth-child(2) .value');
  if (salesStat) {
    salesStat.textContent = `R${monthlySales.toLocaleString()}`;
  }

  // Calculate active customers (unique companies with orders in the last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const activeCustomers = new Set(
    orders
      .filter(order => {
        const orderDate = order.orderDate ? new Date(order.orderDate.seconds * 1000) : null;
        return orderDate && orderDate >= thirtyDaysAgo;
      })
      .map(order => order.companyName)
  ).size;

  const customersStat = document.querySelector('.stat-card:nth-child(3) .value');
  if (customersStat) {
    customersStat.textContent = activeCustomers;
  }

  // Calculate pending queries
  db.collection("queries")
    .where("status", "==", "Pending")
    .get()
    .then(querySnapshot => {
      const pendingQueries = querySnapshot.size;
      const queriesStat = document.querySelector('.stat-card:nth-child(4) .value');
      if (queriesStat) {
        queriesStat.textContent = pendingQueries;
      }
    })
    .catch(error => {
      console.error("Error fetching queries: ", error);
    });
}

// Handle supplier order update form submission
if (updateOrderForm) {
  updateOrderForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!currentDocId) {
      alert('Error: Document ID not found');
      return;
    }
    
    const orderID = document.getElementById('orderID').value;
    const newStatus = document.getElementById('status').value;
    const notes = document.getElementById('notes').value;
    
    // Show loading state
    const submitBtn = updateOrderForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Updating...';
    submitBtn.disabled = true;
    
    db.collection("orders")
      .doc(currentDocId)
      .update({
        status: newStatus,
        notes: notes,
        lastUpdated: new Date() // Optional: add timestamp
      })
      .then(() => {
        alert(`Order ${orderID} updated to ${newStatus}`);
        closeModal();
        loadOrders(); // Refresh orders list
      })
      .catch((error) => {
        console.error("Error updating order: ", error);
        alert(`Error updating order: ${error.message}`);
      })
      .finally(() => {
        // Reset button state
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      });
  });
}

// Function to view order details
async function viewOrderDetails(docId) {
  console.log("Viewing order details for:", docId);
  
  const orderDetailsModal = document.getElementById('orderDetailsModal');
  if (!orderDetailsModal) {
    console.error("Order details modal not found");
    return;
  }
  
  try {
    const doc = await db.collection("orders").doc(docId).get();
    if (!doc.exists) {
      alert('Order not found.');
      return;
    }

    const order = doc.data();
    
    // Populate the order details modal with null checks
    const orderIdDisplay = document.getElementById('orderIdDisplay');
    if (orderIdDisplay) {
      orderIdDisplay.innerText = `Order ID: ${order.orderId || 'N/A'}`;
    }
    
    // Reset tracking steps with null checks
    for (let i = 1; i <= 4; i++) {
      const stepElement = document.getElementById('step' + i);
      if (stepElement) {
        stepElement.classList.remove('active', 'completed');
      }
    }
    
    // Set tracking based on status with null checks
    const status = order.status ? order.status.toLowerCase() : '';
    
    if (status === 'pending') {
      const step1 = document.getElementById('step1');
      if (step1) step1.classList.add('active');
    } else if (status === 'processing') {
      const step1 = document.getElementById('step1');
      const step2 = document.getElementById('step2');
      if (step1) step1.classList.add('completed');
      if (step2) step2.classList.add('active');
    } else if (status === 'shipped') {
      const step1 = document.getElementById('step1');
      const step2 = document.getElementById('step2');
      const step3 = document.getElementById('step3');
      if (step1) step1.classList.add('completed');
      if (step2) step2.classList.add('completed');
      if (step3) step3.classList.add('active');
    } else if (status === 'delivered') {
      const step1 = document.getElementById('step1');
      const step2 = document.getElementById('step2');
      const step3 = document.getElementById('step3');
      const step4 = document.getElementById('step4');
      if (step1) step1.classList.add('completed');
      if (step2) step2.classList.add('completed');
      if (step3) step3.classList.add('completed');
      if (step4) step4.classList.add('active');
    }
    
    // Populate order items with null checks
    const orderItemsList = document.getElementById('orderItemsList');
    if (orderItemsList) {
      let itemsHTML = '';
      let subtotal = 0;
      
      if (order.items && order.items.length > 0) {
        order.items.forEach(item => {
          const itemPrice = parseFloat(item.price) || 0;
          const itemQuantity = parseInt(item.quantity) || 0;
          const itemTotal = itemPrice * itemQuantity;
          subtotal += itemTotal;
          
          itemsHTML += `
            <tr>
              <td>${item.name || 'Unknown Item'}</td>
              <td>${itemQuantity} ${item.unit || 'unit'}${itemQuantity > 1 ? 's' : ''}</td>
              <td>R${itemPrice.toFixed(2)}</td>
              <td>R${itemTotal.toFixed(2)}</td>
            </tr>
          `;
        });
      } else {
        itemsHTML = '<tr><td colspan="4">No items found in this order</td></tr>';
      }
      
      orderItemsList.innerHTML = itemsHTML;
      
      // Populate summary with null checks
      const shipping = parseFloat(order.shipping) || 0;
      const tax = parseFloat(order.tax) || 0;
      const total = subtotal + shipping + tax;
      
      const orderSubtotal = document.getElementById('orderSubtotal');
      const orderShipping = document.getElementById('orderShipping');
      const orderTax = document.getElementById('orderTax');
      const orderTotal = document.getElementById('orderTotal');
      
      if (orderSubtotal) orderSubtotal.innerText = `R${subtotal.toFixed(2)}`;
      if (orderShipping) orderShipping.innerText = `R${shipping.toFixed(2)}`;
      if (orderTax) orderTax.innerText = `R${tax.toFixed(2)}`;
      if (orderTotal) orderTotal.innerText = `R${total.toFixed(2)}`;
    }
    
    // Show the modal
    orderDetailsModal.style.display = 'block';
  } catch (error) {
    console.error("Error fetching order details: ", error);
    alert("Error loading order details: " + error.message);
  }
}

// Add event listener for closing order details modal
const closeOrderDetails = document.getElementById('closeOrderDetails');
if (closeOrderDetails) {
  closeOrderDetails.addEventListener('click', () => {
    const orderDetailsModal = document.getElementById('orderDetailsModal');
    if (orderDetailsModal) {
      orderDetailsModal.style.display = 'none';
    }
  });
}

// Close order details modal when clicking outside
window.addEventListener('click', (event) => {
  const orderDetailsModal = document.getElementById('orderDetailsModal');
  if (event.target === orderDetailsModal) {
    orderDetailsModal.style.display = 'none';
  }
});

// Initial load for supplier orders
document.addEventListener('DOMContentLoaded', () => {
  loadOrders();
  // Set up periodic refresh of orders and stats
  setInterval(loadOrders, 60000); // Refresh every minute
});