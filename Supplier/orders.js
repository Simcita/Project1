// Firebase configuration
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

// DOM Elements
const ordersTableBody = document.getElementById('ordersTableBody');
const orderDetailModal = document.getElementById('orderDetailModal');
const statusUpdateModal = document.getElementById('statusUpdateModal');
const orderSearch = document.getElementById('orderSearch');
const statusFilter = document.getElementById('statusFilter');
const dateFilter = document.getElementById('dateFilter');
const amountFilter = document.getElementById('amountFilter');
const searchBtn = document.getElementById('searchBtn');
const exportBtn = document.getElementById('exportBtn');
const newOrderBtn = document.getElementById('newOrderBtn');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const pageInfo = document.getElementById('pageInfo');

// State management
let currentPage = 1;
const ordersPerPage = 10;
let currentOrders = [];
let filteredOrders = [];
let currentDocId = ''; // To store the current document ID being edited

// Initialize stats counters
let totalOrders = 0;
let pendingOrders = 0;
let processingOrders = 0;
let totalRevenue = 0;

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Set up real-time listener for orders
    initializeOrdersListener();
    setupEventListeners();
});

function setupEventListeners() {
    // Search and filter events
    searchBtn.addEventListener('click', handleSearch);
    statusFilter.addEventListener('change', handleFilter);
    dateFilter.addEventListener('change', handleFilter);
    amountFilter.addEventListener('change', handleFilter);

    // Pagination events
    prevPageBtn.addEventListener('click', () => changePage(currentPage - 1));
    nextPageBtn.addEventListener('click', () => changePage(currentPage + 1));

    // Modal close buttons
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            orderDetailModal.style.display = 'none';
            statusUpdateModal.style.display = 'none';
        });
    });

    // Cancel button in status update modal
    document.getElementById('cancelStatusUpdate').addEventListener('click', () => {
        statusUpdateModal.style.display = 'none';
        document.getElementById('statusNotes').value = ''; // Clear the notes
    });

    // Export button
    exportBtn.addEventListener('click', exportOrders);

    // New order button
    newOrderBtn.addEventListener('click', () => {
        // Implement new order creation logic
        console.log('New order creation to be implemented');
    });

    // Enhanced Print order button event listener with print header
    document.getElementById('printOrderBtn').addEventListener('click', () => {
        // Add a print header that will only show when printing
        const printHeader = document.createElement('div');
        printHeader.className = 'print-header';
        printHeader.innerHTML = `
            <div class="company-name">PaperSupply</div>
            <div class="document-title">Order Details</div>
        `;
        
        // Insert it at the top of the modal content
        const modalContent = document.querySelector('.order-detail-container');
        modalContent.insertBefore(printHeader, modalContent.firstChild);
        
        // Print the page
        window.print();
        
        // Remove the print header after printing
        setTimeout(() => {
            modalContent.removeChild(printHeader);
        }, 100);
    });

    // Update status button in detail modal
    document.getElementById('updateStatusBtn').addEventListener('click', () => {
        orderDetailModal.style.display = 'none';
        statusUpdateModal.style.display = 'block';
    });
}

// Set up real-time listener for orders
function initializeOrdersListener() {
    db.collection('orders')
        .onSnapshot(snapshot => {
            const orders = snapshot.docs;
            updateStats(orders);
            
            // Update the orders table
            currentOrders = orders.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            filteredOrders = [...currentOrders];
            displayOrders();
        }, error => {
            console.error("Error listening to orders: ", error);
        });
}

