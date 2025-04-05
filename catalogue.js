/***********************
 * Firebase Initialization
 ***********************/
function isFirebaseConfigValid(config) {
  return config.apiKey && config.apiKey.length > 0;
}

const firebaseConfig = {
  apiKey: "AIzaSyBEGJ8Sfw8nOZCN3wY8YhBtlGVp67tUCcg",
  authDomain: "project-01-fffa5.firebaseapp.com",
  projectId: "project-01-fffa5",
  storageBucket: "project-01-fffa5.firebasestorage.app",
  messagingSenderId: "989869504960",
  appId: "1:989869504960:web:910d5db9f752a21134f025"
};
let db, auth;

// Only initialize Firebase if config is valid
if (isFirebaseConfigValid(firebaseConfig)) {
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
  auth = firebase.auth();
} else {
  console.warn("Firebase config not set up. Using local storage fallback.");
}

/***********************
 * Product Catalogue Code
 ***********************/
// DOM elements
let searchInput;
let searchBtn;
let categoryFilter;
let sortBy;
let productCatalogue;
let prevPageBtn;
let nextPageBtn;
let currentPageSpan;
let productDetailModal;
let quickViewModal;
let successNotification;
let closeProductDetail;
let closeQuickView;
let closeNotification;

// Product display variables
let currentPage = 1;
let productsPerPage = 6;
let totalPages = 1;
let currentProducts = [];
let filteredProducts = [];
let cart = [];
let customerId = "CUST-001"; // Normally derived from authentication
let companyName = "BCS AI Solutions";

// Extended product data with additional details
const products = [
  {
    id: "PRD-001",
    name: "Premium Toilet Paper Roll",
    description: "High-quality 3-ply toilet paper, soft and absorbent. Perfect for restrooms in office buildings and commercial spaces.",
    price: 24.99,
    image: "https://via.placeholder.com/150",
    unit: "box",
    unitsPerBox: 24,
    category: "toilet",
    material: "Virgin Pulp",
    dimensions: "4.5\" x 4\" x 4\"",
    weight: "12 lbs per box",
    ecoFriendly: "No",
    rating: 4.5,
    reviews: 24,
    featured: true
  },
  {
    id: "PRD-002",
    name: "Heavy-Duty Paper Towels",
    description: "Extra strong paper towels for industrial use. Absorbent and durable for handling tough messes and spills.",
    price: 32.50,
    image: "https://via.placeholder.com/150",
    unit: "box",
    unitsPerBox: 12,
    category: "paper-towels",
    material: "Recycled Paper",
    dimensions: "11\" x 9\" x 10\"",
    weight: "18 lbs per box",
    ecoFriendly: "Yes",
    rating: 4.2,
    reviews: 15,
    featured: true
  },
  {
    id: "PRD-003",
    name: "Eco-Friendly Napkins",
    description: "100% recycled paper napkins, environmentally friendly. Perfect for restaurants and cafeterias committed to sustainability.",
    price: 18.75,
    image: "https://via.placeholder.com/150",
    unit: "box",
    unitsPerBox: 500,
    category: "napkins",
    material: "100% Recycled",
    dimensions: "8\" x 8\" x 12\"",
    weight: "5 lbs per box",
    ecoFriendly: "Yes",
    rating: 4.8,
    reviews: 32,
    featured: true
  },
  {
    id: "PRD-004",
    name: "Facial Tissues",
    description: "Soft and gentle facial tissues with lotion. Perfect for offices, waiting rooms, and public spaces.",
    price: 22.99,
    image: "https://via.placeholder.com/150",
    unit: "box",
    unitsPerBox: 18,
    category: "tissues",
    material: "Virgin Pulp with Aloe",
    dimensions: "5\" x 8\" x 14\"",
    weight: "7 lbs per box",
    ecoFriendly: "No",
    rating: 4.6,
    reviews: 19,
    featured: false
  },
  {
    id: "PRD-005",
    name: "Printer Paper - A4",
    description: "High-quality A4 paper for printing and copying. Bright white finish for crisp text and vibrant images.",
    price: 45.50,
    image: "https://via.placeholder.com/150",
    unit: "box",
    unitsPerBox: 5,
    category: "printer",
    material: "Wood Pulp",
    dimensions: "8.3\" x 11.7\"",
    weight: "20 lbs per ream",
    ecoFriendly: "No",
    rating: 4.3,
    reviews: 41,
    featured: true
  },
  {
    id: "PRD-006",
    name: "Restroom Paper Towels",
    description: "Multi-fold paper towels for restroom dispensers. Economical and efficient for high-traffic areas.",
    price: 28.99,
    image: "https://via.placeholder.com/150",
    unit: "box",
    unitsPerBox: 16,
    category: "paper-towels",
    material: "Recycled Paper",
    dimensions: "9.2\" x 9.4\" x 7.8\"",
    weight: "15 lbs per box",
    ecoFriendly: "Yes",
    rating: 4.1,
    reviews: 28,
    featured: false
  },
  {
    id: "PRD-007",
    name: "Recycled Toilet Paper",
    description: "Eco-friendly toilet paper made from 100% recycled materials. Soft and environmentally responsible.",
    price: 22.50,
    image: "https://via.placeholder.com/150",
    unit: "box",
    unitsPerBox: 24,
    category: "toilet",
    material: "100% Recycled",
    dimensions: "4.5\" x 4\" x 4\"",
    weight: "11.5 lbs per box",
    ecoFriendly: "Yes",
    rating: 4.4,
    reviews: 36,
    featured: false
  },
  {
    id: "PRD-008",
    name: "Premium Dinner Napkins",
    description: "High-quality dinner napkins with elegant texture. Perfect for upscale restaurants and catering services.",
    price: 26.75,
    image: "https://via.placeholder.com/150",
    unit: "box",
    unitsPerBox: 300,
    category: "napkins",
    material: "Virgin Pulp",
    dimensions: "7.5\" x 7.5\" x 10\"",
    weight: "6 lbs per box",
    ecoFriendly: "No",
    rating: 4.7,
    reviews: 22,
    featured: false
  }
];

