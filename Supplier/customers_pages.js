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
 * DOM Elements
 ***********************/
const customerGrid = document.getElementById('customerGrid');
const customerDetailModal = document.getElementById('customerDetailModal');
const closeBtn = document.querySelector('.close-btn');
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');
const customerSearch = document.getElementById('customerSearch');
const searchBtn = document.getElementById('searchBtn');
const accountTypeFilter = document.getElementById('accountTypeFilter');
const statusFilter = document.getElementById('statusFilter');
const totalCustomersElement = document.getElementById('totalCustomers');
const premiumAccountsElement = document.getElementById('premiumAccounts');
const pendingQueriesElement = document.getElementById('pendingQueries');
const totalRevenueElement = document.getElementById('totalRevenue');
const addCustomerBtn = document.getElementById('addCustomerBtn');
const editCustomerBtn = document.getElementById('editCustomerBtn');

/***********************
 * Global Variables
 ***********************/
let customersData = [];
let currentCustomerId = null;

/***********************
 * Event Listeners
 ***********************/
document.addEventListener('DOMContentLoaded', () => {
    loadCustomers();
    loadDashboardStats();
});

if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
}

// Close modal when clicking outside of it
window.addEventListener('click', (event) => {
    if (event.target === customerDetailModal) {
        closeModal();
    }
});

// Tab switching
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const tabId = tab.getAttribute('data-tab');
        switchTab(tabId);
    });
});

// Search functionality
if (searchBtn) {
    searchBtn.addEventListener('click', () => {
        filterCustomers();
    });
}

// Filter by account type
if (accountTypeFilter) {
    accountTypeFilter.addEventListener('change', () => {
        filterCustomers();
    });
}

// Filter by status
if (statusFilter) {
    statusFilter.addEventListener('change', () => {
        filterCustomers();
    });
}

// Search on enter key
if (customerSearch) {
    customerSearch.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            filterCustomers();
        }
    });
}

// Add customer button
if (addCustomerBtn) {
    addCustomerBtn.addEventListener('click', () => {
        addCustomerModal.style.display = 'block';
    });
}

// Edit customer button
if (editCustomerBtn) {
    editCustomerBtn.addEventListener('click', () => {
        // In a real application, this would open a form to edit the current customer
        alert(`Edit customer functionality for ${currentCustomerId} would be implemented here`);
    });
}

// Add Customer Modal Functionality
const addCustomerModal = document.getElementById('addCustomerModal');
const addCustomerForm = document.getElementById('addCustomerForm');
const cancelAddCustomerBtn = document.getElementById('cancelAddCustomer');

// Show Add Customer Modal
addCustomerBtn.addEventListener('click', () => {
    addCustomerModal.style.display = 'block';
});

// Close Add Customer Modal
cancelAddCustomerBtn.addEventListener('click', () => {
    addCustomerModal.style.display = 'none';
    addCustomerForm.reset();
});

// Close modal when clicking outside
window.addEventListener('click', (event) => {
    if (event.target === addCustomerModal) {
        addCustomerModal.style.display = 'none';
        addCustomerForm.reset();
    }
});

// Handle form submission
addCustomerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
        // Get form values
        const customerData = {
            customerId: `CUST-${Date.now().toString().slice(-3)}`,
            accountType: document.getElementById('accountType').value,
            companyName: document.getElementById('companyName').value,
            contactName: document.getElementById('contactName').value,
            contactPosition: document.getElementById('contactPosition').value,
            contactEmail: document.getElementById('contactEmail').value,
            contactPhone: document.getElementById('contactPhone').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            address: document.getElementById('address').value,
            city: document.getElementById('city').value,
            state: document.getElementById('state').value,
            country: document.getElementById('country').value,
            postalCode: document.getElementById('postalCode').value,
            creditLimit: document.getElementById('creditLimit').value,
            creditTerms: document.getElementById('creditTerms').value,
            customerSince: new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            }),
            logoUrl: document.getElementById('logoUrl').value,
            createdAt: firebase.firestore.Timestamp.now(),
            lastLogin: firebase.firestore.Timestamp.now(),
            status: 'active',
            role: 'customer'
        };

        // Add to Firestore
        await db.collection('profiles').doc(customerData.customerId).set(customerData);

        // Close modal and reset form
        addCustomerModal.style.display = 'none';
        addCustomerForm.reset();

        // Show success message
        showNotification('Customer added successfully!', 'success');

        // Refresh customer list
        loadCustomers();
    } catch (error) {
        console.error('Error adding customer:', error);
        showNotification('Error adding customer: ' + error.message, 'error');
    }
});