// Function to load orders
async function loadOrders() {
    try {
        const ordersRef = db.collection('orders');
        let query = ordersRef;

        // Apply filters if they exist
        const statusFilter = document.getElementById('statusFilter').value;
        const dateFilter = document.getElementById('dateFilter').value;
        const amountFilter = document.getElementById('amountFilter').value;
        const searchQuery = document.getElementById('orderSearch').value.toLowerCase();

        // Always sort by orderDate in descending order first
        query = query.orderBy('orderDate', 'desc');

        if (statusFilter) {
            query = query.where('status', '==', statusFilter);
        }

        if (dateFilter) {
            const filterDate = new Date();
            switch (dateFilter) {
                case 'today':
                    filterDate.setHours(0, 0, 0, 0);
                    query = query.where('orderDate', '>=', filterDate);
                    break;
                case 'week':
                    filterDate.setDate(filterDate.getDate() - 7);
                    query = query.where('orderDate', '>=', filterDate);
                    break;
                case 'month':
                    filterDate.setMonth(filterDate.getMonth() - 1);
                    query = query.where('orderDate', '>=', filterDate);
                    break;
                case 'quarter':
                    filterDate.setMonth(filterDate.getMonth() - 3);
                    query = query.where('orderDate', '>=', filterDate);
                    break;
            }
        }

        const snapshot = await query.get();
        currentOrders = [];
        filteredOrders = [];

        if (snapshot.empty) {
            ordersTableBody.innerHTML = '<tr><td colspan="7" class="no-data">No orders found</td></tr>';
            return;
        }

        snapshot.forEach(doc => {
            const order = { id: doc.id, ...doc.data() };
            
            // Apply amount filter if selected
            if (amountFilter) {
                const amount = parseFloat(order.amount?.replace(/[^0-9.-]+/g, '') || 0);
                const [min, max] = amountFilter.split('-').map(val => val === '+' ? Infinity : parseFloat(val));
                if (amount < min || amount > max) return;
            }

            // Apply search filter
            if (searchQuery) {
                const searchableText = `${order.id} ${order.customer} ${order.products?.map(p => p.name).join(' ')}`.toLowerCase();
                if (!searchableText.includes(searchQuery)) return;
            }

            currentOrders.push(order);
        });

        // Sort currentOrders by date in descending order
        currentOrders.sort((a, b) => {
            const dateA = a.orderDate?.toDate() || new Date(0);
            const dateB = b.orderDate?.toDate() || new Date(0);
            return dateB - dateA;
        });

        filteredOrders = [...currentOrders];
        displayOrders();
        updateOrdersSummary();
    } catch (error) {
        console.error('Error loading orders:', error);
        ordersTableBody.innerHTML = '<tr><td colspan="7" class="error-message">Error loading orders</td></tr>';
    }
}