// Import the cart manager
import cartManager from './cart.js';

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initializeElements();
  setupEventListeners();
  setupModalEventListeners();
  initializePage();
  addFloatingCartModal();
  cartManager.updateCartUI();
});

// Initialize DOM element references
function initializeElements() {
  searchInput = document.getElementById('searchInput');
  searchBtn = document.getElementById('searchBtn');
  categoryFilter = document.getElementById('categoryFilter');
  sortBy = document.getElementById('sortBy');
  productCatalogue = document.getElementById('productCatalogue');
  prevPageBtn = document.getElementById('prevPage');
  nextPageBtn = document.getElementById('nextPage');
  currentPageSpan = document.getElementById('currentPage');
  productDetailModal = document.getElementById('productDetailModal');
  quickViewModal = document.getElementById('quickViewModal');
  successNotification = document.getElementById('successNotification');
  closeProductDetail = document.getElementById('closeProductDetail');
  closeQuickView = document.getElementById('closeQuickView');
  closeNotification = document.getElementById('closeNotification');
}

// Set up all event listeners
function setupEventListeners() {
  // Search and filter events
  if (searchBtn) {
    searchBtn.addEventListener('click', filterProducts);
  }
  
  if (searchInput) {
    searchInput.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') filterProducts();
    });
  }
  
  if (categoryFilter) {
    categoryFilter.addEventListener('change', filterProducts);
  }
  
  if (sortBy) {
    sortBy.addEventListener('change', filterProducts);
  }

  // Pagination events
  if (prevPageBtn) {
    prevPageBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        displayProducts();
      }
    });
  }

  if (nextPageBtn) {
    nextPageBtn.addEventListener('click', () => {
      if (currentPage < totalPages) {
        currentPage++;
        displayProducts();
      }
    });
  }

  // Modal close events
  if (closeProductDetail) {
    closeProductDetail.addEventListener('click', () => {
      productDetailModal.style.display = 'none';
    });
  }

  if (closeQuickView) {
    closeQuickView.addEventListener('click', () => {
      quickViewModal.style.display = 'none';
    });
  }

  if (closeNotification) {
    closeNotification.addEventListener('click', () => {
      successNotification.style.display = 'none';
    });
  }

  // Tab switching in product detail modal
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabId = tab.getAttribute('data-tab');
      
      // Remove active class from all tabs and content
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      // Add active class to selected tab and content
      tab.classList.add('active');
      const tabContent = document.getElementById(`${tabId}Tab`);
      if (tabContent) {
        tabContent.classList.add('active');
      }
    });
  });

  // Quantity adjusters in product detail
  const decreaseBtn = document.getElementById('decreaseQuantity');
  if (decreaseBtn) {
    decreaseBtn.addEventListener('click', () => {
      const quantityInput = document.getElementById('productQuantity');
      if (quantityInput && parseInt(quantityInput.value) > 1) {
        quantityInput.value = parseInt(quantityInput.value) - 1;
      }
    });
  }

  const increaseBtn = document.getElementById('increaseQuantity');
  if (increaseBtn) {
    increaseBtn.addEventListener('click', () => {
      const quantityInput = document.getElementById('productQuantity');
      if (quantityInput) {
        quantityInput.value = parseInt(quantityInput.value) + 1;
      }
    });
  }

  // Add to cart from product detail
  const addToCartBtn = document.getElementById('addToCartBtn');
  if (addToCartBtn) {
    addToCartBtn.addEventListener('click', () => {
      const productTitle = document.getElementById('productTitle');
      const productQuantity = document.getElementById('productQuantity');
      if (productTitle && productQuantity) {
        const productId = productTitle.getAttribute('data-id');
        const quantity = parseInt(productQuantity.value);
        addToCart(productId, quantity);
      }
    });
  }

  // Quick view add to cart
  const quickViewAddToCart = document.getElementById('quickViewAddToCart');
  if (quickViewAddToCart) {
    quickViewAddToCart.addEventListener('click', () => {
      const quickViewTitle = document.getElementById('quickViewTitle');
      if (quickViewTitle) {
        const productId = quickViewTitle.getAttribute('data-id');
        addToCart(productId, 1);
      }
    });
  }

  // View details from quick view
  const viewDetailsBtn = document.getElementById('viewDetailsBtn');
  if (viewDetailsBtn) {
    viewDetailsBtn.addEventListener('click', () => {
      const quickViewTitle = document.getElementById('quickViewTitle');
      if (quickViewTitle) {
        const productId = quickViewTitle.getAttribute('data-id');
        quickViewModal.style.display = 'none';
        showProductDetail(productId);
      }
    });
  }

  // Close modals when clicking outside
  window.addEventListener('click', (e) => {
    if (productDetailModal && e.target === productDetailModal) {
      productDetailModal.style.display = 'none';
    }
    if (quickViewModal && e.target === quickViewModal) {
      quickViewModal.style.display = 'none';
    }
  });

  // Cart icon click handler
  const cartIndicator = document.getElementById('cartIndicator');
  if (cartIndicator) {
    cartIndicator.addEventListener('click', () => {
      const newOrderModal = document.getElementById('newOrderModal');
      if (newOrderModal) {
        newOrderModal.style.display = 'block';
        // Load products into the catalog
        loadProducts('modalProductCatalog');
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

  // Close cart modal button
  const closeCartModalBtn = document.getElementById('closeCartModal');
  if (closeCartModalBtn) {
    closeCartModalBtn.addEventListener('click', () => {
      const cartModal = document.getElementById('cartModal');
      if (cartModal) {
        cartModal.style.display = 'none';
      }
    });
  }

  // Cart modal checkout button
  const cartModalCheckoutBtn = document.getElementById('cartModalCheckoutBtn');
  if (cartModalCheckoutBtn) {
    cartModalCheckoutBtn.addEventListener('click', () => {
      const cartModal = document.getElementById('cartModal');
      if (cartModal) {
        cartModal.style.display = 'none';
      }
      proceedToPlaceOrder();
    });
  }

  // Continue shopping button in cart modal
  const continueShoppingBtn = document.getElementById('continueShoppingBtn');
  if (continueShoppingBtn) {
    continueShoppingBtn.addEventListener('click', () => {
      const cartModal = document.getElementById('cartModal');
      if (cartModal) {
        cartModal.style.display = 'none';
      }
    });
  }

  // Close modal when clicking outside
  window.addEventListener('click', (e) => {
    const cartModal = document.getElementById('cartModal');
    if (e.target === cartModal) {
      cartModal.style.display = 'none';
    }
  });

  // Add to cart buttons in catalogue
  document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const productId = e.target.dataset.id;
      const product = products.find(p => p.id === productId);
      if (product) {
        cartManager.addItem(product);
      }
    });
  });

  // Update checkout button to open new order modal
  const checkoutBtn = document.getElementById('checkoutBtn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', (e) => {
      e.preventDefault(); // Prevent default link behavior
      const newOrderModal = document.getElementById('newOrderModal');
      if (newOrderModal) {
        newOrderModal.style.display = 'block';
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

  // Subscribe to cart changes
  cartManager.subscribe(function(items) {
    updateCartCount();
    updateFloatingCartDisplay();
  });
}

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
    
    // Try to load cart from localStorage if available
    loadCart();
  }
  
  // Check for URL parameters
  const urlParams = getUrlParams();
  if (urlParams.category || urlParams.search) {
    // Apply URL filters if present
    if (categoryFilter && urlParams.category) {
      categoryFilter.value = urlParams.category;
    }
    if (searchInput && urlParams.search) {
      searchInput.value = urlParams.search;
    }
  }
  
  filterProducts();
}

