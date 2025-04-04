/**
 * Cart Management Module
 * Single source of truth for cart operations with proper storage synchronization
 */
const CartManager = (function() {
  // Private variables
  let _items = [];
  let _initialized = false;
  let _subscribers = [];
  
  /**
   * Initialize the cart from storage
   * @private
   */
  const _initializeCart = function() {
    if (_initialized) return;
    
    try {
      const storedCart = localStorage.getItem('cart');
      if (storedCart) {
        _items = JSON.parse(storedCart);
      }
    } catch (err) {
      console.error('Error initializing cart:', err);
      _items = [];
    }
    
    _initialized = true;
    _notifySubscribers();
  };
  
  /**
   * Save cart to persistent storage
   * @private
   */
  const _saveCart = function() {
    try {
      localStorage.setItem('cart', JSON.stringify(_items));
    } catch (err) {
      console.error('Error saving cart:', err);
    }
    
    _notifySubscribers();
  };
  
  /**
   * Notify all subscribers of cart changes
   * @private
   */
  const _notifySubscribers = function() {
    _subscribers.forEach(callback => {
      try {
        callback(_items.slice()); // Pass a copy to prevent direct manipulation
      } catch (err) {
        console.error('Error in cart subscriber:', err);
      }
    });
  };
  
  /**
   * Find item index in cart
   * @private
   * @param {string} productId - Product ID to find
   * @returns {number} - Index of item or -1 if not found
   */
  const _findItemIndex = function(productId) {
    return _items.findIndex(item => item.id === productId);
  };
  
  // Initialize cart on module load
  _initializeCart();
  
  // Public API
  return {
    /**
     * Subscribe to cart changes
     * @param {function} callback - Function to call when cart changes
     * @returns {function} - Unsubscribe function
     */
    subscribe: function(callback) {
      if (typeof callback !== 'function') {
        throw new Error('Cart subscriber must be a function');
      }
      
      _subscribers.push(callback);
      
      // Immediately notify with current state
      try {
        callback(_items.slice());
      } catch (err) {
        console.error('Error in cart subscriber:', err);
      }
      
      // Return unsubscribe function
      return function unsubscribe() {
        const index = _subscribers.indexOf(callback);
        if (index !== -1) {
          _subscribers.splice(index, 1);
        }
      };
    },
    
    /**
     * Get all items in cart
     * @returns {Array} - Copy of cart items
     */
    getItems: function() {
      return _items.slice(); // Return a copy to prevent direct manipulation
    },
    
    /**
     * Get total number of items in cart
     * @returns {number} - Total item count
     */
    getCount: function() {
      return _items.reduce((total, item) => total + (item.quantity || 0), 0);
    },
    
    /**
     * Get total price of items in cart
     * @returns {number} - Total price
     */
    getTotal: function() {
      return _items.reduce((total, item) => {
        return total + ((item.price || 0) * (item.quantity || 0));
      }, 0);
    },
    
    /**
     * Add item to cart
     * @param {Object} product - Product to add
     * @param {number} [quantity=1] - Quantity to add
     */
    addItem: function(product, quantity = 1) {
      if (!product || !product.id) {
        console.error('Invalid product:', product);
        return;
      }
      
      // Ensure quantity is a positive number
      quantity = Math.max(1, parseInt(quantity) || 1);
      
      const index = _findItemIndex(product.id);
      
      if (index !== -1) {
        // Product already in cart, update quantity
        _items[index].quantity = (_items[index].quantity || 0) + quantity;
      } else {
        // Add new product to cart
        _items.push({
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          unit: product.unit || 'item',
          quantity: quantity
        });
      }
      
      _saveCart();
    },
    
    /**
     * Update item quantity
     * @param {string} productId - Product ID to update
     * @param {number} quantity - New quantity (or delta if isIncrement is true)
     * @param {boolean} [isIncrement=false] - If true, quantity is a delta
     */
    updateQuantity: function(productId, quantity, isIncrement = false) {
      const index = _findItemIndex(productId);
      
      if (index === -1) {
        console.error('Product not found in cart:', productId);
        return;
      }
      
      if (isIncrement) {
        // Increment/decrement existing quantity
        _items[index].quantity = Math.max(0, (_items[index].quantity || 0) + quantity);
      } else {
        // Set exact quantity
        _items[index].quantity = Math.max(0, parseInt(quantity) || 0);
      }
      
      // Remove item if quantity is 0
      if (_items[index].quantity === 0) {
        _items.splice(index, 1);
      }
      
      _saveCart();
    },
    
    /**
     * Remove item from cart
     * @param {string} productId - Product ID to remove
     */
    removeItem: function(productId) {
      const index = _findItemIndex(productId);
      
      if (index !== -1) {
        _items.splice(index, 1);
        _saveCart();
      }
    },
    
    /**
     * Clear all items from cart
     */
    clearCart: function() {
      _items = [];
      _saveCart();
    },
    
    /**
     * Check if cart has items
     * @returns {boolean} - True if cart has items
     */
    hasItems: function() {
      return _items.length > 0;
    }
  };
})();

// Export for use in other modules
export default CartManager;