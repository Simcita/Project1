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
const queriesTable = document.getElementById('queriesTable');
const queryTableBody = document.getElementById('queryTableBody');
const queryModal = document.getElementById('queryModal');
const queryDetailModal = document.getElementById('queryDetailModal');
const queryResponseForm = document.getElementById('queryResponseForm');
const closeQueryModal = document.querySelectorAll('.close-query-modal');
const closeQueryDetailModal = document.querySelectorAll('.close-query-detail-modal');
const queryFilterForm = document.getElementById('queryFilterForm');
const querySearch = document.getElementById('querySearch');
const statusFilter = document.getElementById('statusFilter');
const priorityFilter = document.getElementById('priorityFilter');
const loadingSpinner = document.getElementById('loadingSpinner');
const queryStats = document.querySelectorAll('.query-stat');
const statCards = document.querySelectorAll('.stat-card');
const clearFiltersBtn = document.getElementById('clearFiltersBtn');

/***********************
 * Global Variables
 ***********************/
let queriesData = [];
let currentQueryId = '';
let currentCustomerId = '';
let currentTicketId = '';
let currentQueryData = {};
let activeStatFilter = null;

// Make.com webhook URL - will be loaded from localStorage
const WEBHOOK_STORAGE_KEY = 'makeWebhookUrl';
let WEBHOOK_URL = 'https://hook.eu2.make.com/b2h2t9f2v1bfqigllg7pjyaggeqe6pnf';

// Store the webhook URL in localStorage if not already stored
if (!localStorage.getItem(WEBHOOK_STORAGE_KEY)) {
    localStorage.setItem(WEBHOOK_STORAGE_KEY, WEBHOOK_URL);
}

// DOM elements for webhook settings
let webhookSettingsModal;
let webhookUrlInput;
let webhookStatusText;
let webhookIndicator;
let closeWebhookModal;
let showWebhookSettingsBtn;
let saveWebhookBtn;
let clearWebhookBtn;
let testWebhookBtn;

/***********************
 * Event Listeners
 ***********************/
document.addEventListener('DOMContentLoaded', () => {
    loadQueries();
    loadQueryStats();

    // Set up all modal close buttons
    if (closeQueryModal) {
        closeQueryModal.forEach(btn => {
            btn.addEventListener('click', () => {
                queryModal.style.display = 'none';
                document.getElementById('responseText').value = ''; // Clear the response text
            });
        });
    }

    if (closeQueryDetailModal) {
        closeQueryDetailModal.forEach(btn => {
            btn.addEventListener('click', () => {
                queryDetailModal.style.display = 'none';
            });
        });
    }

    // Set up the cancel button in the response form
    const cancelBtn = document.querySelector('.form-actions .btn:not(#submitResponseBtn)');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent any default button behavior
            queryModal.style.display = 'none';
            document.getElementById('responseText').value = ''; // Clear the response text
        });
    }

    // Initialize webhook settings elements
    initWebhookSettings();
});

// Close modals when clicking outside
window.addEventListener('click', (event) => {
    if (event.target === queryModal) {
        queryModal.style.display = 'none';
    }
    if (event.target === queryDetailModal) {
        queryDetailModal.style.display = 'none';
    }
});

// Filter form submission
if (queryFilterForm) {
    queryFilterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        filterQueries();
    });
}

// Status filter change
if (statusFilter) {
    statusFilter.addEventListener('change', () => {
        filterQueries();
    });
}

// Priority filter change
if (priorityFilter) {
    priorityFilter.addEventListener('change', () => {
        filterQueries();
    });
}

// Search on keyup after delay
if (querySearch) {
    let searchTimeout;
    querySearch.addEventListener('keyup', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            filterQueries();
        }, 500);
    });
}