// Load user data from Firestore (or use default)
function loadUserData() {
  // Check if user is authenticated
  auth.onAuthStateChanged(user => {
    if (user) {
      // Get user details from Firestore
      db.collection('customers').doc(user.uid).get()
        .then(doc => {
          if (doc.exists) {
            const userData = doc.data();
            customerId = userData.customerId || "CUST-001";
            companyName = userData.companyName || "BCS AI Solutions";
            
            // Update UI with company name
            const userInfoSpan = document.querySelector('.user-info span');
            if (userInfoSpan) {
              userInfoSpan.textContent = companyName;
            }
            
            // Load cart data
            loadCart();
          }
        })
        .catch(error => {
          console.error("Error loading user data:", error);
          loadCart();
        });
    } else {
      // Not logged in, try localStorage
      loadCart();
    }
  });
}

// Load cart from localStorage
function loadCart() {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCartCount();
        updateCartDisplay();
    }
}

// Save cart to localStorage
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    updateCartDisplay();
}

// Update cart count badge
function updateCartCount() {
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = `(${totalItems})`;
    }
}

// Update cart display in the modal
function updateCartDisplay() {
    const items = cartManager.getItems();
    const cartItems = document.getElementById('cartItems');
    
    if (!cartItems) return;
    
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

// Update cart item quantity
function updateCartItemQuantity(productId, change, newValue = null) {
    if (newValue !== null) {
        cartManager.updateQuantity(productId, parseInt(newValue) || 0, false);
    } else {
        cartManager.updateQuantity(productId, change, true);
    }
}

// Clear cart
function clearCart() {
    cartManager.clearCart();
}

// Proceed to checkout
function proceedToCheckout() {
    if (cart.length === 0) {
        showNotification('Your cart is empty', 'error');
        return;
    }

    // Switch to checkout tab
    const checkoutTab = document.querySelector('.tab[data-tab="checkout"]');
    if (checkoutTab) {
        checkoutTab.click();
    }

    // Pre-fill order form with cart items
    const orderItems = cart.map(item => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity
    }));

    // Calculate totals
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal > 0 ? 5.00 : 0;
    const tax = subtotal * 0.07;
    const total = subtotal + shipping + tax;

    // Update order summary
    const orderSummary = document.getElementById('orderSummary');
    if (orderSummary) {
        orderSummary.innerHTML = `
            <div class="summary-row">
                <span>Subtotal:</span>
                <span>$${subtotal.toFixed(2)}</span>
            </div>
            <div class="summary-row">
                <span>Shipping:</span>
                <span>$${shipping.toFixed(2)}</span>
            </div>
            <div class="summary-row">
                <span>Tax:</span>
                <span>$${tax.toFixed(2)}</span>
            </div>
            <div class="summary-row summary-total">
                <span>Total:</span>
                <span>$${total.toFixed(2)}</span>
            </div>
        `;
    }

    // Update order items table
    const orderItemsTable = document.getElementById('orderItemsTable');
    if (orderItemsTable) {
        orderItemsTable.innerHTML = orderItems.map(item => `
            <tr>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>$${item.price.toFixed(2)}</td>
                <td>$${(item.price * item.quantity).toFixed(2)}</td>
            </tr>
        `).join('');
    }
}

