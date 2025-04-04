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

// DOM Elements
const startDateInput = document.getElementById('startDate');
const endDateInput = document.getElementById('endDate');
const applyDateFilterBtn = document.getElementById('applyDateFilter');
const productChartTypeSelect = document.getElementById('productChartType');
const orderChartTypeSelect = document.getElementById('orderChartType');
const downloadProductChartBtn = document.getElementById('downloadProductChart');
const downloadOrderChartBtn = document.getElementById('downloadOrderChart');
const exportTopProductsBtn = document.getElementById('exportTopProducts');

// Chart instances
let productFrequencyChart = null;
let orderFrequencyChart = null;

// Add network status detection
let isOnline = navigator.onLine;
window.addEventListener('online', () => {
    isOnline = true;
    showError('Back online! Data will be refreshed.');
    loadStatistics(); // Refresh data when back online
});
window.addEventListener('offline', () => {
    isOnline = false;
    showError('You are offline. Some features may be limited.');
});

// Statistics Manager Class
class StatisticsManager {
    constructor() {
        this.ordersData = [];
        this.productStats = {};
        this.dailyOrderCounts = {};
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        this.lastSync = null;
        this.loadLastSync();
    }

    // Load last sync time from localStorage
    loadLastSync() {
        const lastSyncStr = localStorage.getItem('statsLastSync');
        if (lastSyncStr) {
            this.lastSync = new Date(lastSyncStr);
        }
    }

    // Save last sync time to localStorage
    saveLastSync() {
        this.lastSync = new Date();
        localStorage.setItem('statsLastSync', this.lastSync.toISOString());
    }

    // Check if data is stale (older than 24 hours)
    isDataStale() {
        if (!this.lastSync) return true;
        const now = new Date();
        const hoursSinceSync = (now - this.lastSync) / (1000 * 60 * 60);
        return hoursSinceSync > 24;
    }