// Query response form submission
if (queryResponseForm) {
    queryResponseForm.addEventListener('submit', async (e) => {
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
            
            // Clear the response textarea
            document.getElementById('responseText').value = '';
            
            // Refresh the conversation history
            await viewQueryDetails(currentQueryId);
            
            // Refresh the queries list
            loadQueries();
            
            setTimeout(() => {
                submitBtn.textContent = originalBtnText;
                submitBtn.disabled = false;
            }, 1500);
        } catch (error) {
            console.error("Error updating query:", error);
            alert("Failed to send response. Please try again.");
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
        }
    });
}

// Detail response form submission
const detailResponseForm = document.getElementById('detailResponseForm');
if (detailResponseForm) {
    detailResponseForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const responseText = document.getElementById('responseTextDetail').value;
        const responseStatus = document.getElementById('responseStatusDetail').value;
        const responsePriority = document.getElementById('responsePriorityDetail').value;
        
        if (!responseText.trim()) {
            alert('Please enter a response message.');
            return;
        }
        
        const submitBtn = document.getElementById('submitResponseBtnDetail');
        const originalBtnText = submitBtn.textContent;
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;
        
        try {
            await updateQueryWithResponse(currentQueryId, responseText, responseStatus, responsePriority);
            submitBtn.textContent = 'Sent!';
            
            // Clear the response textarea
            document.getElementById('responseTextDetail').value = '';
            
            // Refresh the conversation history
            await viewQueryDetails(currentQueryId);
            
            // Refresh the queries list
            loadQueries();
            
        setTimeout(() => {
                submitBtn.textContent = originalBtnText;
                submitBtn.disabled = false;
            }, 1500);
        } catch (error) {
            console.error("Error updating query:", error);
            alert("Failed to send response. Please try again.");
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
        }
    });
}

// Add event listeners for stat cards
statCards.forEach(card => {
    card.addEventListener('click', () => {
        const filterType = card.dataset.filter;
        
        // If clicking the same card, clear the filter
        if (activeStatFilter === filterType) {
            activeStatFilter = null;
            card.classList.remove('active');
            clearFilters();
            return;
        }
        
        // Remove active class from all cards
        statCards.forEach(c => c.classList.remove('active'));
        
        // Set new active filter
        activeStatFilter = filterType;
        card.classList.add('active');
        applyStatFilter(filterType);
    });
});

// Add event listener for clear filters button
clearFiltersBtn.addEventListener('click', () => {
    clearFilters();
});

/***********************
 * Functions
 ***********************/

// Load all queries from Firestore
function loadQueries() {
    const tableBody = document.getElementById('queryTableBody');
    tableBody.innerHTML = '<tr><td colspan="8" class="loading-message">Loading queries...</td></tr>';
    
    db.collection("queries")
        .orderBy("createdAt", "desc")
        .get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                tableBody.innerHTML = '<tr><td colspan="8" class="no-data">No queries found</td></tr>';
                return;
            }
            
            tableBody.innerHTML = '';
            let totalQueries = 0;
            let pendingQueries = 0;
            let inProgressQueries = 0;
            let highPriorityQueries = 0;
            let newMessageQueries = 0;
            
            querySnapshot.forEach((doc) => {
                const query = doc.data();
                totalQueries++;
                
                // Update counters
                if (query.status === 'Pending') pendingQueries++;
                if (query.status === 'In Progress') inProgressQueries++;
                if (query.priority === 'High' || query.priority === 'Urgent') highPriorityQueries++;
                if (query.hasNewMessages) newMessageQueries++;
                
        const row = document.createElement('tr');
                if (query.hasNewMessages) {
                    row.classList.add('has-unread');
                }
                
                const createdAt = query.createdAt ? new Date(query.createdAt.seconds * 1000) : new Date();
                const lastUpdated = query.lastUpdated ? new Date(query.lastUpdated.seconds * 1000) : createdAt;
        
        row.innerHTML = `
                    <td class="ticket-id ${query.hasNewMessages ? 'unread' : ''}">${query.ticketId || 'N/A'}</td>
            <td>${query.companyName || 'N/A'}</td>
            <td>${query.subject || 'No Subject'}</td>
                    <td>${createdAt.toLocaleString()}</td>
                    <td>${lastUpdated.toLocaleString()}</td>
                    <td><span class="status status-${query.status ? query.status.toLowerCase() : 'pending'}">${query.status || 'Pending'}</span></td>
                    <td><span class="priority priority-${query.priority ? query.priority.toLowerCase() : 'medium'}">${query.priority || 'Medium'}</span></td>
                    <td>
                        <button class="btn btn-view" data-id="${doc.id}">View</button>
            </td>
        `;
        
                tableBody.appendChild(row);
                
                // Add click event to view button
                const viewButton = row.querySelector('.btn-view');
                viewButton.addEventListener('click', () => {
                    viewQueryDetails(doc.id);
                });
            });
            
            // Update statistics
            document.getElementById('totalQueries').textContent = totalQueries;
            document.getElementById('pendingQueries').textContent = pendingQueries;
            document.getElementById('inProgressQueries').textContent = inProgressQueries;
            document.getElementById('highPriorityQueries').textContent = highPriorityQueries;
            document.getElementById('newMessageQueries').textContent = newMessageQueries;
        })
        .catch((error) => {
            console.error("Error loading queries:", error);
            tableBody.innerHTML = '<tr><td colspan="8" class="error-message">Error loading queries</td></tr>';
        });
}