// Filter products based on search and filter criteria
function filterProducts() {
  const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
  const category = categoryFilter ? categoryFilter.value : '';
  const sortOption = sortBy ? sortBy.value : 'name-asc';
  
  // Filter by search term and category
  filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm) || 
                          product.description.toLowerCase().includes(searchTerm);
    const matchesCategory = category ? product.category === category : true;
    
    return matchesSearch && matchesCategory;
  });
  
  // Sort products
  sortProducts(sortOption);
  
  // Update breadcrumbs if needed
  updateBreadcrumbs(category);
  
  // Reset to first page and display
  currentPage = 1;
  calculateTotalPages();
  displayProducts();
  
  // Update URL parameters
  updateUrlParams();
}

// Update breadcrumbs based on category
function updateBreadcrumbs(category) {
  const breadcrumbsContainer = document.getElementById('breadcrumbsContainer');
  if (breadcrumbsContainer) {
    breadcrumbsContainer.innerHTML = '';
    breadcrumbsContainer.appendChild(generateBreadcrumbs(category));
  }
}

// Sort products based on selected option
function sortProducts(sortOption) {
  switch(sortOption) {
    case 'name-asc':
      filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'name-desc':
      filteredProducts.sort((a, b) => b.name.localeCompare(a.name));
      break;
    case 'price-asc':
      filteredProducts.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      filteredProducts.sort((a, b) => b.price - a.price);
      break;
    default:
      filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
  }
}