// Display orders in the table
function displayOrders() {
    const startIndex = (currentPage - 1) * ordersPerPage;
    const endIndex = startIndex + ordersPerPage;
    const ordersToDisplay = filteredOrders.slice(startIndex, endIndex);

    if (ordersToDisplay.length === 0) {
        ordersTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="no-data">No orders found</td>
            </tr>
        `;
        return;
    }

    ordersTableBody.innerHTML = ordersToDisplay.map(order => {
        // Get the order date, handling different possible formats
        const orderDate = order.orderDate || order.timestamp || order.createdAt;
        
        return `
            <tr>
                <td>${order.orderId || order.id || 'N/A'}</td>
                <td>${order.companyName || order.customer || 'N/A'}</td>
                <td>${formatDate(orderDate)}</td>
                <td>${formatCurrency(order.total || order.amount || 0)}</td>
                <td><span class="status status-${(order.status || 'pending').toLowerCase()}">${order.status || 'Pending'}</span></td>
                <td><span class="status status-${(order.paymentStatus || 'pending').toLowerCase()}">${order.paymentStatus || 'Pending'}</span></td>
                <td class="action-buttons">
                    <button class="action-btn view-btn" data-order-id="${order.id}">View</button>
                    <button class="action-btn update-btn" data-order-id="${order.id}">Update</button>
                </td>
            </tr>
        `;
    }).join('');

    // Add event listeners to buttons
    ordersTableBody.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const orderId = btn.getAttribute('data-order-id');
            if (orderId) {
                viewOrder(orderId);
            }
        });
    });

    ordersTableBody.querySelectorAll('.update-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const orderId = btn.getAttribute('data-order-id');
            if (orderId) {
                updateOrderStatus(orderId);
            }
        });
    });

    updatePagination();
}

// Update orders summary with real values
function updateOrdersSummary() {
    const totalOrders = filteredOrders.length;
    const pendingOrders = filteredOrders.filter(order => order.status === 'Pending').length;
    const processingOrders = filteredOrders.filter(order => order.status === 'Processing').length;
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + (order.total || 0), 0);

    document.getElementById('totalOrders').textContent = totalOrders;
    document.getElementById('pendingOrders').textContent = pendingOrders;
    document.getElementById('processingOrders').textContent = processingOrders;
    document.getElementById('totalRevenue').textContent = formatCurrency(totalRevenue);
}

// View order details
async function viewOrder(orderId) {
    try {
        showLoading(true);
        console.log('Viewing order with ID:', orderId);
        
        // First, check if we already have the order in our current array
        let order = currentOrders.find(o => o.id === orderId);
        
        // If not found in memory, try fetching from Firestore
        if (!order) {
            console.log('Order not found in memory, fetching from Firestore');
        const orderDoc = await db.collection("orders").doc(orderId).get();
            if (orderDoc.exists) {
                order = { id: orderDoc.id, ...orderDoc.data() };
            } else {
                console.error('Order document not found in Firestore');
                showError('Order not found');
                showLoading(false);
                return;
            }
        }
        
        // Log the entire order object to see its structure
        console.log('Full order data:', order);
        
        // Create a safe order object with default values
        const safeOrder = {
            id: order.id || '',
            orderId: order.orderId || order.orderNumber || order.id || 'N/A',
            orderDate: order.orderDate || order.timestamp || order.createdAt || null,
            status: order.status || 'Pending',
            paymentStatus: order.paymentStatus || 'Pending',
            customerName: order.customerName || order.companyName || 'N/A',
            contactPerson: order.contactPerson || order.customerName || 'N/A',
            email: order.email || order.customerEmail || 'N/A',
            phone: order.phone || 'N/A',
            address: order.address || order.shippingAddress || 'N/A',
            items: [],
            subtotal: 0,
            shipping: 0,
            total: 0
        };
        
        // Try to extract cart items
        if (order.cart && Array.isArray(order.cart)) {
            safeOrder.items = order.cart;
        } else if (order.items && Array.isArray(order.items)) {
            safeOrder.items = order.items;
        } else if (order.products && Array.isArray(order.products)) {
            safeOrder.items = order.products;
        } else if (order.cartItems && Array.isArray(order.cartItems)) {
            safeOrder.items = order.cartItems;
        }
        
        // Calculate totals safely
        if (safeOrder.items.length > 0) {
            safeOrder.subtotal = safeOrder.items.reduce((sum, item) => {
                const price = parseFloat(item.price || item.unitPrice || 0);
                const quantity = parseInt(item.quantity || 1);
                return sum + (price * quantity);
            }, 0);
        } else {
            safeOrder.subtotal = parseFloat(order.subtotal || order.subTotal || 0);
        }
        
        safeOrder.shipping = parseFloat(order.shipping || order.shippingCost || 0);
        safeOrder.total = parseFloat(order.total || order.totalAmount || (safeOrder.subtotal + safeOrder.shipping) || 0);
        
        // Try to fetch additional customer details from multiple possible collections
        const possibleIdFields = ['userId', 'customerId', 'customerUid', 'uid', 'user', 'customer'];
        let customerId = null;
        
        // Find a valid customer ID from the order
        for (const field of possibleIdFields) {
            if (order[field]) {
                customerId = order[field];
                console.log(`Found customer ID in field "${field}": ${customerId}`);
                break;
            }
        }
        
        if (customerId) {
            // Try multiple collections since we're not sure which one is used
            const collections = ['profiles', 'users', 'customers', 'customerProfiles'];
            let customerData = null;
            
            console.log(`Attempting to fetch customer data for ID: ${customerId}`);
            
            // Try each collection until we find data
            for (const collectionName of collections) {
                try {
                    console.log(`Trying to fetch from collection: ${collectionName}`);
                    const docRef = await db.collection(collectionName).doc(customerId).get();
                    
                    if (docRef.exists) {
                        customerData = docRef.data();
                        console.log(`Found customer data in collection "${collectionName}":`, customerData);
                        break;
                    }
                } catch (error) {
                    console.warn(`Error fetching from ${collectionName}:`, error);
                    // Continue to the next collection
                }
            }
            
            // If we found customer data, update the order with it
            if (customerData) {
                // Map of possible field names for each piece of information we want
                const fieldMappings = {
                    contactPerson: ['contactPerson', 'contact', 'contactName', 'name', 'fullName', 'firstName'],
                    email: ['email', 'emailAddress', 'userEmail', 'contactEmail'],
                    phone: ['phone', 'phoneNumber', 'contactPhone', 'telephone', 'mobile'],
                    companyName: ['companyName', 'company', 'businessName', 'organization', 'organisationName'],
                    address: ['address', 'location', 'shippingAddress', 'billingAddress']
                };
                
                // For each field we want to update, check all possible source field names
                for (const [targetField, sourceFields] of Object.entries(fieldMappings)) {
                    for (const sourceField of sourceFields) {
                        if (customerData[sourceField] && customerData[sourceField] !== '') {
                            safeOrder[targetField] = customerData[sourceField];
                            console.log(`Updated ${targetField} with value from ${sourceField}: ${customerData[sourceField]}`);
                            break;
                        }
                    }
                }
            }
        }
        
        // Ensure our elements exist before updating them
        const updateElementText = (id, text) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = text;
            } else {
                console.warn(`Element with id '${id}' not found`);
            }
        };
        
        // Populate modal with details
        updateElementText('detailOrderId', safeOrder.orderId);
        updateElementText('detailOrderDate', formatDate(safeOrder.orderDate));
        updateElementText('detailPaymentStatus', safeOrder.paymentStatus);
        updateElementText('detailCustomerName', safeOrder.customerName);
        updateElementText('detailContactPerson', safeOrder.contactPerson);
        updateElementText('detailCustomerEmail', safeOrder.email);
        
        // Update status badge
        const statusBadge = document.getElementById('orderStatusBadge');
        if (statusBadge) {
            statusBadge.textContent = safeOrder.status;
            statusBadge.className = `status-badge status-${safeOrder.status.toLowerCase()}`;
        }
        
        // Populate order items
        const orderItemsTable = document.getElementById('orderItemsTable');
        if (orderItemsTable) {
            if (safeOrder.items.length > 0) {
                orderItemsTable.innerHTML = safeOrder.items.map(item => `
                    <tr>
                        <td>${item.name || item.productName || item.title || 'N/A'}</td>
                        <td>${item.quantity || 0}</td>
                        <td>${formatCurrency(parseFloat(item.price || item.unitPrice) || 0)}</td>
                        <td>${formatCurrency(parseFloat(item.total || (item.price * item.quantity)) || 0)}</td>
                </tr>
            `).join('');
        } else {
                orderItemsTable.innerHTML = '<tr><td colspan="4" class="no-data">No items found</td></tr>';
            }
        }

        // Update totals
        updateElementText('orderSubtotal', formatCurrency(safeOrder.subtotal));
        updateElementText('orderShipping', formatCurrency(safeOrder.shipping));
        updateElementText('orderTotal', formatCurrency(safeOrder.total));
        
        // Store current order details for printing
        window.currentOrderDetails = safeOrder;

        // Show modal
        orderDetailModal.style.display = 'block';
        showLoading(false);
    } catch (error) {
        console.error('Error loading order details:', error);
        showLoading(false);
        showError(`Failed to load order details: ${error.message}`);
    }
}

// Print order details
function printOrder() {
    const details = window.currentOrderDetails;
    if (!details) {
        showError('No order details available to print');
        return;
    }

    // Create print window
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Order #${details.orderId}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    padding: 20px;
                    max-width: 800px;
                    margin: 0 auto;
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                    border-bottom: 2px solid #333;
                }
                .logo {
                    font-size: 24px;
                    font-weight: bold;
                    margin-bottom: 10px;
                }
                .section {
                    margin-bottom: 30px;
                }
                .section-title {
                    font-size: 18px;
                    font-weight: bold;
                    margin-bottom: 15px;
                    padding-bottom: 5px;
                    border-bottom: 1px solid #ccc;
                }
                .details-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 20px;
                    margin-bottom: 30px;
                }
                .detail-row {
                    margin-bottom: 10px;
                }
                .detail-label {
                    font-weight: bold;
                    color: #666;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                }
                th, td {
                    padding: 10px;
                    text-align: left;
                    border-bottom: 1px solid #ddd;
                }
                th {
                    background-color: #f5f5f5;
                }
                .totals {
                    margin-top: 20px;
                    text-align: right;
                }
                .total-row {
                    margin-bottom: 10px;
                }
                .final-total {
                    font-size: 18px;
                    font-weight: bold;
                    margin-top: 10px;
                    padding-top: 10px;
                    border-top: 2px solid #333;
                }
                @media print {
                    body {
                        padding: 0;
                    }
                    .no-print {
                        display: none;
                    }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="logo">PaperSupply</div>
                <div>Order Details</div>
            </div>

            <div class="section">
                <div class="details-grid">
                    <div>
                        <div class="section-title">Order Information</div>
                        <div class="detail-row">
                            <div class="detail-label">Order ID:</div>
                            <div>${details.orderId}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Order Date:</div>
                            <div>${details.orderDate}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Status:</div>
                            <div>${details.status}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Payment Status:</div>
                            <div>${details.paymentStatus}</div>
                        </div>
                    </div>
                    <div>
                        <div class="section-title">Customer Information</div>
                        <div class="detail-row">
                            <div class="detail-label">Customer:</div>
                            <div>${details.customerName}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Contact Person:</div>
                            <div>${details.contactPerson}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Email:</div>
                            <div>${details.email}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Phone:</div>
                            <div>${details.phone}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="section">
                <div class="section-title">Order Items</div>
                <table>
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Quantity</th>
                            <th>Unit Price</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${details.items.map(item => `
                            <tr>
                                <td>${item.name || item.productName || item.title || 'N/A'}</td>
                                <td>${item.quantity || 0}</td>
                                <td>${formatCurrency(parseFloat(item.price || item.unitPrice) || 0)}</td>
                                <td>${formatCurrency(parseFloat(item.total || (item.price * item.quantity)) || 0)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <div class="totals">
                    <div class="total-row">
                        <span class="detail-label">Subtotal:</span>
                        <span>${formatCurrency(details.subtotal)}</span>
                    </div>
                    <div class="total-row">
                        <span class="detail-label">Shipping:</span>
                        <span>${formatCurrency(details.shipping)}</span>
                    </div>
                    <div class="final-total">
                        <span class="detail-label">Total:</span>
                        <span>${formatCurrency(details.total)}</span>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
        printWindow.print();
    }, 250);
}