// View query details
async function viewQueryDetails(queryId) {
    showLoading(true);
    
    try {
        // Get the query document
        const queryDoc = await db.collection("queries").doc(queryId).get();
        
        if (!queryDoc.exists) {
            alert('Query not found.');
            showLoading(false);
            return;
        }
        
        const query = queryDoc.data();
        currentQueryId = queryId;
        currentCustomerId = query.customerId;
        currentTicketId = query.ticketId;
        currentQueryData = query;
        
        // If there are unread messages, mark them as read
        if (query.hasNewMessages) {
            await db.collection("queries").doc(queryId).update({
                hasNewMessages: false
            });
            
            // Update the row in the table to remove unread styling
            const row = document.querySelector(`tr[data-id="${queryId}"]`);
            if (row) {
                row.classList.remove('has-unread');
                const ticketIdCell = row.querySelector('.ticket-id');
                if (ticketIdCell) {
                    ticketIdCell.classList.remove('unread');
                }
            }
            
            // Update the new messages counter
            const newMessageQueriesElement = document.getElementById('newMessageQueries');
            const currentCount = parseInt(newMessageQueriesElement.textContent);
            if (currentCount > 0) {
                newMessageQueriesElement.textContent = currentCount - 1;
            }
        }
        
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
        
        // Set current status and priority in the response form
        const statusSelect = document.getElementById('responseStatus');
        const prioritySelect = document.getElementById('responsePriority');
        
        if (statusSelect) {
            for (let i = 0; i < statusSelect.options.length; i++) {
                if (statusSelect.options[i].value === query.status) {
                    statusSelect.selectedIndex = i;
                    break;
                }
            }
        }
        
        if (prioritySelect) {
            for (let i = 0; i < prioritySelect.options.length; i++) {
                if (prioritySelect.options[i].value === query.priority) {
                    prioritySelect.selectedIndex = i;
                    break;
                }
            }
        }
        
        // Set status and priority in the detail form
        const statusSelectDetail = document.getElementById('responseStatusDetail');
        const prioritySelectDetail = document.getElementById('responsePriorityDetail');
        
        if (statusSelectDetail) {
            for (let i = 0; i < statusSelectDetail.options.length; i++) {
                if (statusSelectDetail.options[i].value === query.status) {
                    statusSelectDetail.selectedIndex = i;
                    break;
                }
            }
        }
        
        if (prioritySelectDetail) {
            for (let i = 0; i < prioritySelectDetail.options.length; i++) {
                if (prioritySelectDetail.options[i].value === query.priority) {
                    prioritySelectDetail.selectedIndex = i;
                    break;
                }
            }
        }
        
        // Load the conversation history
        const conversationContainer = document.getElementById('conversationHistory');
        conversationContainer.innerHTML = '';
        
        // Add the initial message
        const initialMessage = document.createElement('div');
        initialMessage.className = 'message customer-message';
        initialMessage.innerHTML = `
            <div class="message-content">
                <div class="message-text">${query.message || 'No message content'}</div>
                <div class="message-meta">
                    <span class="message-sender">${query.companyName || 'Customer'}</span>
                    <span class="message-time">${createdDate.toLocaleString()}</span>
                </div>
            </div>
        `;
        conversationContainer.appendChild(initialMessage);
        
        // Get the conversation history from responses array
        if (query.responses && Array.isArray(query.responses)) {
            // Sort responses by timestamp in ascending order (oldest first)
            const sortedResponses = [...query.responses].sort((a, b) => {
                const timeA = a.timestamp ? a.timestamp.seconds : 0;
                const timeB = b.timestamp ? b.timestamp.seconds : 0;
                return timeA - timeB;
            });

            sortedResponses.forEach(msg => {
                const messageEl = document.createElement('div');
                const isSupplier = msg.from === "Support Agent";
                messageEl.className = `message ${isSupplier ? 'supplier-message' : 'customer-message'}`;
                
                const msgDate = msg.timestamp ? new Date(msg.timestamp.seconds * 1000) : new Date();
                const messageContent = msg.message || 'No message content';
                const sender = isSupplier ? 'Support Agent' : (query.companyName || 'Customer');
                
                messageEl.innerHTML = `
                    <div class="message-content">
                        <div class="message-text">${messageContent}</div>
                        <div class="message-meta">
                            <span class="message-sender">${sender}</span>
                            <span class="message-time">${msgDate.toLocaleString()}</span>
                        </div>
                    </div>
                `;
                conversationContainer.appendChild(messageEl);
            });
        }
        
        // Show the modal
        queryDetailModal.style.display = 'block';
        
        // Scroll to the bottom of the conversation
        setTimeout(() => {
            conversationContainer.scrollTop = conversationContainer.scrollHeight;
        }, 100);
        
        // Focus on the response textarea
        document.getElementById('responseText').focus();
        
        showLoading(false);
    } catch (error) {
        console.error("Error loading query details:", error);
        alert("Failed to load query details. Please try again.");
        showLoading(false);
    }
}