// Calculate total pages based on filtered products
function calculateTotalPages() {
  totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  if (totalPages === 0) totalPages = 1; // At least one page even if empty
}

// Display products for current page
function displayProducts() {
  if (!productCatalogue) return;
  
  // Clear loading message
  productCatalogue.innerHTML = '';
  
  // Calculate start and end indices
  const startIndex = (currentPage - 1) * productsPerPage;
  const endIndex = Math.min(startIndex + productsPerPage, filteredProducts.length);
  
  // Get current page products
  currentProducts = filteredProducts.slice(startIndex, endIndex);
  
  // Display "No products found" if empty
  if (currentProducts.length === 0) {
    productCatalogue.innerHTML = '<div class="no-products">No products match your search criteria.</div>';
  } else {
    // Create product cards
    currentProducts.forEach(product => {
      const productCard = createProductCard(product);
      productCatalogue.appendChild(productCard);
    });
  }
  
  // Update pagination UI
  updatePagination();
}

// Create a product card element
function createProductCard(product) {
  const card = document.createElement('div');
  card.className = 'product-card';
  
  // Format price to 2 decimal places
  const formattedPrice = product.price.toFixed(2);
  
  card.innerHTML = `
    <div class="product-image">
      <img src="${product.image}" alt="${product.name}">
      ${product.featured ? '<span class="featured-badge">Featured</span>' : ''}
    </div>
    <div class="product-info">
      <h3>${product.name}</h3>
      <p class="product-description">${product.description.substring(0, 80)}${product.description.length > 80 ? '...' : ''}</p>
      <div class="product-meta">
        <div class="product-rating">
          ${getRatingStars(product.rating)}
          <span class="review-count">(${product.reviews})</span>
        </div>
        <div class="product-price">$${formattedPrice} per ${product.unit}</div>
        <div class="product-units">${product.unitsPerBox} units per box</div>
      </div>
      <div class="product-actions">
        <button class="btn btn-primary quick-view" data-id="${product.id}">Quick View</button>
        <button class="btn btn-secondary view-details" data-id="${product.id}">View Details</button>
      </div>
    </div>
  `;
  
  // Add event listeners for buttons
  card.querySelector('.quick-view').addEventListener('click', () => {
    showQuickView(product.id);
  });
  
  card.querySelector('.view-details').addEventListener('click', () => {
    showProductDetail(product.id);
  });
  
  return card;
}

// Generate HTML for star ratings
function getRatingStars(rating) {
  let stars = '';
  for (let i = 1; i <= 5; i++) {
    if (i <= rating) {
      stars += '<span class="star filled">★</span>';
    } else if (i - 0.5 <= rating) {
      stars += '<span class="star half-filled">★</span>';
    } else {
      stars += '<span class="star">★</span>';
    }
  }
  return stars;
}

// Update pagination UI
function updatePagination() {
  if (!currentPageSpan) return;
  
  currentPageSpan.textContent = `Page ${currentPage} of ${totalPages}`;
  
  if (prevPageBtn) {
    prevPageBtn.disabled = currentPage === 1;
  }
  
  if (nextPageBtn) {
    nextPageBtn.disabled = currentPage === totalPages;
  }
}

// Show quick view modal
function showQuickView(productId) {
  const product = products.find(p => p.id === productId);
  if (!product || !quickViewModal) return;
  
  // Populate quick view modal
  const quickViewTitle = document.getElementById('quickViewTitle');
  const quickViewImage = document.getElementById('quickViewImage');
  const quickViewDescription = document.getElementById('quickViewDescription');
  const quickViewPrice = document.getElementById('quickViewPrice');
  const quickViewUnit = document.getElementById('quickViewUnit');
  
  if (quickViewTitle) quickViewTitle.textContent = product.name;
  if (quickViewTitle) quickViewTitle.setAttribute('data-id', product.id);
  if (quickViewImage) quickViewImage.src = product.image;
  if (quickViewDescription) quickViewDescription.textContent = product.description;
  if (quickViewPrice) quickViewPrice.textContent = `$${product.price.toFixed(2)}`;
  if (quickViewUnit) quickViewUnit.textContent = product.unit;
  
  // Show modal
  quickViewModal.style.display = 'block';
}