    // Save data to localStorage
    saveToLocalStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    }

    // Load data from localStorage
    loadFromLocalStorage(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error loading from localStorage:', error);
            return null;
        }
    }

    // Cache management
    getCacheKey(startDate, endDate) {
        return `${startDate.toISOString()}-${endDate.toISOString()}`;
    }

    getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        return null;
    }

    setCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    // Data management
    async loadData(startDate, endDate) {
        const cacheKey = this.getCacheKey(startDate, endDate);
        
        // Try to get from memory cache first
        const cachedData = this.getFromCache(cacheKey);
        if (cachedData) {
            console.log('Using cached data');
            this.ordersData = cachedData.orders;
            this.productStats = cachedData.productStats;
            this.dailyOrderCounts = cachedData.dailyOrderCounts;
            return true;
        }

        // Try to get from localStorage if offline
        if (!isOnline) {
            const localData = this.loadFromLocalStorage(cacheKey);
            if (localData) {
                console.log('Using local storage data');
                this.ordersData = localData.orders;
                this.productStats = localData.productStats;
                this.dailyOrderCounts = localData.dailyOrderCounts;
                return true;
            }
            return false;
        }

        try {
            const startTimestamp = firebase.firestore.Timestamp.fromDate(startDate);
            const endTimestamp = firebase.firestore.Timestamp.fromDate(endDate);
            
            const ordersSnapshot = await Promise.race([
                db.collection('orders')
                    .where('orderDate', '>=', startTimestamp)
                    .where('orderDate', '<=', endTimestamp)
                    .get(),
                timeout(30000)
            ]);

            this.ordersData = ordersSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            this.processData();
            
            // Cache the processed data
            this.setCache(cacheKey, {
                orders: this.ordersData,
                productStats: this.productStats,
                dailyOrderCounts: this.dailyOrderCounts
            });

            // Save to localStorage for offline access
            this.saveToLocalStorage(cacheKey, {
                orders: this.ordersData,
                productStats: this.productStats,
                dailyOrderCounts: this.dailyOrderCounts
            });

            this.saveLastSync();
            return true;
        } catch (error) {
            console.error('Error loading data:', error);
            
            // Try to use local storage as fallback
            const localData = this.loadFromLocalStorage(cacheKey);
            if (localData) {
                console.log('Using local storage data as fallback');
                this.ordersData = localData.orders;
                this.productStats = localData.productStats;
                this.dailyOrderCounts = localData.dailyOrderCounts;
                return true;
            }
            
            return false;
        }
    }

    processData() {
        // Reset data storage
        this.productStats = {};
        this.dailyOrderCounts = {};
        
        // Process each order
        this.ordersData.forEach(order => {
            const orderDate = formatDate(order.orderDate);
            this.dailyOrderCounts[orderDate] = (this.dailyOrderCounts[orderDate] || 0) + 1;
            
            // Handle different possible item structures
            const items = order.items || order.cart || order.products || order.cartItems || [];
            
            items.forEach(item => {
                // Get product name with fallbacks
                const productName = item.name || item.productName || item.title || 'Unknown Product';
                
                // Initialize product stats if not exists
                if (!this.productStats[productName]) {
                    this.productStats[productName] = {
                        totalUnits: 0,
                        totalRevenue: 0,
                        orderCount: 0,
                        lastOrderDate: order.orderDate
                    };
                }
                
                // Parse and validate quantity
                const quantity = parseInt(item.quantity);
                if (isNaN(quantity) || quantity < 0) {
                    console.warn(`Invalid quantity for product ${productName}:`, item);
                    return;
                }
                
                // Parse and validate price
                const price = parseFloat(item.price || item.unitPrice);
                if (isNaN(price) || price < 0) {
                    console.warn(`Invalid price for product ${productName}:`, item);
                    return;
                }
                
                // Update product stats with validated values
                this.productStats[productName].totalUnits += quantity;
                this.productStats[productName].totalRevenue += price * quantity;
                this.productStats[productName].orderCount++;
                
                // Update last order date if this order is more recent
                if (order.orderDate > this.productStats[productName].lastOrderDate) {
                    this.productStats[productName].lastOrderDate = order.orderDate;
                }
            });
        });
    }

    clearData() {
        this.ordersData = [];
        this.productStats = {};
        this.dailyOrderCounts = {};
    }

    // Getters
    getOrdersData() {
        return this.ordersData;
    }

    getProductStats() {
        return this.productStats;
    }

    getDailyOrderCounts() {
        return this.dailyOrderCounts;
    }
}

// Initialize Statistics Manager
const statsManager = new StatisticsManager();

// Initialize date range to last 2 months
document.addEventListener('DOMContentLoaded', () => {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 2);
    
    startDateInput.value = formatDateForInput(start);
    endDateInput.value = formatDateForInput(end);
    
    loadStatistics();
    setupEventListeners();
});

function setupEventListeners() {
    applyDateFilterBtn.addEventListener('click', loadStatistics);
    
    productChartTypeSelect.addEventListener('change', () => {
        updateProductChart(statsManager.getProductStats());
    });
    
    orderChartTypeSelect.addEventListener('change', () => {
        updateOrderChart(statsManager.getDailyOrderCounts());
    });
    
    downloadProductChartBtn.addEventListener('click', () => {
        downloadChart(productFrequencyChart, 'product-frequency-chart');
    });
    
    downloadOrderChartBtn.addEventListener('click', () => {
        downloadChart(orderFrequencyChart, 'order-frequency-chart');
    });
    
    exportTopProductsBtn.addEventListener('click', exportTopProducts);
}

// Add timeout utility function
function timeout(ms) {
    return new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), ms);
    });
}

// Add retry utility function
async function retry(fn, retries = 3, delay = 1000) {
    try {
        return await fn();
    } catch (error) {
        if (retries === 0) throw error;
        await new Promise(resolve => setTimeout(resolve, delay));
        return retry(fn, retries - 1, delay);
    }
}