// Initialize webhook settings
function initWebhookSettings() {
    // Get DOM elements
    webhookSettingsModal = document.getElementById('webhookSettingsModal');
    webhookUrlInput = document.getElementById('webhookUrl');
    webhookStatusText = document.getElementById('webhookStatusText');
    webhookIndicator = document.querySelector('.webhook-indicator');
    closeWebhookModal = document.querySelectorAll('.close-webhook-modal');
    showWebhookSettingsBtn = document.getElementById('showWebhookSettingsBtn');
    saveWebhookBtn = document.getElementById('saveWebhookBtn');
    clearWebhookBtn = document.getElementById('clearWebhookBtn');
    testWebhookBtn = document.getElementById('testWebhookBtn');
    
    // Always load the hardcoded webhook URL to ensure it's available
    webhookUrlInput.value = WEBHOOK_URL;
    webhookStatusText.textContent = 'Webhook configured';
    webhookIndicator.classList.add('active');
    
    // Event listeners
    if (closeWebhookModal) {
        closeWebhookModal.forEach(btn => {
            btn.addEventListener('click', () => {
                webhookSettingsModal.style.display = 'none';
            });
        });
    }
    
    if (showWebhookSettingsBtn) {
        showWebhookSettingsBtn.addEventListener('click', () => {
            webhookSettingsModal.style.display = 'block';
        });
    }
    
    if (saveWebhookBtn) {
        saveWebhookBtn.addEventListener('click', saveWebhookSettings);
    }
    
    if (clearWebhookBtn) {
        clearWebhookBtn.addEventListener('click', clearWebhookSettings);
    }
    
    if (testWebhookBtn) {
        testWebhookBtn.addEventListener('click', testWebhookConnection);
    }
    
    // Close webhookSettingsModal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === webhookSettingsModal) {
            webhookSettingsModal.style.display = 'none';
        }
    });
}