// Show product detail modalekgariejj32 
function showProductDetail(productId) {
  const product = products.find(p => p.id === productId);
  if (!product || !productDetailModal) return;
  
  // Populate product detail modal
  const productTitle = document.getElementById('productTitle');
  const productImage = document.getElementById('productImage');
  const productDescription = document.getElementById('productDescription');
  const productPrice = document.getElementById('productPrice');
  const productUnits = document.getElementById('productUnits');
  const productMaterial = document.getElementById('productMaterial');
  const productDimensions = document.getElementById('productDimensions');
  const productWeight = document.getElementById('productWeight');
  const productMaterialDetails = document.getElementById('productMaterialDetails');
  const productEcoFriendly = document.getElementById('productEcoFriendly');
  const productQuantity = document.getElementById('productQuantity');
  
  if (productTitle) {
    productTitle.textContent = product.name;
    productTitle.setAttribute('data-id', product.id);
  }
  if (productImage) productImage.src = product.image;
  if (productDescription) productDescription.textContent = product.description;
  if (productPrice) productPrice.textContent = `$${product.price.toFixed(2)} per ${product.unit}`;
  if (productUnits) productUnits.textContent = product.unitsPerBox;
  if (productMaterial) productMaterial.textContent = product.material;
  if (productDimensions) productDimensions.textContent = product.dimensions;
  if (productWeight) productWeight.textContent = product.weight;
  if (productMaterialDetails) productMaterialDetails.textContent = product.material;
  if (productEcoFriendly) productEcoFriendly.textContent = product.ecoFriendly;
  
  // Reset quantity to 1
  if (productQuantity) productQuantity.value = 1;
  
  // Show modal
  productDetailModal.style.display = 'block';
  
  // Activate specifications tab by default
  const defaultTab = document.querySelector('.tab[data-tab="specifications"]');
  if (defaultTab) defaultTab.click();
}

// Add product to cart
function addToCart(productId, quantity) {
  const product = products.find(p => p.id === productId);
  if (!product) return;
  
  cartManager.addItem(product, quantity);
  
  // Show success notification
  showNotification(`${product.name} added to cart (${quantity} ${quantity === 1 ? 'unit' : 'units'})`);
  
  // Close modals
  if (productDetailModal) productDetailModal.style.display = 'none';
  if (quickViewModal) quickViewModal.style.display = 'none';
  updateFloatingCartDisplay();
}

// Show notification
function showNotification(message) {
  if (!successNotification) return;
  
  const notificationMessage = document.getElementById('notificationMessage');
  if (notificationMessage) notificationMessage.textContent = message;
  
  successNotification.style.display = 'block';
  
  // Auto-hide notification after 3 seconds
  setTimeout(() => {
    successNotification.style.display = 'none';
  }, 3000);
}

// Generate breadcrumbs based on current category
function generateBreadcrumbs(category) {
  const breadcrumbs = document.createElement('div');
  breadcrumbs.className = 'breadcrumbs';
  
  const categoryMap = {
    'toilet': 'Toilet Paper',
    'paper-towels': 'Paper Towels',
    'napkins': 'Napkins',
    'tissues': 'Tissues',
    'printer': 'Printer Paper'
  };
  
  breadcrumbs.innerHTML = `
    <a href="index.html">Home</a> &gt;
    <a href="catalogue.html">Products</a>
    ${category ? `&gt; <span>${categoryMap[category] || category}</span>` : ''}
  `;
  
  return breadcrumbs;
}

// Helper function to get URL parameters
function getUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const category = urlParams.get('category');
  const search = urlParams.get('search');
  
  return { category, search };
}

// Set URL parameters based on current filters
function updateUrlParams() {
  const category = categoryFilter ? categoryFilter.value : '';
  const search = searchInput ? searchInput.value : '';
  
  let url = 'catalogue.html';
  const params = [];
  
  if (category) {
    params.push(`category=${encodeURIComponent(category)}`);
  }
  
  if (search) {
    params.push(`search=${encodeURIComponent(search)}`);
  }
  
  if (params.length > 0) {
    url += '?' + params.join('&');
  }
  
  // Update URL without reloading page
  window.history.pushState({}, '', url);
}