// Function to show notifications
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

/***********************
 * Functions
 ***********************/

// Load customers from Firestore
function loadCustomers() {
    customerGrid.innerHTML = '<div class="loading-message">Loading customers...</div>';
    
    db.collection("profiles")
        .get()
        .then((querySnapshot) => {
            customersData = [];
            querySnapshot.forEach((doc) => {
                const customer = doc.data();
                customer.id = doc.id;
                customersData.push(customer);
            });
            renderCustomers(customersData);
        })
        .catch((error) => {
            console.error("Error loading customers: ", error);
            customerGrid.innerHTML = '<div class="error-message">Error loading customers. Please try again later.</div>';
        });
}

// Render customers to the grid
function renderCustomers(customers) {
    customerGrid.innerHTML = '';
    
    if (customers.length === 0) {
        customerGrid.innerHTML = '<div class="no-results">No customers found</div>';
        return;
    }
    
    customers.forEach(customer => {
        const customerCard = createCustomerCard(customer);
        customerGrid.appendChild(customerCard);
    });
}

// Create a customer card element
function createCustomerCard(customer) {
    const card = document.createElement('div');
    card.className = 'customer-card';
    
    // Check if customer has any pending queries
    checkPendingQueries(customer.customerId)
        .then(queryCount => {
            const hasPendingQueries = queryCount > 0;
            
            card.innerHTML = `
                <div class="customer-card-header">
                    <img src="${customer.logoUrl || 'https://via.placeholder.com/50'}" alt="${customer.companyName}" class="customer-logo">
                    <div class="customer-brief">
                        <h3>${customer.companyName}</h3>
                        <span class="account-type account-${customer.accountType ? customer.accountType.toLowerCase() : 'standard'}">${customer.accountType || 'Standard'}</span>
                    </div>
                    ${hasPendingQueries ? `<div class="notification-badge">${queryCount}</div>` : ''}
                </div>
                <div class="customer-card-body">
                    <div class="customer-info-row">
                        <span class="info-label">ID:</span>
                        <span class="info-value">${customer.customerId || 'N/A'}</span>
                    </div>
                    <div class="customer-info-row">
                        <span class="info-label">Contact:</span>
                        <span class="info-value">${customer.contactName || 'N/A'}</span>
                    </div>
                    <div class="customer-info-row">
                        <span class="info-label">Email:</span>
                        <a href="mailto:${customer.contactEmail}" class="info-value clickable">${customer.contactEmail || 'N/A'}</a>
                    </div>
                    <div class="customer-info-row">
                        <span class="info-label">Phone:</span>
                        <a href="tel:${customer.contactPhone}" class="info-value clickable">${customer.contactPhone || 'N/A'}</a>
                    </div>
                </div>
                <div class="customer-card-footer">
                    <button class="btn btn-primary view-customer-btn" data-id="${customer.customerId}">View Details</button>
                </div>
            `;

            // Add event listener to the view details button
            const viewBtn = card.querySelector('.view-customer-btn');
            viewBtn.addEventListener('click', () => {
                openCustomerDetails(customer.customerId);
            });
        });

    return card;
}

// Check for pending queries for a customer
async function checkPendingQueries(customerId) {
    try {
        const querySnapshot = await db.collection("queries")
            .where("customerId", "==", customerId)
            .where("status", "==", "Pending")
            .get();
        
        return querySnapshot.size;
    } catch (error) {
        console.error("Error checking pending queries: ", error);
        return 0;
    }
}