// Save webhook settings
function saveWebhookSettings() {
    const webhookUrl = webhookUrlInput.value.trim();
    
    if (!webhookUrl) {
        alert('Please enter a valid webhook URL');
        return;
    }
    
    // Save to localStorage
    localStorage.setItem(WEBHOOK_STORAGE_KEY, webhookUrl);
    WEBHOOK_URL = webhookUrl;
    
    // Update UI
    webhookStatusText.textContent = 'Webhook configured';
    webhookIndicator.classList.add('active');
    
    // Show confirmation
    alert('Webhook settings saved successfully');
}

// Clear webhook settings
function clearWebhookSettings() {
    // Clear from localStorage
    localStorage.removeItem(WEBHOOK_STORAGE_KEY);
    WEBHOOK_URL = '';
    
    // Update UI
    webhookUrlInput.value = '';
    webhookStatusText.textContent = 'No webhook configured';
    webhookIndicator.classList.remove('active');
}

// Test webhook connection
async function testWebhookConnection() {
    const webhookUrl = webhookUrlInput.value.trim();
    
    if (!webhookUrl) {
        alert('Please enter a webhook URL first');
        return;
    }
    
    // Update status
    webhookStatusText.textContent = 'Testing connection...';
    
    try {
        // Create test payload
        const testPayload = {
            test: true,
            message: 'This is a test from PaperSupply admin panel',
            timestamp: new Date().toISOString()
        };
        
        // Send test request
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testPayload)
        });
        
        if (response.ok) {
            webhookStatusText.textContent = 'Connection successful';
            webhookIndicator.classList.add('active');
            alert('Webhook test successful!');
        } else {
            const errorText = await response.text();
            webhookStatusText.textContent = 'Connection failed';
            webhookIndicator.classList.remove('active');
            alert(`Webhook test failed: ${response.status} - ${errorText}`);
        }
    } catch (error) {
        console.error('Error testing webhook:', error);
        webhookStatusText.textContent = 'Connection failed';
        webhookIndicator.classList.remove('active');
        alert(`Webhook test failed: ${error.message}`);
    }
}

// Add webhook configuration check
function checkWebhookConfig() {
    if (!WEBHOOK_URL) {
        console.error('Webhook URL is not configured. Please configure it in the webhook settings.');
        return false;
    }
    return true;
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
            timestamp: new Date(),
            isSupplier: true  // Explicitly mark as supplier message
        };
        
        // Get existing responses array or create new one
        const responses = query.responses && Array.isArray(query.responses) 
            ? [...query.responses, newResponse] 
            : [newResponse];
        
        // Always send to webhook first
        try {
            await sendResponseToWebhook(query, newResponse, newStatus, newPriority);
            console.log("✅ Webhook notification sent successfully");
        } catch (webhookError) {
            console.error("⚠️ Webhook error (continuing anyway):", webhookError);
        }
        
        // If status is "Closed", delete the ticket
        if (newStatus === "Closed") {
            console.log("Deleting ticket due to closed status:", queryId);
            await db.collection("queries").doc(queryId).delete();
            console.log("Ticket successfully deleted");
            
            // Close the modal and refresh the queries list
            queryModal.style.display = 'none';
            loadQueries();
            return true;
        }
        
        // Otherwise, update the query document
        console.log("Updating ticket status to:", newStatus);
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

async function sendResponseToWebhook(query, message, newStatus, newPriority) {
    try {
        // Create simplified payload
        const payload = {
            ticketId: query.ticketId || '',
            customerId: query.customerId || '',
            companyName: query.companyName || '',
            subject: query.subject || '',
            message: query.message || '',
            response: message.message || '', 
            status: newStatus,
            priority: newPriority,
            timestamp: new Date().toISOString()
        };
        
        console.log('Sending webhook to:', WEBHOOK_URL);
        
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            throw new Error(`Webhook request failed with status ${response.status}`);
        }
        
        return true;
    } catch (error) {
        console.error('Error in sendResponseToWebhook:', error);
        throw error;
    }
}