// Check for URL parameters on page load
window.addEventListener('load', () => {
  const { category, search } = getUrlParams();
  
  if (categoryFilter && category) {
    categoryFilter.value = category;
  }
  
  if (searchInput && search) {
    searchInput.value = search;
  }
  
  if (category || search) {
    filterProducts();
  }
});

// Add floating cart modal HTML to the page
function addFloatingCartModal() {
    const floatingCart = document.createElement('div');
    floatingCart.className = 'floating-cart-modal';
    floatingCart.id = 'floatingCartModal';
    floatingCart.innerHTML = `
        <div class="floating-cart-header">
            <h3>Shopping Cart</h3>
            <button class="close-btn" id="closeFloatingCart">&times;</button>
        </div>
        <div class="floating-cart-items" id="floatingCartItems">
            <!-- Cart items will be loaded here -->
        </div>
        <div class="floating-cart-summary">
            <div class="floating-cart-total">
                <span>Total:</span>
                <span id="floatingCartTotal">$0.00</span>
            </div>
            <div class="floating-cart-actions">
                <button class="btn btn-secondary" onclick="viewFullCart()">View Cart</button>
                <button class="btn btn-primary" onclick="proceedToPlaceOrder()">Checkout</button>
            </div>
        </div>
    `;
    document.body.appendChild(floatingCart);

    // Add event listener for close button
    document.getElementById('closeFloatingCart').addEventListener('click', () => {
        document.getElementById('floatingCartModal').style.display = 'none';
    });

    // Add event listener for cart button in header
    const cartButton = document.querySelector('.cart-button');
    if (cartButton) {
        cartButton.addEventListener('click', toggleFloatingCart);
    }

    // Close floating cart when clicking outside
    document.addEventListener('click', (e) => {
        const floatingCart = document.getElementById('floatingCartModal');
        const cartButton = document.querySelector('.cart-button');
        if (floatingCart && cartButton) {
            if (!floatingCart.contains(e.target) && !cartButton.contains(e.target)) {
                floatingCart.style.display = 'none';
            }
        }
    });
}

// Toggle floating cart visibility
function toggleFloatingCart(e) {
    e.preventDefault();
    const floatingCart = document.getElementById('floatingCartModal');
    if (floatingCart) {
        if (floatingCart.style.display === 'block') {
            floatingCart.style.display = 'none';
        } else {
            updateFloatingCartDisplay();
            floatingCart.style.display = 'block';
        }
    }
}

// Update floating cart display
function updateFloatingCartDisplay() {
    const cartItems = document.getElementById('floatingCartItems');
    const cartTotal = document.getElementById('floatingCartTotal');
    
    if (!cartItems || !cartTotal) return;

    if (cartManager.getCount() === 0) {
        cartItems.innerHTML = '<div class="empty-state"><p>Your cart is empty</p></div>';
        cartTotal.textContent = '$0.00';
        return;
    }

    let total = 0;
    cartItems.innerHTML = cartManager.getItems().map(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        return `
            <div class="floating-cart-item">
                <img src="${item.image}" alt="${item.name}" class="floating-cart-item-image">
                <div class="floating-cart-item-details">
                    <div class="floating-cart-item-name">${item.name}</div>
                    <div class="floating-cart-item-price">$${item.price.toFixed(2)}</div>
                    <div class="floating-cart-item-quantity">Qty: ${item.quantity}</div>
                </div>
            </div>
        `;
    }).join('');

    cartTotal.textContent = `$${total.toFixed(2)}`;
}

// View full cart in dashboard
function viewFullCart() {
    window.location.href = 'dashboard.html?openCart=true';
}

// Proceed to place order
function proceedToPlaceOrder() {
    const newOrderModal = document.getElementById('newOrderModal');
    if (newOrderModal) {
        newOrderModal.style.display = 'block';
        // Load products into the catalog
        loadProducts('modalProductCatalog');
        // Update cart display
        updateCartDisplay(cartManager.getItems());
        // Update modal cart count
        const modalCartCount = document.querySelector('#modalCartCount');
        if (modalCartCount) {
            modalCartCount.textContent = `(${cartManager.getCount()})`;
        }
        // Switch to cart tab
        const cartTab = document.querySelector('.tab[data-tab="cart"]');
        if (cartTab) {
            cartTab.click();
        }
    }
}