// Update order status
async function updateOrderStatus(orderId) {
    try {
        const orderDoc = await db.collection("orders").doc(orderId).get();
        if (!orderDoc.exists) {
            throw new Error('Order not found');
        }
        
        const order = { id: orderDoc.id, ...orderDoc.data() };
        currentDocId = orderId;
        
        // Set current status in the form
        document.getElementById('newStatus').value = order.status.toLowerCase();
        
        // Show modal
        statusUpdateModal.style.display = 'block';

        // Handle form submission
        document.getElementById('statusUpdateForm').onsubmit = async (e) => {
            e.preventDefault();
            const newStatus = document.getElementById('newStatus').value;
            const notes = document.getElementById('statusNotes').value;

            try {
                await db.collection("orders").doc(orderId).update({
                    status: newStatus,
                    notes: notes,
                    lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                });

                statusUpdateModal.style.display = 'none';
                showSuccess('Order status updated successfully');
            } catch (error) {
                console.error('Error updating order status:', error);
                showError('Failed to update order status');
            }
        };
    } catch (error) {
        console.error('Error updating order status:', error);
        showError('Failed to update order status');
    }
}

// Utility functions
function formatDate(date) {
    try {
        if (!date) return 'N/A';
        
        // Handle Firestore Timestamp
        if (date.toDate) {
            date = date.toDate();
        }
        // Handle timestamp object with seconds
        else if (date.seconds) {
            date = new Date(date.seconds * 1000);
        }
        // Handle string dates
        else if (typeof date === 'string') {
            date = new Date(date);
        }
        // If it's not a valid date, return N/A
        else if (!(date instanceof Date)) {
            return 'N/A';
        }

        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'N/A';
    }
}