// Update loadStatistics function to handle offline state
async function loadStatistics() {
    showLoading(true);
    
    try {
        const startDate = new Date(startDateInput.value);
        const endDate = new Date(endDateInput.value);
        endDate.setHours(23, 59, 59, 999);
        
        const success = await statsManager.loadData(startDate, endDate);
        
        if (!success) {
            if (!isOnline) {
                throw new Error('You are offline and no cached data is available for this date range.');
            } else {
                throw new Error('Failed to load data');
            }
        }
        
        if (!statsManager.getOrdersData().length) {
            showError('No orders found for the selected date range');
            return;
        }
        
        // Update UI
        updateStatsSummary();
        updateProductChart(statsManager.getProductStats());
        updateOrderChart(statsManager.getDailyOrderCounts());
        updateTopProductsTable();
        
        // Show offline indicator if using cached data
        if (!isOnline) {
            showError('You are offline. Showing cached data.');
        }
        
    } catch (error) {
        console.error('Error loading statistics:', error);
        
        if (error.message === 'Request timeout') {
            showError('Request timed out. Please try again.');
        } else if (error.code === 'permission-denied') {
            showError('You do not have permission to view this data.');
        } else if (error.code === 'unavailable') {
            showError('Service is currently unavailable. Please try again later.');
        } else {
            showError(error.message || 'Failed to load statistics. Please try again.');
        }
        
        clearStatistics();
    } finally {
        showLoading(false);
    }
}

function updateStatsSummary() {
    // Calculate total products sold with proper validation and error handling
    const totalProductsSold = Object.values(statsManager.getProductStats()).reduce((sum, product) => {
        // Validate the totalUnits value
        const units = parseInt(product.totalUnits);
        if (isNaN(units) || units < 0) {
            console.warn('Invalid units count for product:', product);
            return sum;
        }
        return sum + units;
    }, 0);

    // Format and display the total
    document.getElementById('totalProductsSold').textContent = formatNumber(totalProductsSold);
    
    // Find most popular product with validation
    const mostPopular = Object.entries(statsManager.getProductStats())
        .filter(([_, stats]) => {
            const units = parseInt(stats.totalUnits);
            return !isNaN(units) && units >= 0;
        })
        .sort((a, b) => b[1].totalUnits - a[1].totalUnits)[0];
    
    document.getElementById('mostPopularProduct').textContent = mostPopular ? mostPopular[0] : '-';
    
    // Calculate average daily orders with validation
    const totalDays = Object.keys(statsManager.getDailyOrderCounts()).length;
    const totalOrders = Object.values(statsManager.getDailyOrderCounts()).reduce((sum, count) => {
        const orderCount = parseInt(count);
        return sum + (isNaN(orderCount) ? 0 : orderCount);
    }, 0);
    
    const avgDaily = totalDays > 0 ? totalOrders / totalDays : 0;
    document.getElementById('avgDailyOrders').textContent = formatNumber(avgDaily.toFixed(1));
    
    // Find peak order day with validation
    const peakDay = Object.entries(statsManager.getDailyOrderCounts())
        .filter(([_, count]) => {
            const orderCount = parseInt(count);
            return !isNaN(orderCount) && orderCount >= 0;
        })
        .sort((a, b) => b[1] - a[1])[0];
    
    document.getElementById('peakOrderDay').textContent = peakDay ? `${peakDay[0]} (${peakDay[1]} orders)` : '-';
}

function updateProductChart(data) {
    const ctx = document.getElementById('productFrequencyChart').getContext('2d');
    const chartType = productChartTypeSelect.value;
    
    // Prepare data
    const labels = Object.keys(data);
    const units = Object.values(data).map(product => product.totalUnits);
    
    // Destroy existing chart if it exists
    if (productFrequencyChart) {
        productFrequencyChart.destroy();
    }
    
    // Create new chart
    productFrequencyChart = new Chart(ctx, {
        type: chartType,
        data: {
            labels: labels,
            datasets: [{
                label: 'Units Sold',
                data: units,
                backgroundColor: generateColors(labels.length),
                borderColor: 'rgba(255, 255, 255, 0.8)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: chartType === 'pie' ? 'right' : 'top'
                },
                title: {
                    display: true,
                    text: 'Product Purchase Frequency'
                }
            }
        }
    });
}