// Function to load products into a specified container
function loadProducts(containerId = 'productCatalogue') {
    const productContainer = document.getElementById(containerId);
    if (!productContainer) {
        console.error("Product container not found:", containerId);
        return;
    }
    
    let productsHTML = '';
    
    products.forEach(product => {
        productsHTML += `
            <div class="card">
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}">
                    ${product.featured ? '<span class="featured-badge">Featured</span>' : ''}
                </div>
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <p class="product-description">${product.description}</p>
                    <div class="product-meta">
                        <div class="product-price">R${product.price.toFixed(2)} per ${product.unit}</div>
                        <div class="product-units">${product.unitsPerBox} units per box</div>
                    </div>
                    <div class="product-actions">
                        <button class="btn btn-primary add-to-cart-btn" data-id="${product.id}">Add to Cart</button>
                    </div>
                </div>
            </div>
        `;
    });
    
    productContainer.innerHTML = productsHTML;
    
    // Attach event listeners for add-to-cart buttons
    productContainer.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const productId = this.getAttribute('data-id');
            const product = products.find(p => p.id === productId);
            if (product) {
                cartManager.addItem(product);
                showNotification(`${product.name} added to cart`);
                
                // Update modal cart count
                const modalCartCount = document.querySelector('#modalCartCount');
                if (modalCartCount) {
                    modalCartCount.textContent = `(${cartManager.getCount()})`;
                }
            }
        });
    });
}

// Initialize modal event listeners
function setupModalEventListeners() {
    // Close modal buttons
    const closeNewOrder = document.getElementById('closeNewOrder');
    const closeSuccessModal = document.getElementById('closeSuccessModal');
    if (closeNewOrder) closeNewOrder.addEventListener('click', () => {
        document.getElementById('newOrderModal').style.display = 'none';
    });
    if (closeSuccessModal) closeSuccessModal.addEventListener('click', () => {
        document.getElementById('successModal').style.display = 'none';
    });

    // Tab switching
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            tabs.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            this.classList.add('active');
            document.getElementById(targetTab + 'Tab').classList.add('active');
        });
    });

    // Continue shopping button
    const continueShoppingBtn = document.getElementById('continueShoppingBtn');
    if (continueShoppingBtn) {
        continueShoppingBtn.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            document.querySelector('.tab[data-tab="products"]').classList.add('active');
            document.getElementById('productsTab').classList.add('active');
        });
    }

    // Proceed to checkout button
    const proceedCheckoutBtn = document.getElementById('proceedCheckoutBtn');
    if (proceedCheckoutBtn) {
        proceedCheckoutBtn.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            document.querySelector('.tab[data-tab="checkout"]').classList.add('active');
            document.getElementById('checkoutTab').classList.add('active');
        });
    }

    // Back to cart button
    const backToCartBtn = document.getElementById('backToCartBtn');
    if (backToCartBtn) {
        backToCartBtn.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            document.querySelector('.tab[data-tab="cart"]').classList.add('active');
            document.getElementById('cartTab').classList.add('active');
        });
    }

    // Payment method switching
    const paymentMethod = document.getElementById('paymentMethod');
    if (paymentMethod) {
        paymentMethod.addEventListener('change', () => {
            const creditCardFields = document.getElementById('creditCardFields');
            const poFields = document.getElementById('poFields');
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
    const checkoutForm = document.getElementById('checkoutForm');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', (e) => {
            e.preventDefault();
            submitOrder();
        });
    }
}

// Subscribe to cart changes
cartManager.subscribe(function(items) {
    updateCartCount();
    updateCartDisplay(items);
    // Update modal cart count
    const modalCartCount = document.querySelector('#modalCartCount');
    if (modalCartCount) {
        modalCartCount.textContent = `(${cartManager.getCount()})`;
    }
});

// Submit order function
function submitOrder() {
    if (cartManager.getCount() === 0) {
        showNotification('Your cart is empty', 'error');
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

    // Submit to Firestore
    db.collection("orders")
        .add(orderData)
        .then((docRef) => {
            // Clear cart
            cartManager.clearCart();

            // Close order modal and show success
            document.getElementById('newOrderModal').style.display = 'none';
            
            const newOrderId = document.getElementById('newOrderId');
            if (newOrderId) newOrderId.textContent = orderData.orderId;
            
            document.getElementById('successModal').style.display = 'block';
        })
        .catch(error => {
            console.error("Error placing order: ", error);
            showNotification('Error placing order: ' + error.message, 'error');
        });
}