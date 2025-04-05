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
   * Customer Dashboard Code
   ***********************/
  
  // DOM elements for customer dashboard
  let placeOrderBtn;
  let viewCatalogBtn;
  let orderDetailsModal;
  let newOrderModal;
  let successModal;
  let closeOrderDetails;
  let closeNewOrder;
  let closeSuccessModal;
  let continueShoppingBtn;
  let proceedCheckoutBtn;
  let backToCartBtn;
  let viewOrdersBtn;
  let checkoutForm;
  let paymentMethod;
  let creditCardFields;
  let poFields;
  let tabs;
  let tabContents;
  
  // Cart and order variables for customer dashboard
  let customerId = "CUST-001"; // Normally derived from authentication
  let companyName = "BCS AI solutions";
  
  // Make.com webhook URL for order notifications
  const ORDER_WEBHOOK_URL = 'https://hook.eu2.make.com/b2h2t9f2v1bfqigllg7pjyaggeqe6pnf';
  
  // Import the cart manager
  import cartManager from './cart.js';
  
  // Make products available globally
  window.products = [
    {
      id: "PRD-001",
      name: "Premium Toilet Paper Roll",
      description: "High-quality 3-ply toilet paper, soft and absorbent.",
      price: 249.99,
      image: "https://via.placeholder.com/150",
      unit: "box",
      unitsPerBox: 24
    },
    {
      id: "PRD-002",
      name: "Heavy-Duty Paper Towels",
      description: "Extra strong paper towels for industrial use.",
      price: 325.50,
      image: "https://via.placeholder.com/150",
      unit: "box",
      unitsPerBox: 12
    },
    {
      id: "PRD-003",
      name: "Eco-Friendly Napkins",
      description: "100% recycled paper napkins, environmentally friendly.",
      price: 187.75,
      image: "https://via.placeholder.com/150",
      unit: "box",
      unitsPerBox: 500
    },
    {
      id: "PRD-004",
      name: "Facial Tissues",
      description: "Soft and gentle facial tissues with lotion.",
      price: 229.99,
      image: "https://via.placeholder.com/150",
      unit: "box",
      unitsPerBox: 18
    },
    {
      id: "PRD-005",
      name: "Printer Paper - A4",
      description: "High-quality A4 paper for printing and copying.",
      price: 455.50,
      image: "https://via.placeholder.com/150",
      unit: "box",
      unitsPerBox: 5
    },
    {
      id: "PRD-006",
      name: "Restroom Paper Towels",
      description: "Multi-fold paper towels for restroom dispensers.",
      price: 289.99,
      image: "https://via.placeholder.com/150",
      unit: "box",
      unitsPerBox: 2400
    }
  ];
  
  // Initialize the DOM elements once the page is loaded
  function initializeDOMElements() {
    placeOrderBtn = document.getElementById('placeOrderBtn');
    viewCatalogBtn = document.getElementById('viewCatalogBtn');
    orderDetailsModal = document.getElementById('orderDetailsModal');
    newOrderModal = document.getElementById('newOrderModal');
    successModal = document.getElementById('successModal');
    closeOrderDetails = document.getElementById('closeOrderDetails');
    closeNewOrder = document.getElementById('closeNewOrder');
    closeSuccessModal = document.getElementById('closeSuccessModal');
    continueShoppingBtn = document.getElementById('continueShoppingBtn');
    proceedCheckoutBtn = document.getElementById('proceedCheckoutBtn');
    backToCartBtn = document.getElementById('backToCartBtn');
    viewOrdersBtn = document.getElementById('viewOrdersBtn');
    checkoutForm = document.getElementById('checkoutForm');
    paymentMethod = document.getElementById('paymentMethod');
    creditCardFields = document.getElementById('creditCardFields');
    poFields = document.getElementById('poFields');
    tabs = document.querySelectorAll('.tab');
    tabContents = document.querySelectorAll('.tab-content');
    
    // Add cart icon click handler
    const cartIndicator = document.getElementById('cartIndicator');
    if (cartIndicator) {
        cartIndicator.addEventListener('click', () => {
            if (newOrderModal) {
                newOrderModal.style.display = 'block';
                // Load products into the catalog
                loadProducts();
                // Update cart display
                updateCartDisplay(cartManager.getItems());
                // Update cart count in modal
                const modalCartCount = document.querySelector('#newOrderModal .tab[data-tab="cart"] span');
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
    
    // Add cart modal elements
    const cartModal = document.getElementById('cartModal');
    const cartModalCheckoutBtn = document.getElementById('cartModalCheckoutBtn');
    const closeCartModalBtn = document.getElementById('closeCartModal');
    
    if (cartModalCheckoutBtn) {
        cartModalCheckoutBtn.addEventListener('click', () => {
            // Close cart modal
            if (cartModal) {
                cartModal.style.display = 'none';
            }
            
            // Open new order modal
            if (newOrderModal) {
                newOrderModal.style.display = 'block';
                // Load products into the catalog
                loadProducts();
                // Update cart display
                updateCartDisplay(cartManager.getItems());
                // Update cart count in modal
                const modalCartCount = document.querySelector('#newOrderModal .tab[data-tab="cart"] span');
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
    
    if (closeCartModalBtn) {
        closeCartModalBtn.addEventListener('click', () => {
            if (cartModal) {
                cartModal.style.display = 'none';
            }
        });
    }
    
    // Subscribe to cart changes to update UI
    cartManager.subscribe(function(items) {
        updateCartDisplay(items);
    });
    
    setupEventListeners();
  }
  
  // Set up all event listeners
  function setupEventListeners() {
    // Modal close event listeners
    if (closeOrderDetails) closeOrderDetails.addEventListener('click', () => { orderDetailsModal.style.display = 'none'; });
    if (closeNewOrder) closeNewOrder.addEventListener('click', () => { newOrderModal.style.display = 'none'; });
    if (closeSuccessModal) closeSuccessModal.addEventListener('click', () => { successModal.style.display = 'none'; });
    
    // Place order button
    if (placeOrderBtn) {
      placeOrderBtn.addEventListener('click', () => {
        newOrderModal.style.display = 'block';
        loadProducts();
      });
    }
    
    // Tab switching
    if (tabs && tabs.length > 0) {
      tabs.forEach(tab => {
        tab.addEventListener('click', function() {
          const targetTab = this.getAttribute('data-tab');
          tabs.forEach(t => t.classList.remove('active'));
          tabContents.forEach(content => content.classList.remove('active'));
          this.classList.add('active');
          document.getElementById(targetTab + 'Tab').classList.add('active');
        });
      });
    }
    
    // Continue shopping button
    if (continueShoppingBtn) {
      continueShoppingBtn.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        document.querySelector('.tab[data-tab="products"]').classList.add('active');
        document.getElementById('productsTab').classList.add('active');
      });
    }
    
    // Proceed to checkout button
    if (proceedCheckoutBtn) {
      proceedCheckoutBtn.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        document.querySelector('.tab[data-tab="checkout"]').classList.add('active');
        document.getElementById('checkoutTab').classList.add('active');
      });
    }
    
    // Back to cart button
    if (backToCartBtn) {
      backToCartBtn.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        document.querySelector('.tab[data-tab="cart"]').classList.add('active');
        document.getElementById('cartTab').classList.add('active');
      });
    }
    
    // View orders button
    if (viewOrdersBtn) {
      viewOrdersBtn.addEventListener('click', () => {
        successModal.style.display = 'none';
        const ordersTable = document.getElementById('ordersTable');
        if (ordersTable) {
          window.scrollTo(0, ordersTable.offsetTop);
        }
      });
    }
    
    // Payment method switching
    if (paymentMethod) {
      paymentMethod.addEventListener('change', () => {
        if (paymentMethod.value === 'creditCard') {
          creditCardFields.style.display = 'block';
          poFields.style.display = 'none';
        } else if (paymentMethod.value === 'purchaseOrder') {
          creditCardFields.style.display = 'none';
          poFields.style.display = 'block';
        } else {
          creditCardFields.style.display = 'none';
          poFields.style.display = 'none';
        }
      });
    }
    
    // Checkout form submission
    if (checkoutForm) {
      checkoutForm.addEventListener('submit', (e) => {
        e.preventDefault();
        submitOrder();
      });
    }
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
      if (e.target === orderDetailsModal) {
        orderDetailsModal.style.display = 'none';
      }
      if (e.target === newOrderModal) {
        newOrderModal.style.display = 'none';
      }
      if (e.target === successModal) {
        successModal.style.display = 'none';
      }
    });
  }
  
  // Load orders for the current customer
  function loadCustomerOrders() {
    console.log("Loading customer orders for customer:", customerId);
    
    const ordersTable = document.getElementById('ordersTable');
    if (!ordersTable) {
      console.error("Orders table not found in the DOM");
      return;
    }
    
    const ordersTableBody = ordersTable.querySelector('tbody');
    if (!ordersTableBody) {
      console.error("Orders table body not found in the DOM");
      return;
    }
    
    // Show loading indicator
    ordersTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Loading orders...</td></tr>';
    
    // Get current date and date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    db.collection("orders")
      .where("customerId", "==", customerId)
      .orderBy("orderDate", "desc")
      .get()
      .then((querySnapshot) => {
        let ordersHTML = '';
        let allOrders = [];
        
        // First, collect all orders
        querySnapshot.forEach((doc) => {
          const order = doc.data();
          allOrders.push({ ...order, id: doc.id });
        });
        
        // Filter orders to show only recent and active ones
        const recentOrders = allOrders.filter(order => {
          const orderDate = order.orderDate ? new Date(order.orderDate.seconds * 1000) : null;
          const isRecent = orderDate && orderDate >= thirtyDaysAgo;
          const isActive = order.status && order.status.toLowerCase() !== 'delivered';
          return isRecent || isActive;
        });
        
        if (recentOrders.length === 0) {
          ordersHTML = '<tr><td colspan="5" style="text-align: center;">No recent or active orders found</td></tr>';
        } else {
          recentOrders.forEach(order => {
            let orderDate;
            
            // Handle different date formats
            if (order.orderDate && order.orderDate.seconds) {
              orderDate = new Date(order.orderDate.seconds * 1000).toLocaleDateString();
            } else if (order.orderDate instanceof Date) {
              orderDate = order.orderDate.toLocaleDateString();
            } else if (order.date) {
              if (order.date.seconds) {
                orderDate = new Date(order.date.seconds * 1000).toLocaleDateString();
              } else {
                orderDate = order.date;
              }
            } else {
              orderDate = 'Unknown Date';
            }
            
            let statusClass = '';
            const status = order.status ? order.status.toLowerCase() : '';
            
            switch (status) {
              case 'pending':
                statusClass = 'status-pending';
                break;
              case 'processing':
                statusClass = 'status-processing';
                break;
              case 'shipped':
                statusClass = 'status-shipped';
                break;
              case 'delivered':
                statusClass = 'status-delivered';
                break;
              default:
                statusClass = '';
            }
            
            const totalAmount = order.total ? parseFloat(order.total).toFixed(2) : '0.00';
            
            ordersHTML += `
              <tr>
                <td>${order.orderId || 'N/A'}</td>
                <td>${orderDate}</td>
                <td>R${totalAmount}</td>
                <td><span class="status ${statusClass}">${order.status || 'Unknown'}</span></td>
                <td class="action-buttons">
                  <button class="action-btn view-order-btn" data-id="${order.id}">View</button>
                  <button class="action-btn update-status-btn" data-id="${order.id}" data-status="${order.status || ''}">
                    ${status === 'delivered' ? 'Confirm Delivery' : 'Update Status'}
                  </button>
                </td>
              </tr>
            `;
          });
          
          // Add a row with a link to view all orders if there are more orders than shown
          if (allOrders.length > recentOrders.length) {
            ordersHTML += `
              <tr>
                <td colspan="5" style="text-align: center;">
                  <a href="orders.html" class="btn btn-secondary">View All Orders (${allOrders.length} total)</a>
                </td>
              </tr>
            `;
          }
        }
        
        ordersTableBody.innerHTML = ordersHTML;
        
        // Attach event listeners to view buttons
        document.querySelectorAll('.view-order-btn').forEach(btn => {
          btn.addEventListener('click', function() {
            const orderDocId = this.getAttribute('data-id');
            viewOrderDetails(orderDocId);
          });
        });
        
        // Attach event listeners to update status buttons
        document.querySelectorAll('.update-status-btn').forEach(btn => {
          btn.addEventListener('click', function() {
            const orderDocId = this.getAttribute('data-id');
            const currentStatus = this.getAttribute('data-status');
            updateOrderStatus(orderDocId, currentStatus);
          });
        });
      })
      .catch(error => {
        console.error("Error loading orders: ", error);
        ordersTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center;">Error loading orders: ${error.message}</td></tr>`;
      });
  }
  
  // Function to send order view event to webhook
  async function sendOrderViewToWebhook(orderDocId, orderData) {
    try {
      // Create a simplified payload for view event
      const payload = {
        orderId: orderData.orderId || orderDocId,
        customerId: orderData.customerId,
        companyName: orderData.companyName,
        viewDate: new Date().toISOString(),
        status: orderData.status || 'Unknown',
        source: 'customer_portal',
        action: 'view_order',
        viewedBy: customerId
      };
      
      // Send to webhook without waiting for response - completely silent
      fetch(ORDER_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Source': 'PaperSupply-Customer',
          'X-Webhook-Action': 'view_order'
        },
        body: JSON.stringify(payload)
      }).catch(error => {
        // Only log errors, don't show to user
        console.error('Webhook error (silent):', error);
      });
      
      return true;
    } catch (error) {
      console.error('Error sending view event (silent):', error);
      return false;
    }
  }

  // Function to view order details
  function viewOrderDetails(orderDocId) {
    console.log("Viewing order details for:", orderDocId);
    
    if (!orderDetailsModal) {
      console.error("Order details modal not found");
      return;
    }
    
    db.collection("orders")
      .doc(orderDocId)
      .get()
      .then((doc) => {
        if (doc.exists) {
          const order = doc.data();
          
          // Silently send view event to webhook (non-blocking)
          sendOrderViewToWebhook(orderDocId, order);
          
          document.getElementById('orderIdDisplay').innerText = `Order ID: ${order.orderId || 'N/A'}`;
          
          // Reset tracking steps
          for (let i = 1; i <= 4; i++) {
            const stepElement = document.getElementById('step' + i);
            if (stepElement) {
              stepElement.classList.remove('active', 'completed');
            }
          }
          
          // Set tracking based on status
          const status = order.status ? order.status.toLowerCase() : '';
          
          if (status === 'pending') {
            document.getElementById('step1').classList.add('active');
          } else if (status === 'processing') {
            document.getElementById('step1').classList.add('completed');
            document.getElementById('step2').classList.add('active');
          } else if (status === 'shipped') {
            document.getElementById('step1').classList.add('completed');
            document.getElementById('step2').classList.add('completed');
            document.getElementById('step3').classList.add('active');
          } else if (status === 'delivered') {
            document.getElementById('step1').classList.add('completed');
            document.getElementById('step2').classList.add('completed');
            document.getElementById('step3').classList.add('completed');
            document.getElementById('step4').classList.add('active');
          }
          
          // Populate order items
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
            
            // Populate summary
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
            
            // Display supplier notes if any
            if (order.notes) {
              const orderItems = document.getElementById('orderItems');
              if (orderItems) {
                const notesSection = document.createElement('div');
                notesSection.id = 'orderNotes';
                notesSection.innerHTML = `
                  <h3>Notes from Supplier</h3>
                  <p>${order.notes}</p>
                `;
                
                // Check if notes section already exists
                const existingNotes = document.getElementById('orderNotes');
                if (existingNotes) {
                  existingNotes.replaceWith(notesSection);
                } else {
                  orderItems.after(notesSection);
                }
              }
            }
          }
          
          orderDetailsModal.style.display = 'block';
        } else {
          console.error("No order found with that ID");
          alert("Order not found. It may have been deleted.");
        }
      })
      .catch(error => {
        console.error("Error fetching order details: ", error);
        alert("Error loading order details: " + error.message);
      });
  }
  
  // Function to send order status update to webhook
  async function sendStatusUpdateToWebhook(orderId, newStatus, orderData) {
    try {
      // Create a simplified payload for status update
      const payload = {
        orderId: orderData.orderId || orderId,
        customerId: orderData.customerId,
        companyName: orderData.companyName,
        previousStatus: orderData.status || 'Unknown',
        newStatus: newStatus,
        updateDate: new Date().toISOString(),
        source: 'customer_portal',
        action: 'status_update',
        updatedBy: customerId
      };
      
      console.log('Sending status update webhook silently...', orderId);
      
      // Send to webhook without waiting for response
      fetch(ORDER_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Source': 'PaperSupply-Customer',
          'X-Webhook-Action': 'status_update'
        },
        body: JSON.stringify(payload)
      }).then(response => {
        if (response.ok) {
          console.log('✅ Status update webhook sent successfully');
        } else {
          console.error('❌ Status update webhook failed:', response.status);
        }
      }).catch(error => {
        console.error('❌ Status update webhook error:', error);
      });
      
      return true;
    } catch (error) {
      console.error('Error sending status update to webhook:', error);
      return false;
    }
  }

  // Function to update order status
  function updateOrderStatus(orderDocId, currentStatus) {
    console.log("Updating order status for:", orderDocId, "Current status:", currentStatus);
    
    // Normalize the status for comparison
    const normalizedStatus = currentStatus ? currentStatus.toLowerCase() : '';
    
    // If the order is not yet delivered, show a modal to confirm delivery
    if (normalizedStatus !== 'delivered') {
      if (confirm("Do you confirm that this order has been delivered?")) {
        // Get order details first
        db.collection("orders")
          .doc(orderDocId)
          .get()
          .then((doc) => {
            const orderData = doc.exists ? doc.data() : {};
            const newStatus = 'Delivered';
            
            // Update the database
            return db.collection("orders")
              .doc(orderDocId)
              .update({
                status: newStatus,
                deliveryConfirmedBy: customerId,
                deliveryConfirmedDate: firebase.firestore.FieldValue.serverTimestamp()
              })
              .then(() => {
                // Send status update to webhook in the background
                sendStatusUpdateToWebhook(orderDocId, newStatus, orderData);
                
                alert("Order status updated to Delivered");
                loadCustomerOrders(); // Refresh the orders list
              });
          })
          .catch((error) => {
            console.error("Error updating order status: ", error);
            alert("Error updating order status: " + error.message);
          });
      }
    } else {
      alert("This order has already been marked as delivered.");
    }
  }
  
  // Function to load products into the catalog
  function loadProducts() {
    const productCatalog = document.getElementById('productCatalog');
    if (!productCatalog) {
      console.error("Product catalog container not found");
      return;
    }
    
    let productsHTML = '';
    
    window.products.forEach(product => {
      productsHTML += `
        <div class="card">
          <img class="card-img" src="${product.image}" alt="${product.name}">
          <div class="card-body">
            <h3 class="card-title">${product.name}</h3>
            <p class="card-text">${product.description}</p>
            <p class="card-price">R${product.price.toFixed(2)} per ${product.unit}</p>
            <button class="btn btn-primary add-to-cart-btn" data-id="${product.id}">Add to Cart</button>
          </div>
        </div>
      `;
    });
    
    productCatalog.innerHTML = productsHTML;
    
    // Attach event listeners for add-to-cart buttons
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const productId = this.getAttribute('data-id');
        cartManager.addItem(window.products.find(p => p.id === productId));
      });
    });
  }
  
  // Function to submit an order
  function submitOrder() {
    if (!cartManager.hasItems()) {
      alert("Your cart is empty. Please add items before checking out.");
      return;
    }
    
    // Calculate totals
    const items = cartManager.getItems();
    const subtotal = cartManager.getTotal();
    const shipping = subtotal > 0 ? 5.00 : 0;
    const tax = subtotal * 0.07;
    const total = subtotal + shipping + tax;
    
    // Create order data object
    const orderData = {
      orderId: 'ORD-' + Date.now(),
      customerId: customerId,
      companyName: companyName,
      orderDate: firebase.firestore.FieldValue.serverTimestamp(),
      items: items,
      subtotal: subtotal,
      shipping: shipping,
      tax: tax,
      total: total,
      status: 'Pending',
      notes: '',
      version: 1
    };
    
    console.log("Submitting order:", orderData);
    
    db.collection("orders")
      .add(orderData)
      .then((docRef) => {
        console.log("Order submitted successfully! ID:", docRef.id);
        
        // Send order details to webhook in the background (non-blocking)
        sendOrderToWebhook(orderData);
        
        // Clear cart using cartManager
        cartManager.clearCart();
        
        // Close order modal and show success
        if (newOrderModal) newOrderModal.style.display = 'none';
        
        const newOrderId = document.getElementById('newOrderId');
        if (newOrderId) newOrderId.innerText = orderData.orderId;
        
        if (successModal) successModal.style.display = 'block';
        
        // Refresh the orders list
        loadCustomerOrders();
      })
      .catch(error => {
        console.error("Error placing order: ", error);
        alert("Error placing order: " + error.message);
      });
  }
  
  // Helper function for consistent date formatting
  function formatDate(date) {
    if (!date) return 'Unknown Date';
    
    // Handle Firebase Timestamp
    if (date.seconds) {
      date = new Date(date.seconds * 1000);
    }
    
    // Handle date string
    if (typeof date === 'string') {
      date = new Date(date);
    }
    
    // Return formatted date
    if (date instanceof Date && !isNaN(date)) {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    } else {
      return 'Invalid Date';
    }
  }
  
  // Enable offline persistence
  db.enablePersistence()
    .catch((err) => {
      if (err.code == 'failed-precondition') {
        console.log('Multiple tabs open, persistence can only be enabled in one tab at a time.');
      } else if (err.code == 'unimplemented') {
        console.log('The current browser does not support all of the features required to enable persistence');
      }
    });
  
  // Initialize the dashboard when the page loads
  document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded, initializing application...");
    initializeDOMElements();
    loadCustomerOrders();
    setupOrderTracking();
    setupNotifications();
    initializePage();
  });

  // Add order tracking functionality
  function setupOrderTracking() {
    const ordersRef = db.collection('orders');
    const currentUser = auth.currentUser;

    if (!currentUser) return;

    // Listen for real-time updates to user's orders
    ordersRef.where('customerEmail', '==', currentUser.email)
        .onSnapshot((snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'modified') {
                    const orderData = change.doc.data();
                    updateOrderStatusUI(change.doc.id, orderData);
                    sendOrderStatusNotification(change.doc.id, orderData);
                }
            });
        });
  }

  function updateOrderStatusUI(orderId, orderData) {
    const orderElement = document.querySelector(`[data-order-id="${orderId}"]`);
    if (!orderElement) return;

    const statusElement = orderElement.querySelector('.order-status');
    const timelineElement = orderElement.querySelector('.order-timeline');

    // Update status display
    statusElement.textContent = orderData.status;
    statusElement.className = `order-status status-${orderData.status.toLowerCase()}`;

    // Update timeline
    const timeline = generateOrderTimeline(orderData);
    timelineElement.innerHTML = timeline;
  }

  function generateOrderTimeline(orderData) {
    const timeline = [];
    const statuses = [
        { status: 'Order Placed', timestamp: orderData.orderDate },
        { status: 'Processing', timestamp: orderData.processingDate },
        { status: 'Ready for Collection', timestamp: orderData.readyDate },
        { status: 'Completed', timestamp: orderData.completedDate }
    ];

    statuses.forEach((status, index) => {
        const isCompleted = index <= getStatusIndex(orderData.status);
        const isCurrent = index === getStatusIndex(orderData.status);
        
        timeline.push(`
            <div class="timeline-item ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}">
                <div class="timeline-dot"></div>
                <div class="timeline-content">
                    <div class="timeline-status">${status.status}</div>
                    ${status.timestamp ? `<div class="timeline-date">${formatDate(status.timestamp)}</div>` : ''}
                </div>
            </div>
        `);
    });

    return timeline.join('');
  }

  function getStatusIndex(status) {
    const statusOrder = ['Order Placed', 'Processing', 'Ready for Collection', 'Completed'];
    return statusOrder.indexOf(status);
  }

  function sendOrderStatusNotification(orderId, orderData) {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    // Send notification to Firebase Cloud Messaging
    const notificationRef = db.collection('notifications');
    notificationRef.add({
        userId: currentUser.uid,
        type: 'order_status',
        orderId: orderId,
        status: orderData.status,
        message: `Your order #${orderId} is now ${orderData.status}`,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        read: false
    });
  }

  // Add notification listener
  function setupNotifications() {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const notificationsRef = db.collection('notifications');
    notificationsRef.where('userId', '==', currentUser.uid)
        .orderBy('timestamp', 'desc')
        .limit(10)
        .onSnapshot((snapshot) => {
            updateNotificationBadge(snapshot.docs.length);
            updateNotificationList(snapshot.docs);
        });
  }

  function updateNotificationBadge(count) {
    const badge = document.querySelector('.notification-badge');
    if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'block' : 'none';
    }
  }

  function updateNotificationList(notifications) {
    const container = document.querySelector('.notifications-container');
    if (!container) return;

    container.innerHTML = notifications.map(doc => {
        const data = doc.data();
        return `
            <div class="notification-item ${data.read ? 'read' : 'unread'}" data-id="${doc.id}">
                <div class="notification-icon">📦</div>
                <div class="notification-content">
                    <div class="notification-message">${data.message}</div>
                    <div class="notification-time">${formatTimeAgo(data.timestamp)}</div>
                </div>
            </div>
        `;
    }).join('');
  }

  // Initialize tracking and notifications when user logs in
  auth.onAuthStateChanged((user) => {
    if (user) {
        setupOrderTracking();
        setupNotifications();
    }
  });

  // Initialize the page
  function initializePage() {
    // First check if auth is configured before trying to use it
    if (auth && typeof auth.onAuthStateChanged === 'function') {
      loadUserData();
    } else {
      // Use default values if auth is not configured
      customerId = "CUST-001";
      companyName = "BCS AI Solutions";
      // Update UI with company name if element exists
      const userInfoSpan = document.querySelector('.user-info span');
      if (userInfoSpan) {
        userInfoSpan.textContent = companyName;
      }
      
      // Try to load cart from localStorage
      loadCart();
    }

    // Check if we should open the new order modal
    const shouldOpenNewOrder = localStorage.getItem('openNewOrder');
    if (shouldOpenNewOrder === 'true') {
      // Remove the flag
      localStorage.removeItem('openNewOrder');
      
      // Open the new order modal
      if (newOrderModal) {
        newOrderModal.style.display = 'block';
        
        // Load cart data and switch to cart tab
        loadCart();
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
    }
  }

  // Update cart display function
  function updateCartDisplay(items) {
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        cartCount.textContent = cartManager.getCount();
    }
    
    // Update cart count in modal
    const modalCartCount = document.querySelector('#newOrderModal .tab[data-tab="cart"] span');
    if (modalCartCount) {
        modalCartCount.textContent = `(${cartManager.getCount()})`;
    }
    
    // Update cart items display if it exists
    const cartItems = document.getElementById('cartItems');
    if (cartItems) {
        if (items.length === 0) {
            cartItems.innerHTML = '<div class="empty-cart">Your cart is empty</div>';
            return;
        }
        
        let html = '';
        let subtotal = 0;
        
        items.forEach(item => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;
            
            html += `
                <div class="cart-item" data-id="${item.id}">
                    <div class="cart-item-image">
                        <img src="${item.image || 'https://via.placeholder.com/50'}" alt="${item.name}">
                    </div>
                    <div class="cart-item-details">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-price">R${item.price.toFixed(2)} per ${item.unit}</div>
                        <div class="cart-item-quantity">
                            <button class="quantity-btn quantity-decrease">-</button>
                            <input type="number" class="quantity-input" value="${item.quantity}" min="1">
                            <button class="quantity-btn quantity-increase">+</button>
                            <button class="remove-item">×</button>
                        </div>
                    </div>
                    <div class="cart-item-total">R${itemTotal.toFixed(2)}</div>
                </div>
            `;
        });
        
        cartItems.innerHTML = html;
        
        // Update totals
        const shipping = subtotal > 0 ? 5.00 : 0;
        const tax = subtotal * 0.07;
        const total = subtotal + shipping + tax;
        
        const cartSubtotal = document.getElementById('cartSubtotal');
        const cartShipping = document.getElementById('cartShipping');
        const cartTax = document.getElementById('cartTax');
        const cartTotal = document.getElementById('cartTotal');
        
        if (cartSubtotal) cartSubtotal.innerText = `R${subtotal.toFixed(2)}`;
        if (cartShipping) cartShipping.innerText = `R${shipping.toFixed(2)}`;
        if (cartTax) cartTax.innerText = `R${tax.toFixed(2)}`;
        if (cartTotal) cartTotal.innerText = `R${total.toFixed(2)}`;
        
        // Add event listeners to cart item buttons
        document.querySelectorAll('.quantity-decrease').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.closest('.cart-item').dataset.id;
                cartManager.updateQuantity(id, -1, true);
            });
        });
        
        document.querySelectorAll('.quantity-increase').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.closest('.cart-item').dataset.id;
                cartManager.updateQuantity(id, 1, true);
            });
        });
        
        document.querySelectorAll('.quantity-input').forEach(input => {
            input.addEventListener('change', function() {
                const id = this.closest('.cart-item').dataset.id;
                cartManager.updateQuantity(id, parseInt(this.value) || 1, false);
            });
        });
        
        document.querySelectorAll('.remove-item').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.closest('.cart-item').dataset.id;
                cartManager.removeItem(id);
            });
        });
    }
    
    // Update checkout form if it exists
    updateCheckoutForm(items);
  }

  // Update checkout form function
  function updateCheckoutForm(items) {
    // Implementation of updateCheckoutForm function
  }
  
  // Function to send order details to webhook
  async function sendOrderToWebhook(orderData) {
    try {
      // Create a simplified payload with essential information
      const payload = {
        orderId: orderData.orderId,
        customerId: orderData.customerId,
        companyName: orderData.companyName,
        orderDate: new Date().toISOString(),
        items: orderData.items.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          unit: item.unit
        })),
        subtotal: orderData.subtotal,
        shipping: orderData.shipping,
        tax: orderData.tax,
        total: orderData.total,
        status: orderData.status,
        source: 'customer_portal',
        action: 'new_order'
      };
      
      console.log('Sending order webhook silently...', orderData.orderId);
      
      // Send to webhook without waiting for response
      fetch(ORDER_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Source': 'PaperSupply-Customer',
          'X-Webhook-Action': 'new_order'
        },
        body: JSON.stringify(payload)
      }).then(response => {
        if (response.ok) {
          console.log('✅ Order webhook sent successfully');
        } else {
          console.error('❌ Order webhook failed:', response.status);
        }
      }).catch(error => {
        console.error('❌ Order webhook error:', error);
      });
      
      // Return true to indicate the attempt was made
      return true;
    } catch (error) {
      console.error('Error sending order to webhook:', error);
      // Don't block the order process if webhook fails
      return false;
    }
  }