function formatCurrency(amount) {
    try {
        // Convert to number if it's a string
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        
        // Check if it's a valid number
        if (typeof numAmount !== 'number' || isNaN(numAmount)) {
            return 'R0.00';
        }
        
        return 'R' + numAmount.toLocaleString('en-ZA', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    } catch (error) {
        console.error('Error formatting currency:', error);
        return 'R0.00';
    }
}

function formatNumber(num) {
    return num.toLocaleString('en-ZA');
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);

    // Remove the message after 3 seconds
    setTimeout(() => {
        errorDiv.remove();
    }, 3000);
}

function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    document.body.appendChild(successDiv);

    // Remove the message after 3 seconds
    setTimeout(() => {
        successDiv.remove();
    }, 3000);
}

// Show or hide loading spinner
function showLoading(show) {
    const loadingSpinner = document.getElementById('loadingSpinner');
    if (loadingSpinner) {
        loadingSpinner.style.display = show ? 'block' : 'none';
    }
}

// Handle search
function handleSearch() {
    const searchTerm = orderSearch.value.toLowerCase();
    filteredOrders = currentOrders.filter(order => 
        order.orderId.toLowerCase().includes(searchTerm) ||
        order.companyName.toLowerCase().includes(searchTerm)
    );
    currentPage = 1;
    updateOrdersSummary();
    displayOrders();
}