// Filter queries based on search and filter criteria
function filterQueries() {
    const searchTerm = querySearch.value.toLowerCase();
    const status = statusFilter.value;
    const priority = priorityFilter.value;
    
    const filteredQueries = queriesData.filter(query => {
        // Filter by search term
        const matchesSearch = !searchTerm || 
            (query.ticketId && query.ticketId.toLowerCase().includes(searchTerm)) ||
            (query.companyName && query.companyName.toLowerCase().includes(searchTerm)) ||
            (query.subject && query.subject.toLowerCase().includes(searchTerm)) ||
            (query.message && query.message.toLowerCase().includes(searchTerm));
        
        // Filter by status
        const matchesStatus = !status || status === 'All' || (query.status === status);
        
        // Filter by priority
        const matchesPriority = !priority || priority === 'All' || (query.priority === priority);
        
        // Filter by new messages if that stat card is active
        const matchesNewMessages = activeStatFilter !== 'new-messages' || query.hasNewMessages === true;
        
        return matchesSearch && matchesStatus && matchesPriority && matchesNewMessages;
    });
    
    renderQueries(filteredQueries);
}

// Load query statistics
function loadQueryStats() {
    // Calculate statistics from the current queriesData array
    const totalQueries = queriesData.length;
    const pendingQueries = queriesData.filter(query => query.status === "Pending").length;
    const inProgressQueries = queriesData.filter(query => query.status === "In Progress").length;
    const highPriorityQueries = queriesData.filter(query => query.priority === "High" || query.priority === "Urgent").length;
    const newMessageQueries = queriesData.filter(query => query.hasNewMessages === true).length;
    
    // Update the stat elements with proper error handling
    const updateStatValue = (elementId, value) => {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
            element.classList.add('stat-update');
            setTimeout(() => {
                element.classList.remove('stat-update');
            }, 1000);
        } else {
            console.error(`Element with id '${elementId}' not found`);
        }
    };
    
    // Update each statistic
    updateStatValue('totalQueries', totalQueries);
    updateStatValue('pendingQueries', pendingQueries);
    updateStatValue('inProgressQueries', inProgressQueries);
    updateStatValue('highPriorityQueries', highPriorityQueries);
    updateStatValue('newMessageQueries', newMessageQueries);
}

// Show or hide loading spinner
function showLoading(show) {
    if (loadingSpinner) {
        loadingSpinner.style.display = show ? 'block' : 'none';
    }
}

// Reload queries periodically to check for updates
function setupPeriodicRefresh() {
    setInterval(() => {
        loadQueries();
        loadQueryStats();
    }, 60000); // Refresh every minute
}

// Initialize periodic refresh
setupPeriodicRefresh();

// Function to apply stat card filter
function applyStatFilter(filterType) {
    // Reset all filter controls first
    statusFilter.value = 'All';
    priorityFilter.value = 'All';
    querySearch.value = '';
    
    // Apply the new filter
    switch (filterType) {
        case 'all':
            // Show all queries
            break;
        case 'pending':
            statusFilter.value = 'Pending';
            break;
        case 'in-progress':
            statusFilter.value = 'In Progress';
            break;
        case 'high-priority':
            priorityFilter.value = 'High';
            break;
        case 'new-messages':
            // This will be handled in the filterQueries function
            break;
    }
    filterQueries();
}

// Function to clear all filters
function clearFilters() {
    // Reset filter controls
    statusFilter.value = 'All';
    priorityFilter.value = 'All';
    querySearch.value = '';
    
    // Remove active state from stat cards
    statCards.forEach(card => card.classList.remove('active'));
    activeStatFilter = null;
    
    // Reset queries display
    filterQueries();
}