// Open customer details modal
async function openCustomerDetails(customerId) {
    currentCustomerId = customerId;
    
    // Find the customer in our loaded data
    const customer = customersData.find(c => c.customerId === customerId);
    
    if (!customer) {
        console.error("Customer not found:", customerId);
        return;
    }
    
    // Fill in customer details
    document.getElementById('customerName').textContent = customer.companyName;
    document.getElementById('customerLogo').src = customer.logoUrl || 'https://via.placeholder.com/100';
    document.getElementById('customerAccountType').textContent = customer.accountType || 'Standard';
    document.getElementById('customerAccountType').className = `account-badge account-${customer.accountType ? customer.accountType.toLowerCase() : 'standard'}`;
    document.getElementById('customerSince').textContent = `Customer since: ${customer.customerSince || 'N/A'}`;
    
    // Fill in profile tab
    document.getElementById('contactName').textContent = customer.contactName || 'N/A';
    document.getElementById('contactPosition').textContent = customer.contactPosition || 'N/A';
    document.getElementById('contactEmail').textContent = customer.contactEmail || 'N/A';
    document.getElementById('contactEmail').href = `mailto:${customer.contactEmail}`;
    document.getElementById('contactPhone').textContent = customer.contactPhone || 'N/A';
    document.getElementById('contactPhone').href = `tel:${customer.contactPhone}`;
    
    document.getElementById('customerId').textContent = customer.customerId || 'N/A';
    document.getElementById('companyEmail').textContent = customer.email || 'N/A';
    document.getElementById('companyEmail').href = `mailto:${customer.email}`;
    document.getElementById('companyPhone').textContent = customer.phone || 'N/A';
    document.getElementById('companyPhone').href = `tel:${customer.phone}`;
    
    const address = `${customer.address || ''}, ${customer.city || ''}, ${customer.state || ''} ${customer.postalCode || ''}, ${customer.country || ''}`;
    document.getElementById('companyAddress').textContent = address;
    
    document.getElementById('creditLimit').textContent = customer.creditLimit ? `R${parseFloat(customer.creditLimit).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A';
    document.getElementById('creditTerms').textContent = customer.creditTerms || 'N/A';
    
    // Calculate and display total purchases
    if (document.getElementById('totalPurchases')) {
        document.getElementById('totalPurchases').textContent = 'Calculating...';
        const totalPurchases = await calculateTotalPurchases(customer.customerId);
        document.getElementById('totalPurchases').textContent = totalPurchases;
    }
    
    // Load order history
    loadOrderHistory(customer.customerId);
    
    // Load customer queries
    loadCustomerQueries(customer.customerId);
    
    // Set the active tab to profile
    switchTab('profile');
    
    // Show the modal
    customerDetailModal.style.display = 'block';
}

// Calculate total purchases for a customer
async function calculateTotalPurchases(customerId) {
    try {
        const querySnapshot = await db.collection("orders")
            .where("userId", "==", customerId)
            .where("status", "!=", "Cancelled")
            .get();
        
        let total = 0;
        querySnapshot.forEach(doc => {
            const order = doc.data();
            // Try to get total from different possible fields
            if (order.total) {
                total += parseFloat(order.total) || 0;
            } else if (order.items && Array.isArray(order.items)) {
                // Calculate from items if total is not available
                order.items.forEach(item => {
                    const price = parseFloat(item.price || item.unitPrice || 0);
                    const quantity = parseInt(item.quantity || 1);
                    total += price * quantity;
                });
            }
        });
        
        // Format the total with 'R' currency symbol and proper formatting
        return `R${total.toLocaleString('en-ZA', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    } catch (error) {
        console.error("Error calculating total purchases:", error);
        return 'R0.00';
    }
}

// Load order history for a customer
function loadOrderHistory(customerId) {
    const orderHistoryTable = document.getElementById('orderHistoryTable');
    orderHistoryTable.innerHTML = '<tr><td colspan="5" class="loading-cell">Loading order history...</td></tr>';
    
    db.collection("orders")
        .where("customerId", "==", customerId)
        .orderBy("orderDate", "desc")
        .get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                orderHistoryTable.innerHTML = '<tr><td colspan="5" class="no-data-cell">No order history found</td></tr>';
                return;
            }
            
            let ordersHTML = '';
            querySnapshot.forEach((doc) => {
                const order = doc.data();
                const orderDate = order.orderDate ? new Date(order.orderDate.seconds * 1000).toLocaleDateString() : 'N/A';
                
                // Only show update button if status is not "delivered"
                const updateButton = order.status !== "delivered" ? 
                    `<button class="action-btn update-btn" data-id="${doc.id}" title="Update Status">Update</button>` : '';
                
                ordersHTML += `
                    <tr>
                        <td>${order.orderId || 'N/A'}</td>
                        <td>${orderDate}</td>
                        <td>$${order.total ? parseFloat(order.total).toFixed(2) : '0.00'}</td>
                        <td><span class="status status-${order.status ? order.status.toLowerCase() : 'pending'}">${order.status || 'Pending'}</span></td>
                        <td class="action-buttons">
                            <button class="action-btn print-btn" data-id="${doc.id}" title="Print Order">Print</button>
                            ${updateButton}
                        </td>
                    </tr>
                `;
            });
            
            orderHistoryTable.innerHTML = ordersHTML;
            
            // Add event listeners to print buttons
            const printButtons = orderHistoryTable.querySelectorAll('.print-btn');
            printButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const orderId = button.getAttribute('data-id');
                    printOrderDetails(orderId);
                });
            });

            // Add event listeners to update buttons
            const updateButtons = orderHistoryTable.querySelectorAll('.update-btn');
            updateButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const orderId = button.getAttribute('data-id');
                    updateOrderStatus(orderId);
                });
            });
        })
        .catch((error) => {
            console.error("Error loading order history: ", error);
            orderHistoryTable.innerHTML = '<tr><td colspan="5" class="error-cell">Error loading order history</td></tr>';
        });
}