// Handle filters
function handleFilter() {
    const status = statusFilter.value;
    const dateRange = dateFilter.value;
    const amountRange = amountFilter.value;

    filteredOrders = currentOrders.filter(order => {
        const statusMatch = !status || order.status.toLowerCase() === status;
        const dateMatch = filterByDate(order.orderDate, dateRange);
        const amountMatch = filterByAmount(order.total, amountRange);
        return statusMatch && dateMatch && amountMatch;
    });

    currentPage = 1;
    updateOrdersSummary();
    displayOrders();
}

// Filter by date
function filterByDate(orderDate, dateRange) {
    if (!dateRange || !orderDate) return true;
    
    const orderDateObj = new Date(orderDate.seconds * 1000);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (dateRange) {
        case 'today':
            return orderDateObj.getTime() === today.getTime();
        case 'week':
            const weekAgo = new Date(today);
            weekAgo.setDate(today.getDate() - 7);
            return orderDateObj >= weekAgo;
        case 'month':
            const monthAgo = new Date(today);
            monthAgo.setMonth(today.getMonth() - 1);
            return orderDateObj >= monthAgo;
        case 'quarter':
            const quarterAgo = new Date(today);
            quarterAgo.setMonth(today.getMonth() - 3);
            return orderDateObj >= quarterAgo;
        default:
            return true;
    }
}

// Filter by amount
function filterByAmount(amount, range) {
    if (!range || !amount) return true;
    
    switch (range) {
        case '0-1000':
            return amount <= 1000;
        case '1000-5000':
            return amount > 1000 && amount <= 5000;
        case '5000+':
            return amount > 5000;
        default:
            return true;
    }
}

// Export orders
function exportOrders() {
    const csvContent = convertToCSV(filteredOrders);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `orders_${formatDate(new Date())}.csv`;
    link.click();
}