function updateOrderChart(data) {
    const ctx = document.getElementById('orderFrequencyChart').getContext('2d');
    const chartType = orderChartTypeSelect.value;
    
    // Sort dates and prepare data
    const sortedDates = Object.keys(data).sort();
    const orderCounts = sortedDates.map(date => data[date]);
    
    // Destroy existing chart if it exists
    if (orderFrequencyChart) {
        orderFrequencyChart.destroy();
    }
    
    // Create new chart
    orderFrequencyChart = new Chart(ctx, {
        type: chartType,
        data: {
            labels: sortedDates,
            datasets: [{
                label: 'Number of Orders',
                data: orderCounts,
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top'
                },
                title: {
                    display: true,
                    text: 'Daily Order Frequency'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

function updateTopProductsTable() {
    const tbody = document.getElementById('topProductsTable');
    const products = Object.entries(statsManager.getProductStats())
        .sort((a, b) => b[1].totalUnits - a[1].totalUnits);
    
    tbody.innerHTML = products.map(([name, stats]) => `
        <tr>
            <td>${name}</td>
            <td>${formatNumber(stats.totalUnits)}</td>
            <td>${formatCurrency(stats.totalRevenue)}</td>
            <td>${formatNumber((stats.totalUnits / stats.orderCount).toFixed(1))}</td>
            <td>${formatDate(stats.lastOrderDate)}</td>
        </tr>
    `).join('');
}

function downloadChart(chart, filename) {
    const link = document.createElement('a');
    link.download = `${filename}-${formatDateForFilename(new Date())}.png`;
    link.href = chart.canvas.toDataURL('image/png');
    link.click();
}

function exportTopProducts() {
    const products = Object.entries(statsManager.getProductStats())
        .sort((a, b) => b[1].totalUnits - a[1].totalUnits);
    
    const csvContent = [
        ['Product Name', 'Total Units Sold', 'Total Revenue', 'Average Units Per Order', 'Last Order Date'],
        ...products.map(([name, stats]) => [
            name,
            stats.totalUnits,
            formatCurrency(stats.totalRevenue),
            (stats.totalUnits / stats.orderCount).toFixed(1),
            formatDate(stats.lastOrderDate)
        ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `top-products-${formatDateForFilename(new Date())}.csv`;
    link.click();
}

// Utility functions
function formatDate(date) {
    if (!date) return 'N/A';
    
    const d = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatDateForInput(date) {
    return date.toISOString().split('T')[0];
}

function formatDateForFilename(date) {
    return date.toISOString().split('T')[0].replace(/-/g, '');
}

function formatNumber(num) {
    return parseFloat(num).toLocaleString('en-US');
}

function formatCurrency(amount) {
    return 'R' + parseFloat(amount).toLocaleString('en-ZA', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function generateColors(count) {
    const colors = [];
    for (let i = 0; i < count; i++) {
        const hue = (i * 137.508) % 360; // Use golden angle approximation
        colors.push(`hsla(${hue}, 70%, 60%, 0.7)`);
    }
    return colors;
}

function showLoading(show) {
    const loadingSpinner = document.getElementById('loadingSpinner');
    if (loadingSpinner) {
        loadingSpinner.style.display = show ? 'block' : 'none';
    }
}

// Update clearStatistics function
function clearStatistics() {
    statsManager.clearData();
    
    // Clear UI elements
    document.getElementById('totalProductsSold').textContent = '0';
    document.getElementById('mostPopularProduct').textContent = '-';
    document.getElementById('avgDailyOrders').textContent = '0';
    document.getElementById('peakOrderDay').textContent = '-';
    
    // Clear charts
    if (productFrequencyChart) {
        productFrequencyChart.destroy();
        productFrequencyChart = null;
    }
    if (orderFrequencyChart) {
        orderFrequencyChart.destroy();
        orderFrequencyChart = null;
    }
    
    // Clear table
    document.getElementById('topProductsTable').innerHTML = '';
}

// Update the showError function to be more user-friendly
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <div class="error-content">
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
        </div>
        <button class="error-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    document.body.appendChild(errorDiv);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (errorDiv.parentElement) {
            errorDiv.remove();
        }
    }, 5000);
} 