// Function to update order status
async function updateOrderStatus(orderId) {
    try {
        const orderDoc = await db.collection("orders").doc(orderId).get();
        
        if (!orderDoc.exists) {
            alert('Order not found.');
            return;
        }
        
        const order = orderDoc.data();
        const currentStatus = order.status || 'pending';
        
        // Define the status progression
        const statusProgression = {
            'pending': 'processing',
            'processing': 'shipped',
            'shipped': 'delivered'
        };
        
        // Get the next status
        const nextStatus = statusProgression[currentStatus.toLowerCase()];
        
        if (!nextStatus) {
            alert('Order status cannot be updated further.');
            return;
        }
        
        // Update the order status
        await db.collection("orders").doc(orderId).update({
            status: nextStatus,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Refresh the order history
        loadOrderHistory(currentCustomerId);
        
        alert(`Order status updated to ${nextStatus}`);
    } catch (error) {
        console.error("Error updating order status:", error);
        alert("Failed to update order status. Please try again.");
    }
}

// Print order details
async function printOrderDetails(orderId) {
    try {
        const orderDoc = await db.collection("orders").doc(orderId).get();
        
        if (!orderDoc.exists) {
            alert('Order not found.');
            return;
        }
        
        const order = orderDoc.data();
        
        // Create a new window for printing
        const printWindow = window.open('', '_blank');
        
        // Generate the print content
        const printContent = `
            <html>
                <head>
                    <title>Order Details - ${order.orderId}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        .header { text-align: center; margin-bottom: 30px; }
                        .order-info { margin-bottom: 20px; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                        th, td { padding: 8px; border: 1px solid #ddd; text-align: left; }
                        th { background-color: #f5f5f5; }
                        .total { text-align: right; font-weight: bold; }
                        .footer { margin-top: 30px; text-align: center; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>PaperSupply</h1>
                        <h2>Order Details</h2>
                    </div>
                    
                    <div class="order-info">
                        <p><strong>Order ID:</strong> ${order.orderId}</p>
                        <p><strong>Date:</strong> ${order.orderDate ? new Date(order.orderDate.seconds * 1000).toLocaleString() : 'N/A'}</p>
                        <p><strong>Status:</strong> ${order.status}</p>
                        <p><strong>Customer:</strong> ${order.customerName || 'N/A'}</p>
                    </div>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Quantity</th>
                                <th>Unit Price</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${order.items ? order.items.map(item => `
                                <tr>
                                    <td>${item.name}</td>
                                    <td>${item.quantity}</td>
                                    <td>$${parseFloat(item.price).toFixed(2)}</td>
                                    <td>$${(parseFloat(item.price) * item.quantity).toFixed(2)}</td>
                                </tr>
                            `).join('') : ''}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan="3" class="total">Total Amount:</td>
                                <td>$${order.total ? parseFloat(order.total).toFixed(2) : '0.00'}</td>
                            </tr>
                        </tfoot>
                    </table>
                    
                    <div class="footer">
                        <p>This is a computer-generated document. No signature is required.</p>
                        <p>Generated on: ${new Date().toLocaleString()}</p>
                    </div>
                </body>
            </html>
        `;
        
        // Write the content to the new window
        printWindow.document.write(printContent);
        printWindow.document.close();
        
        // Wait for images to load before printing
        printWindow.onload = function() {
            printWindow.print();
            printWindow.close();
        };
    } catch (error) {
        console.error("Error printing order details:", error);
        alert("Failed to print order details. Please try again.");
    }
}

// Load customer queries
function loadCustomerQueries(customerId) {
    const customerQueriesTable = document.getElementById('customerQueriesTable');
    customerQueriesTable.innerHTML = '<tr><td colspan="6" class="loading-cell">Loading customer queries...</td></tr>';
    
    db.collection("queries")
        .where("customerId", "==", customerId)
        .orderBy("createdAt", "desc")
        .get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                customerQueriesTable.innerHTML = '<tr><td colspan="6" class="no-data-cell">No support queries found</td></tr>';
                return;
            }
            
            let queriesHTML = '';
            querySnapshot.forEach((doc) => {
                const query = doc.data();
                const createdDate = query.createdAt ? new Date(query.createdAt.seconds * 1000).toLocaleDateString() : 'N/A';
                
                queriesHTML += `
                    <tr>
                        <td>${query.ticketId || 'N/A'}</td>
                        <td>${query.subject || 'N/A'}</td>
                        <td>${createdDate}</td>
                        <td><span class="status status-${query.status ? query.status.toLowerCase() : 'pending'}">${query.status || 'Pending'}</span></td>
                        <td><span class="priority priority-${query.priority ? query.priority.toLowerCase() : 'medium'}">${query.priority || 'Medium'}</span></td>
                        <td class="action-buttons">
                            <button class="action-btn view-btn" data-id="${doc.id}" title="View Details">View</button>
                            <button class="action-btn respond-btn" data-id="${doc.id}" title="Respond">Respond</button>
                        </td>
                    </tr>
                `;
            });
            
            customerQueriesTable.innerHTML = queriesHTML;
            
            // Add event listeners to view buttons
            const viewButtons = customerQueriesTable.querySelectorAll('.view-btn');
            viewButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const queryId = button.getAttribute('data-id');
                    viewQueryDetails(queryId);
                });
            });
            
            // Add event listeners to respond buttons
            const respondButtons = customerQueriesTable.querySelectorAll('.respond-btn');
            respondButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const queryId = button.getAttribute('data-id');
                    respondToQuery(queryId);
                });
            });
        })
        .catch((error) => {
            console.error("Error loading customer queries: ", error);
            customerQueriesTable.innerHTML = '<tr><td colspan="6" class="error-cell">Error loading customer queries</td></tr>';
        });
}

