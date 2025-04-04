// Firebase Configuration
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

// State Management
const state = {
    user: null,
    orders: [],
    products: [],
    cart: [],
    notifications: [],
    isLoading: false,
    error: null
};

// DOM Elements
const elements = {
    menuToggle: document.querySelector('.menu-toggle'),
    mainNav: document.querySelector('.main-nav'),
    searchInput: document.querySelector('.search-container input'),
    notificationBtn: document.querySelector('.notification-btn'),
    cartBtn: document.querySelector('.cart-btn'),
    ordersTableBody: document.getElementById('ordersTableBody'),
    featuredProducts: document.getElementById('featuredProducts'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    toastContainer: document.getElementById('toastContainer'),
    modals: {
        orderDetails: document.getElementById('orderDetailsModal'),
        newOrder: document.getElementById('newOrderModal'),
        cart: document.getElementById('cartModal')
    }
};

// Utility Functions
const utils = {
    formatCurrency: (amount) => {
        return new Intl.NumberFormat('en-ZA', {
            style: 'currency',
            currency: 'ZAR'
        }).format(amount);
    },

    formatDate: (date) => {
        if (!date) return 'Unknown Date';
        
        if (date.seconds) {
            date = new Date(date.seconds * 1000);
        }
        
        return new Intl.DateTimeFormat('en-ZA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    },

    showLoading: () => {
        elements.loadingOverlay.classList.add('active');
    },

    hideLoading: () => {
        elements.loadingOverlay.classList.remove('active');
    },

    showToast: (message, type = 'info') => {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 
                          type === 'error' ? 'fa-exclamation-circle' : 
                          type === 'warning' ? 'fa-exclamation-triangle' : 
                          'fa-info-circle'}"></i>
            <span>${message}</span>
        `;
        
        elements.toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 5000);
    }
};

// Firebase Service
const firebaseService = {
    async getOrders() {
        try {
            // Get current date and date 30 days ago
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const snapshot = await db.collection('orders')
                .where('customerId', '==', 'CUST-001') // Using the same customer ID as original
                .orderBy('orderDate', 'desc')
                .get();
            
            const allOrders = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Filter orders to show only recent and active ones
            const recentOrders = allOrders.filter(order => {
                const orderDate = order.orderDate ? new Date(order.orderDate.seconds * 1000) : null;
                const isRecent = orderDate && orderDate >= thirtyDaysAgo;
                const isActive = order.status && order.status.toLowerCase() !== 'delivered';
                return isRecent || isActive;
            });

            return recentOrders;
        } catch (error) {
            console.error('Error fetching orders:', error);
            throw error;
        }
    },

    async getOrder(orderId) {
        try {
            const doc = await db.collection('orders').doc(orderId).get();
            if (!doc.exists) {
                throw new Error('Order not found');
            }
            return {
                id: doc.id,
                ...doc.data()
            };
        } catch (error) {
            console.error('Error fetching order:', error);
            throw error;
        }
    },

    async getProducts() {
        try {
            const snapshot = await db.collection('products')
                .where('featured', '==', true)
                .limit(6)
                .get();
            
            const products = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // If no products found in Firebase, use default featured products
            if (products.length === 0) {
                return [
                    {
                        id: "PRD-001",
                        name: "Premium Toilet Paper Roll",
                        description: "High-quality 3-ply toilet paper, soft and absorbent.",
                        price: 249.99,
                        image: "https://via.placeholder.com/150",
                        unit: "box",
                        unitsPerBox: 24,
                        featured: true
                    },
                    {
                        id: "PRD-002",
                        name: "Heavy-Duty Paper Towels",
                        description: "Extra strong paper towels for industrial use.",
                        price: 325.50,
                        image: "https://via.placeholder.com/150",
                        unit: "box",
                        unitsPerBox: 12,
                        featured: true
                    },
                    {
                        id: "PRD-005",
                        name: "Printer Paper - A4",
                        description: "High-quality A4 paper for printing and copying.",
                        price: 455.50,
                        image: "https://via.placeholder.com/150",
                        unit: "box",
                        unitsPerBox: 5,
                        featured: true
                    }
                ];
            }

            return products;
        } catch (error) {
            console.error('Error fetching products:', error);
            throw error;
        }
    },

    async updateOrderStatus(orderId, status) {
        try {
            await db.collection('orders').doc(orderId).update({
                status,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('Error updating order status:', error);
            throw error;
        }
    },

    async createOrder(orderData) {
        try {
            const orderRef = await db.collection('orders').add({
                ...orderData,
                customerId: state.user.uid,
                orderDate: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'Pending',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return orderRef.id;
        } catch (error) {
            console.error('Error creating order:', error);
            throw error;
        }
    },

    async getCustomerProfile() {
        try {
            const doc = await db.collection('customers').doc(state.user.uid).get();
            if (!doc.exists) {
                throw new Error('Customer profile not found');
            }
            return doc.data();
        } catch (error) {
            console.error('Error fetching customer profile:', error);
            throw error;
        }
    },

    async updateCustomerProfile(profileData) {
        try {
            await db.collection('customers').doc(state.user.uid).update({
                ...profileData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('Error updating customer profile:', error);
            throw error;
        }
    }
};

// UI Components
const ui = {
    renderOrders(orders) {
        if (!orders.length) {
            elements.ordersTableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="no-data">No orders found</td>
                </tr>
            `;
            return;
        }

        elements.ordersTableBody.innerHTML = orders.map(order => `
            <tr>
                <td>${order.orderId}</td>
                <td>${utils.formatDate(order.orderDate)}</td>
                <td>${utils.formatCurrency(order.total)}</td>
                <td>
                    <span class="status-badge ${order.status.toLowerCase()}">
                        ${order.status}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-primary view-order" data-id="${order.id}">
                            View
                        </button>
                        ${order.status !== 'Delivered' ? `
                            <button class="btn btn-sm btn-success update-status" data-id="${order.id}">
                                Update Status
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `).join('');

        // Add event listeners
        this.attachOrderEventListeners();
    },

    renderProducts(products) {
        if (!products.length) {
            elements.featuredProducts.innerHTML = `
                <div class="no-data">No featured products available</div>
            `;
            return;
        }

        // Store products in window scope for access in event handlers
        window.products = products;

        elements.featuredProducts.innerHTML = products.map(product => `
            <div class="card">
                <img class="card-img" src="${product.image}" alt="${product.name}">
                <div class="card-body">
                    <h3 class="card-title">${product.name}</h3>
                    <p class="card-text">${product.description}</p>
                    <p class="card-price">R${product.price.toFixed(2)} per ${product.unit}</p>
                    <p class="card-units">${product.unitsPerBox} units per box</p>
                    <button class="btn btn-primary add-to-cart-btn" data-id="${product.id}">
                        Add to Cart
                    </button>
                </div>
            </div>
        `).join('');

        // Add event listeners to the newly created buttons
        this.attachProductEventListeners();
    },

    attachOrderEventListeners() {
        document.querySelectorAll('.view-order').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const orderId = e.target.dataset.id;
                handleViewOrder(orderId);
            });
        });

        document.querySelectorAll('.update-status').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const orderId = e.target.dataset.id;
                handleUpdateOrderStatus(orderId);
            });
        });
    },

    attachProductEventListeners() {
        document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.target.dataset.id;
                const product = window.products.find(p => p.id === productId);
                if (product) {
                    cartManager.addItem(product);
                    utils.showToast('Product added to cart', 'success');
                }
            });
        });
    }
};

// Cart Management
const cartManager = {
    items: [],
    
    addItem(product, quantity = 1) {
        console.log('Adding item to cart:', product);
        const existingItem = this.items.find(item => item.id === product.id);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.items.push({
                id: product.id,
                name: product.name,
                price: product.price,
                quantity: quantity,
                image: product.image,
                unit: product.unit,
                unitsPerBox: product.unitsPerBox
            });
        }
        this.updateUI();
        this.saveCart();
    },
    
    removeItem(productId) {
        this.items = this.items.filter(item => item.id !== productId);
        this.updateUI();
        this.saveCart();
    },
    
    updateQuantity(productId, quantity) {
        const item = this.items.find(item => item.id === productId);
        if (item) {
            if (quantity <= 0) {
                this.removeItem(productId);
            } else {
                item.quantity = quantity;
                this.updateUI();
                this.saveCart();
            }
        }
    },
    
    getItems() {
        return this.items;
    },
    
    getCount() {
        return this.items.reduce((total, item) => total + item.quantity, 0);
    },
    
    getTotal() {
        return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    },
    
    clear() {
        this.items = [];
        this.updateUI();
        this.saveCart();
    },
    
    updateUI() {
        // Update cart count in header
        const cartCount = document.querySelector('.cart-count');
        if (cartCount) {
            cartCount.textContent = this.getCount();
        }

        // Update cart display in modal
        updateCartDisplay(this.items);
        
        // Update modal cart count
        const modalCartCount = document.querySelector('#modalCartCount');
        if (modalCartCount) {
            modalCartCount.textContent = `(${this.getCount()})`;
        }
    },

    saveCart() {
        try {
            localStorage.setItem('cart', JSON.stringify(this.items));
        } catch (error) {
            console.error('Error saving cart:', error);
        }
    },

    loadCart() {
        try {
            const savedCart = localStorage.getItem('cart');
            if (savedCart) {
                this.items = JSON.parse(savedCart);
                this.updateUI();
            }
        } catch (error) {
            console.error('Error loading cart:', error);
        }
    }
};

// Modal Management
const modalManager = {
    activeModal: null,
    
    show(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            this.activeModal = modal;
            document.body.style.overflow = 'hidden';
        }
    },
    
    hide() {
        if (this.activeModal) {
            this.activeModal.classList.remove('active');
            this.activeModal = null;
            document.body.style.overflow = '';
        }
    },
    
    setupCloseButtons() {
        document.querySelectorAll('.close-btn').forEach(button => {
            button.addEventListener('click', () => this.hide());
        });
    }
};

// Tab Management
const tabManager = {
    activeTab: 'products',
    
    switchTab(tabId) {
        // Update tab buttons
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.tab === tabId) {
                tab.classList.add('active');
            }
        });
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
            if (content.id === `${tabId}Tab`) {
                content.classList.add('active');
            }
        });
        
        this.activeTab = tabId;
    },
    
    setupTabButtons() {
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchTab(tab.dataset.tab);
            });
        });
    }
};

// Event Handlers
const handlers = {
    async handleViewOrder(orderId) {
        try {
            utils.showLoading();
            const order = await firebaseService.getOrder(orderId);
            if (order) {
                const modal = document.getElementById('orderDetailsModal');
                if (modal) {
        modal.querySelector('.modal-body').innerHTML = `
            <div class="order-details">
                <div class="order-header">
                    <h3>Order #${order.orderId}</h3>
                    <span class="status-badge ${order.status.toLowerCase()}">${order.status}</span>
                </div>
                <div class="order-info">
                    <p><strong>Date:</strong> ${utils.formatDate(order.orderDate)}</p>
                    <p><strong>Total:</strong> ${utils.formatCurrency(order.total)}</p>
                </div>
                <div class="order-items">
                    <h4>Order Items</h4>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Quantity</th>
                                <th>Price</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${order.items.map(item => `
                                <tr>
                                    <td>${item.name}</td>
                                    <td>${item.quantity}</td>
                                    <td>${utils.formatCurrency(item.price)}</td>
                                    <td>${utils.formatCurrency(item.price * item.quantity)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
                    modal.style.display = 'block';
                }
            }
        } catch (error) {
            console.error('Error loading order details:', error);
            utils.showToast('Error loading order details', 'error');
        } finally {
            utils.hideLoading();
        }
    },

    async handleUpdateOrderStatus(orderId) {
        try {
            if (confirm('Are you sure you want to mark this order as delivered?')) {
                utils.showLoading();
                await firebaseService.updateOrderStatus(orderId, 'Delivered');
                utils.showToast('Order status updated successfully', 'success');
                await loadOrders();
            }
        } catch (error) {
            console.error('Error updating order status:', error);
            utils.showToast('Error updating order status', 'error');
        } finally {
            utils.hideLoading();
        }
    },

    handlePlaceOrder() {
        const newOrderModal = document.getElementById('newOrderModal');
        if (newOrderModal) {
            newOrderModal.style.display = 'block';
            // Load products into the catalog
            loadProducts();
            // Update cart display
            updateCartDisplay(cartManager.getItems());
            // Update modal cart count
            const modalCartCount = document.querySelector('#modalCartCount');
            if (modalCartCount) {
                modalCartCount.textContent = `(${cartManager.getCount()})`;
            }
            // Switch to products tab
            const productsTab = document.querySelector('.tab[data-tab="products"]');
            if (productsTab) {
                productsTab.click();
            }
        }
    },

    handleCartClick() {
        const newOrderModal = document.getElementById('newOrderModal');
        if (newOrderModal) {
            newOrderModal.style.display = 'block';
            // Load products into the catalog
            loadProducts();
            // Update cart display
            updateCartDisplay(cartManager.getItems());
            // Update modal cart count
            const modalCartCount = document.querySelector('#modalCartCount');
            if (modalCartCount) {
                modalCartCount.textContent = `(${cartManager.getCount()})`;
            }
            // Switch to cart tab first
            const cartTab = document.querySelector('.tab[data-tab="cart"]');
            if (cartTab) {
                cartTab.click();
            }
        }
    }
};

// Setup Event Listeners
function setupEventListeners() {
    // Menu toggle
    elements.menuToggle.addEventListener('click', () => {
        elements.mainNav.classList.toggle('active');
    });

    // Search functionality
    elements.searchInput.addEventListener('input', debounce((e) => {
        const searchTerm = e.target.value.toLowerCase();
        // Implement search functionality
    }, 300));

    // Close modals when clicking outside
    Object.values(elements.modals).forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });

    // Close buttons in modals
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    });

    // Place New Order button
    const placeNewOrderBtn = document.getElementById('placeNewOrder');
    if (placeNewOrderBtn) {
        placeNewOrderBtn.addEventListener('click', handlers.handlePlaceOrder);
    }

    // Cart button
    const cartBtn = document.querySelector('.cart-btn');
    if (cartBtn) {
        cartBtn.addEventListener('click', handlers.handleCartClick);
    }

    // View Order buttons
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('view-order')) {
            const orderId = e.target.dataset.id;
            handlers.handleViewOrder(orderId);
        }
    });

    // Update Status buttons
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('update-status')) {
            const orderId = e.target.dataset.id;
            handlers.handleUpdateOrderStatus(orderId);
        }
    });

    // Setup modal and tab managers
    modalManager.setupCloseButtons();
    tabManager.setupTabButtons();
}

// Initialize Application
async function initializeApp() {
    try {
        utils.showLoading();
        
        // Check authentication state
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                state.user = user;
                console.log('User authenticated:', user.uid);
                await Promise.all([
                    loadOrders(),
                    loadProducts()
                ]);
            } else {
                console.log('No user authenticated, redirecting to login');
                window.location.href = 'login.html';
            }
        });

        // Setup event listeners
        setupEventListeners();
    } catch (error) {
        console.error('Error initializing app:', error);
        utils.showToast('Error initializing application', 'error');
    } finally {
        utils.hideLoading();
    }
}

// Load Data
async function loadOrders() {
    try {
        console.log('Loading orders...');
        const orders = await firebaseService.getOrders();
        state.orders = orders;
        ui.renderOrders(orders);
        console.log('Orders loaded successfully:', orders);
    } catch (error) {
        console.error('Error loading orders:', error);
        utils.showToast('Error loading orders', 'error');
    }
}

async function loadProducts() {
    try {
        console.log('Loading products...');
        const products = await firebaseService.getProducts();
        state.products = products;
        
        // Update featured products
        ui.renderProducts(products);
        
        // Update products in the modal catalog
        const modalProductCatalog = document.getElementById('modalProductCatalog');
        if (modalProductCatalog) {
            if (products.length === 0) {
                modalProductCatalog.innerHTML = '<p class="no-data">No products available</p>';
            } else {
                modalProductCatalog.innerHTML = products.map(product => `
                    <div class="card">
                        <img class="card-img" src="${product.image}" alt="${product.name}">
                        <div class="card-body">
                            <h3 class="card-title">${product.name}</h3>
                            <p class="card-text">${product.description}</p>
                            <p class="card-price">R${product.price.toFixed(2)} per ${product.unit}</p>
                            <p class="card-units">${product.unitsPerBox} units per box</p>
                            <button class="btn btn-primary add-to-cart-btn" data-id="${product.id}">
                                Add to Cart
                            </button>
                        </div>
                    </div>
                `).join('');

                // Add event listeners to the newly created buttons
                modalProductCatalog.querySelectorAll('.add-to-cart-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const productId = e.target.dataset.id;
                        const product = products.find(p => p.id === productId);
                        if (product) {
                            cartManager.addItem(product);
                            utils.showToast('Product added to cart', 'success');
                        }
                    });
                });
            }
        }
        
        console.log('Products loaded successfully:', products);
    } catch (error) {
        console.error('Error loading products:', error);
        utils.showToast('Error loading products', 'error');
    }
}

// Utility function for debouncing
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

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);

// Initialize the dashboard when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded, initializing application...");
    initializeDOMElements();
    loadCustomerOrders();
    setupOrderTracking();
    setupNotifications();
    initializePage();
    setupButtonEventListeners();
});

// Add new function to set up all button event listeners
function setupButtonEventListeners() {
    // Place New Order button
    const placeNewOrderBtn = document.getElementById('placeNewOrder');
    if (placeNewOrderBtn) {
        placeNewOrderBtn.addEventListener('click', () => {
            const newOrderModal = document.getElementById('newOrderModal');
            if (newOrderModal) {
                newOrderModal.style.display = 'block';
                loadProducts();
                // Switch to products tab
                const productsTab = document.querySelector('.tab[data-tab="products"]');
                if (productsTab) {
                    productsTab.click();
                }
            }
        });
    }

    // Cart button in header
    const cartBtn = document.querySelector('.cart-btn');
    if (cartBtn) {
        cartBtn.addEventListener('click', () => {
            const newOrderModal = document.getElementById('newOrderModal');
            if (newOrderModal) {
                newOrderModal.style.display = 'block';
                // Load products into the catalog
                loadProducts();
                // Update cart display
                updateCartDisplay(cartManager.getItems());
                // Update modal cart count
                const modalCartCount = document.querySelector('#modalCartCount');
                if (modalCartCount) {
                    modalCartCount.textContent = `(${cartManager.getCount()})`;
                }
                // Switch to cart tab first
                const cartTab = document.querySelector('.tab[data-tab="cart"]');
                if (cartTab) {
                    cartTab.click();
                }
                // Then switch to checkout tab
                setTimeout(() => {
                    const checkoutTab = document.querySelector('.tab[data-tab="checkout"]');
                    if (checkoutTab) {
                        checkoutTab.click();
                    }
                }, 100);
            }
        });
    }

    // Continue Shopping button
    const continueShoppingBtn = document.getElementById('continueShoppingBtn');
    if (continueShoppingBtn) {
        continueShoppingBtn.addEventListener('click', () => {
            const productsTab = document.querySelector('.tab[data-tab="products"]');
            if (productsTab) {
                productsTab.click();
            }
        });
    }

    // Proceed to Checkout button
    const proceedCheckoutBtn = document.getElementById('proceedCheckoutBtn');
    if (proceedCheckoutBtn) {
        proceedCheckoutBtn.addEventListener('click', () => {
            const checkoutTab = document.querySelector('.tab[data-tab="checkout"]');
            if (checkoutTab) {
                checkoutTab.click();
            }
        });
    }

    // Back to Cart button
    const backToCartBtn = document.getElementById('backToCartBtn');
    if (backToCartBtn) {
        backToCartBtn.addEventListener('click', () => {
            const cartTab = document.querySelector('.tab[data-tab="cart"]');
            if (cartTab) {
                cartTab.click();
            }
        });
    }

    // View All Orders button
    const viewAllOrdersBtn = document.getElementById('viewAllOrders');
    if (viewAllOrdersBtn) {
        viewAllOrdersBtn.addEventListener('click', () => {
            window.location.href = 'orders.html';
        });
    }

    // Close buttons for all modals
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    });

    // Add to Cart buttons in product cards
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('add-to-cart-btn')) {
            const productId = e.target.dataset.id;
            const product = window.products.find(p => p.id === productId);
            if (product) {
                cartManager.addItem(product);
                showNotification('Product added to cart');
            }
        }
    });

    // Checkout form submission
    const checkoutForm = document.getElementById('checkoutForm');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', (e) => {
            e.preventDefault();
            submitOrder();
        });
    }

    // Payment method change handler
    const paymentMethod = document.getElementById('paymentMethod');
    if (paymentMethod) {
        paymentMethod.addEventListener('change', () => {
            const creditCardFields = document.getElementById('creditCardFields');
            const poFields = document.getElementById('poFields');
            
            if (creditCardFields && poFields) {
                if (paymentMethod.value === 'credit') {
                    creditCardFields.style.display = 'block';
                    poFields.style.display = 'none';
                } else if (paymentMethod.value === 'po') {
                    creditCardFields.style.display = 'none';
                    poFields.style.display = 'block';
                } else {
                    creditCardFields.style.display = 'none';
                    poFields.style.display = 'none';
                }
            }
        });
    }

    // Notification button
    const notificationBtn = document.querySelector('.notification-btn');
    if (notificationBtn) {
        notificationBtn.addEventListener('click', () => {
            // Toggle notifications panel
            const notificationsPanel = document.querySelector('.notifications-panel');
            if (notificationsPanel) {
                notificationsPanel.classList.toggle('active');
            }
        });
    }

    // Search button
    const searchBtn = document.querySelector('.search-container button');
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            const searchInput = document.querySelector('.search-container input');
            if (searchInput) {
                const searchTerm = searchInput.value.trim();
                if (searchTerm) {
                    // Implement search functionality
                    searchProducts(searchTerm);
                }
            }
        });
    }

    // Tab buttons
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.dataset.tab;
            switchTab(tabId);
        });
    });
}

// Add helper functions for button functionality
function switchTab(tabId) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.tab === tabId) {
            tab.classList.add('active');
        }
    });
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
        if (content.id === `${tabId}Tab`) {
            content.classList.add('active');
        }
    });
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function updateCartDisplay(items) {
    const cartItems = document.querySelector('.cart-items');
    if (cartItems) {
        if (items.length === 0) {
            cartItems.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
        } else {
            cartItems.innerHTML = items.map(item => `
                <div class="cart-item" data-id="${item.id}">
                    <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                    <div class="cart-item-details">
                        <h3 class="cart-item-name">${item.name}</h3>
                        <p class="cart-item-price">R${item.price.toFixed(2)}</p>
                        <div class="cart-item-quantity">
                            <button class="quantity-btn" onclick="cartManager.updateQuantity('${item.id}', ${item.quantity - 1})">-</button>
                            <span>${item.quantity}</span>
                            <button class="quantity-btn" onclick="cartManager.updateQuantity('${item.id}', ${item.quantity + 1})">+</button>
                        </div>
                    </div>
                    <button class="cart-item-remove" onclick="cartManager.removeItem('${item.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `).join('');
        }

        // Update cart summary
        const subtotal = cartManager.getTotal();
        const shipping = subtotal > 0 ? 50 : 0;
        const tax = subtotal * 0.15;
        const total = subtotal + shipping + tax;

        const summaryElements = {
            cartSubtotal: document.getElementById('cartSubtotal'),
            cartShipping: document.getElementById('cartShipping'),
            cartTax: document.getElementById('cartTax'),
            cartTotal: document.getElementById('cartTotal')
        };

        if (summaryElements.cartSubtotal) summaryElements.cartSubtotal.textContent = `R${subtotal.toFixed(2)}`;
        if (summaryElements.cartShipping) summaryElements.cartShipping.textContent = `R${shipping.toFixed(2)}`;
        if (summaryElements.cartTax) summaryElements.cartTax.textContent = `R${tax.toFixed(2)}`;
        if (summaryElements.cartTotal) summaryElements.cartTotal.textContent = `R${total.toFixed(2)}`;
    }
} 