function convertToCSV(orders) {
    const headers = ['Order ID', 'Customer', 'Date', 'Amount', 'Status', 'Payment Status'];
    const rows = orders.map(order => [
        order.orderId,
        order.companyName,
        formatDate(order.orderDate),
        formatCurrency(order.total),
        order.status,
        order.paymentStatus || 'Pending'
    ]);
    
    return [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');
}

function updatePagination() {
    const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages;
}

function changePage(page) {
    const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
    if (page >= 1 && page <= totalPages) {
        currentPage = page;
        displayOrders();
    }
}

// Function to calculate and update stats
function updateStats(orders) {
    // Reset counters
    totalOrders = orders.length;
    pendingOrders = 0;
    processingOrders = 0;
    totalRevenue = 0;

    // Calculate stats
    orders.forEach(order => {
        const orderData = order.data ? order.data() : order;
        const status = orderData.status?.toLowerCase() || '';
        
        // Update status counts
        if (status === 'pending') {
            pendingOrders++;
        } else if (status === 'processing') {
            processingOrders++;
        }

        // Update total revenue (check both total and amount fields)
        const orderAmount = orderData.total || orderData.amount || 0;
        totalRevenue += parseFloat(orderAmount);
    });

    // Update UI
    document.getElementById('totalOrders').textContent = formatNumber(totalOrders);
    document.getElementById('pendingOrders').textContent = formatNumber(pendingOrders);
    document.getElementById('processingOrders').textContent = formatNumber(processingOrders);
    document.getElementById('totalRevenue').innerHTML = formatCurrency(totalRevenue);

    // Update trends
    updateTrends();
}

// Function to update trend indicators
function updateTrends() {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    // Convert dates to Firestore timestamps
    const lastMonthTimestamp = firebase.firestore.Timestamp.fromDate(lastMonth);
    const yesterdayTimestamp = firebase.firestore.Timestamp.fromDate(yesterday);

    // Get all orders from last month to now
    db.collection('orders')
        .where('orderDate', '>=', lastMonthTimestamp)
        .get()
        .then(snapshot => {
            const allOrders = snapshot.docs;
            
            // Separate current period and last period orders
            const currentPeriodOrders = allOrders.filter(doc => {
                const orderDate = doc.data().orderDate;
                const orderTimestamp = orderDate instanceof firebase.firestore.Timestamp ? 
                    orderDate.toDate() : new Date(orderDate.seconds * 1000);
                return orderTimestamp >= lastMonth && orderTimestamp <= now;
            });

            const lastPeriodOrders = allOrders.filter(doc => {
                const orderDate = doc.data().orderDate;
                const orderTimestamp = orderDate instanceof firebase.firestore.Timestamp ? 
                    orderDate.toDate() : new Date(orderDate.seconds * 1000);
                return orderTimestamp >= lastMonthTimestamp && orderTimestamp < lastMonth;
            });

            // Calculate metrics for current period
            const currentTotalOrders = currentPeriodOrders.length;
            const currentRevenue = currentPeriodOrders.reduce((sum, order) => {
                const orderData = order.data();
                return sum + parseFloat(orderData.total || 0);
            }, 0);

            // Calculate metrics for last period
            const lastPeriodTotalOrders = lastPeriodOrders.length;
            const lastPeriodRevenue = lastPeriodOrders.reduce((sum, order) => {
                const orderData = order.data();
                return sum + parseFloat(orderData.total || 0);
            }, 0);

            // Calculate percentage changes
            const orderChange = lastPeriodTotalOrders > 0 ? 
                ((currentTotalOrders - lastPeriodTotalOrders) / lastPeriodTotalOrders * 100).toFixed(1) : 0;
            
            const revenueChange = lastPeriodRevenue > 0 ? 
                ((currentRevenue - lastPeriodRevenue) / lastPeriodRevenue * 100).toFixed(1) : 0;

            // Update trend displays for orders and revenue
            const totalOrdersTrend = document.querySelector('#totalOrders').nextElementSibling;
            const revenueTrend = document.querySelector('#totalRevenue').nextElementSibling;

            totalOrdersTrend.textContent = `${Math.abs(orderChange)}% from last month`;
            totalOrdersTrend.className = `trend ${orderChange >= 0 ? 'up' : 'down'}`;

            revenueTrend.textContent = `${Math.abs(revenueChange)}% from last month`;
            revenueTrend.className = `trend ${revenueChange >= 0 ? 'up' : 'down'}`;

            // Get yesterday's orders for pending and processing comparison
            db.collection('orders')
                .where('orderDate', '>=', yesterdayTimestamp)
                .get()
                .then(yesterdaySnapshot => {
                    const yesterdayOrders = yesterdaySnapshot.docs.filter(doc => {
                        const orderDate = doc.data().orderDate;
                        const orderTimestamp = orderDate instanceof firebase.firestore.Timestamp ? 
                            orderDate.toDate() : new Date(orderDate.seconds * 1000);
                        return orderTimestamp >= yesterday && orderTimestamp < now;
                    });

                    // Calculate yesterday's pending and processing counts
                    const yesterdayPending = yesterdayOrders.filter(doc => {
                        const status = doc.data().status?.toLowerCase() || '';
                        return status === 'pending';
                    }).length;

                    const yesterdayProcessing = yesterdayOrders.filter(doc => {
                        const status = doc.data().status?.toLowerCase() || '';
                        return status === 'processing';
                    }).length;

                    // Calculate changes in pending and processing orders
                    const pendingChange = pendingOrders - yesterdayPending;
                    const processingChange = processingOrders - yesterdayProcessing;

                    // Update trend displays for pending and processing
                    const pendingTrend = document.querySelector('#pendingOrders').nextElementSibling;
                    const processingTrend = document.querySelector('#processingOrders').nextElementSibling;

                    pendingTrend.textContent = `${Math.abs(pendingChange)} ${pendingChange >= 0 ? 'more' : 'less'} than yesterday`;
                    pendingTrend.className = `trend ${pendingChange <= 0 ? 'up' : 'down'}`;

                    processingTrend.textContent = `${Math.abs(processingChange)} ${processingChange >= 0 ? 'more' : 'less'} than yesterday`;
                    processingTrend.className = `trend ${processingChange >= 0 ? 'up' : 'down'}`;
                });
        })
        .catch(error => {
            console.error("Error calculating trends:", error);
        });
} 