// View query details
async function viewQueryDetails(queryId) {
    try {
        const queryDoc = await db.collection("queries").doc(queryId).get();
        
        if (!queryDoc.exists) {
            alert('Query not found.');
            return;
        }
        
        const query = queryDoc.data();
        
        // Populate the modal with query details
        document.getElementById('detailTicketId').textContent = query.ticketId || 'N/A';
        document.getElementById('detailCompany').textContent = query.companyName || 'N/A';
        document.getElementById('detailSubject').textContent = query.subject || 'No Subject';
        document.getElementById('detailStatus').textContent = query.status || 'Pending';
        document.getElementById('detailStatus').className = `status status-${query.status ? query.status.toLowerCase() : 'pending'}`;
        document.getElementById('detailPriority').textContent = query.priority || 'Medium';
        document.getElementById('detailPriority').className = `priority priority-${query.priority ? query.priority.toLowerCase() : 'medium'}`;
        
        const createdDate = query.createdAt ? new Date(query.createdAt.seconds * 1000) : new Date();
        document.getElementById('detailCreated').textContent = createdDate.toLocaleString();
        
        // Load the conversation history
        const conversationContainer = document.getElementById('conversationHistory');
        conversationContainer.innerHTML = '';
        
        // Add the initial message
        const initialMessage = document.createElement('div');
        initialMessage.className = 'message customer';
        initialMessage.innerHTML = `
            <div class="message-header">
                <span class="message-sender">${query.contactInfo || 'Customer'}</span>
                <span class="message-time">${createdDate.toLocaleString()}</span>
            </div>
            <div class="message-body">
                ${query.message || 'No message content'}
            </div>
        `;
        conversationContainer.appendChild(initialMessage);
        
        // Get the conversation history from responses array
        if (query.responses && Array.isArray(query.responses)) {
            query.responses.forEach(msg => {
                const messageEl = document.createElement('div');
                const isSupplier = msg.isSupplier || (msg.from && msg.from.includes("Support"));
                messageEl.className = `message ${isSupplier ? 'supplier' : 'customer'}`;
                
                const msgDate = msg.timestamp ? new Date(msg.timestamp.seconds * 1000) : new Date();
                const messageContent = msg.message || msg.text || 'No message content';
                const sender = isSupplier ? (msg.from || 'Support Agent') : (query.contactInfo || 'Customer');
                
                messageEl.innerHTML = `
                    <div class="message-header">
                        <span class="message-sender">${sender}</span>
                        <span class="message-time">${msgDate.toLocaleString()}</span>
                    </div>
                    <div class="message-body">
                        ${messageContent}
                    </div>
                `;
                conversationContainer.appendChild(messageEl);
            });
        }
        
        // Mark as read if it was unread
        if (query.hasNewMessages) {
            await db.collection("queries").doc(queryId).update({
                hasNewMessages: false
            });
        }
        
        // Show the modal
        queryDetailModal.style.display = 'block';
        
        // Scroll to the bottom of the conversation
        conversationContainer.scrollTop = conversationContainer.scrollHeight;
        
    } catch (error) {
        console.error("Error loading query details:", error);
        alert("Failed to load query details. Please try again.");
    }
}

// Respond to query
async function respondToQuery(queryId) {
    try {
        const queryDoc = await db.collection("queries").doc(queryId).get();
        
        if (!queryDoc.exists) {
            alert('Query not found.');
            return;
        }
        
        const query = queryDoc.data();
        
        // Set the current query ID
        currentQueryId = queryId;
        currentCustomerId = query.customerId;
        currentTicketId = query.ticketId;
        currentQueryData = query;
        
        // Create response modal if it doesn't exist
        let responseModal = document.getElementById('queryResponseModal');
        if (!responseModal) {
            responseModal = document.createElement('div');
            responseModal.id = 'queryResponseModal';
            responseModal.className = 'modal';
            responseModal.innerHTML = `
                <div class="modal-content">
                    <span class="close-btn close-response-modal">&times;</span>
                    <h2>Respond to Query</h2>
                    
                    <div class="query-details">
                        <div class="detail-row">
                            <span class="detail-label">Ticket ID:</span>
                            <span class="detail-value" id="responseTicketId">N/A</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Company:</span>
                            <span class="detail-value" id="responseCompany">N/A</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Subject:</span>
                            <span class="detail-value" id="responseSubject">N/A</span>
                        </div>
                    </div>
                    
                    <form id="queryResponseForm">
                        <div class="form-group">
                            <label for="responseText">Your Response:</label>
                            <textarea id="responseText" class="form-control" rows="5" placeholder="Type your response here..."></textarea>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="responseStatus">Update Status:</label>
                                <select id="responseStatus" class="form-control">
                                    <option value="Pending">Pending</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Resolved">Resolved</option>
                                    <option value="Closed">Closed</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="responsePriority">Priority:</label>
                                <select id="responsePriority" class="form-control">
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                    <option value="Urgent">Urgent</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-actions">
                            <button type="button" class="btn close-response-modal">Cancel</button>
                            <button type="submit" class="btn btn-primary" id="submitResponseBtn">Send Response</button>
                        </div>
                    </form>
                </div>
            `;
            document.body.appendChild(responseModal);
            
            // Add event listeners for the response modal
            const closeButtons = responseModal.querySelectorAll('.close-response-modal');
            closeButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    responseModal.style.display = 'none';
                });
            });
            
            // Add form submit handler
            const responseForm = responseModal.querySelector('#queryResponseForm');
            responseForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const responseText = document.getElementById('responseText').value;
                const responseStatus = document.getElementById('responseStatus').value;
                const responsePriority = document.getElementById('responsePriority').value;
                
                if (!responseText.trim()) {
                    alert('Please enter a response message.');
                    return;
                }
                
                const submitBtn = document.getElementById('submitResponseBtn');
                const originalBtnText = submitBtn.textContent;
                submitBtn.textContent = 'Sending...';
                submitBtn.disabled = true;
                
                try {
                    await updateQueryWithResponse(currentQueryId, responseText, responseStatus, responsePriority);
                    submitBtn.textContent = 'Sent!';
                    setTimeout(() => {
                        submitBtn.textContent = originalBtnText;
                        submitBtn.disabled = false;
                        responseModal.style.display = 'none';
                        loadCustomerQueries(currentCustomerId);
                    }, 1500);
                } catch (error) {
                    console.error("Error updating query:", error);
                    alert("Failed to send response. Please try again.");
                    submitBtn.textContent = originalBtnText;
                    submitBtn.disabled = false;
                }
            });
        }
        
        // Populate the response modal with the query details
        document.getElementById('responseTicketId').textContent = query.ticketId || 'N/A';
        document.getElementById('responseCompany').textContent = query.companyName || 'N/A';
        document.getElementById('responseSubject').textContent = query.subject || 'No Subject';
        
        // Set the current status and priority in the dropdowns
        const statusSelect = document.getElementById('responseStatus');
        const prioritySelect = document.getElementById('responsePriority');
        
        for (let i = 0; i < statusSelect.options.length; i++) {
            if (statusSelect.options[i].value === query.status) {
                statusSelect.selectedIndex = i;
                break;
            }
        }
        
        for (let i = 0; i < prioritySelect.options.length; i++) {
            if (prioritySelect.options[i].value === query.priority) {
                prioritySelect.selectedIndex = i;
                break;
            }
        }
        
        // Clear previous response
        document.getElementById('responseText').value = '';
        
        // Show the response modal
        responseModal.style.display = 'block';
        
        // Focus on the response text area
        setTimeout(() => {
            document.getElementById('responseText').focus();
        }, 300);
    } catch (error) {
        console.error("Error preparing response:", error);
        alert("Failed to prepare response. Please try again.");
    }
}

// Update query with response
async function updateQueryWithResponse(queryId, responseText, newStatus, newPriority) {
    try {
        // Get the original query document
        const queryDoc = await db.collection("queries").doc(queryId).get();
        if (!queryDoc.exists) {
            throw new Error('Query not found');
        }
        
        const query = queryDoc.data();
        
        // Create a new message for the responses
        const newResponse = {
            from: "Support Agent",
            message: responseText,
            timestamp: firebase.firestore.Timestamp.now(),
            isSupplier: true
        };
        
        // Update the responses array
        const responses = query.responses && Array.isArray(query.responses) 
            ? [...query.responses, newResponse] 
            : [newResponse];
        
        // Update the query document
        await db.collection("queries").doc(queryId).update({
            status: newStatus,
            priority: newPriority,
            responses: responses,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
            hasNewMessages: true
        });
        
        return true;
    } catch (error) {
        console.error("Error in updateQueryWithResponse:", error);
        throw error;
    }
}

// Close the modal
function closeModal() {
    customerDetailModal.style.display = 'none';
}

// Switch between tabs
function switchTab(tabId) {
    // Hide all tab contents
    tabContents.forEach(content => {
        content.classList.remove('active');
    });
    
    // Remove active class from all tabs
    tabs.forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show the selected tab content
    document.getElementById(`${tabId}Tab`).classList.add('active');
    
    // Add active class to the selected tab
    document.querySelector(`.tab[data-tab="${tabId}"]`).classList.add('active');
}

// Filter customers based on search and filter criteria
function filterCustomers() {
    const searchTerm = customerSearch.value.toLowerCase();
    const accountType = accountTypeFilter.value;
    const status = statusFilter.value;
    
    const filteredCustomers = customersData.filter(customer => {
        // Filter by search term
        const matchesSearch = !searchTerm || 
            (customer.companyName && customer.companyName.toLowerCase().includes(searchTerm)) ||
            (customer.contactName && customer.contactName.toLowerCase().includes(searchTerm)) ||
            (customer.customerId && customer.customerId.toLowerCase().includes(searchTerm)) ||
            (customer.contactEmail && customer.contactEmail.toLowerCase().includes(searchTerm));
        
        // Filter by account type
        const matchesAccountType = !accountType || (customer.accountType === accountType);
        
        // Filter by status (assuming there's a status field in the customer data)
        const matchesStatus = !status || (customer.status === status);
        
        return matchesSearch && matchesAccountType && matchesStatus;
    });
    
    renderCustomers(filteredCustomers);
}

// Load dashboard statistics
function loadDashboardStats() {
    // Get total customers
    db.collection("profile")
        .get()
        .then((querySnapshot) => {
            totalCustomersElement.textContent = querySnapshot.size;
        })
        .catch((error) => {
            console.error("Error loading total customers: ", error);
        });
    
    // Get premium account count
    db.collection("profile")
        .where("accountType", "==", "Premium")
        .get()
        .then((querySnapshot) => {
            premiumAccountsElement.textContent = querySnapshot.size;
        })
        .catch((error) => {
            console.error("Error loading premium accounts: ", error);
        });
    
    // Get pending queries count
    db.collection("queries")
        .where("status", "==", "Pending")
        .get()
        .then((querySnapshot) => {
            pendingQueriesElement.textContent = querySnapshot.size;
        })
        .catch((error) => {
            console.error("Error loading pending queries: ", error);
        });
    
    // Calculate total revenue
    db.collection("orders")
        .where("status", "!=", "Cancelled")
        .get()
        .then((querySnapshot) => {
            let totalRevenue = 0;
            querySnapshot.forEach((doc) => {
                const order = doc.data();
                if (order.total) {
                    totalRevenue += parseFloat(order.total);
                }
            });
            totalRevenueElement.textContent = `$${totalRevenue.toLocaleString(undefined, {maximumFractionDigits: 2, minimumFractionDigits: 2})}`;
        })
        .catch((error) => {
            console.error("Error calculating total revenue: ", error);
        });
}