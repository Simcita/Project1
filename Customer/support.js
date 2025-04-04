// Firebase config and initialization
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

// Global variables
let customerId = "CUST-001"; // Normally derived from authentication
let companyName = "BCS AI Solutions";

// DOM elements
let supportForm;
let responseForm;
let ticketDetailsModal;
let successModal;
let closeTicketDetails;
let closeSuccessModal;
let viewTicketsBtn;
let currentTicketId;
let currentTicketData;

// Initialize the application - SINGLE DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM fully loaded, initializing support page...");

  // Initialize Firebase if not already initialized
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  // Initialize DOM elements
  initializeDOMElements();

  // Setup event listeners
  setupEventListeners();

  // Load user's support tickets
  loadUserTickets();

  // Setup FAQ functionality
  setupFAQ();

  // Load tickets into the list
  loadTickets();

  // Call handleResize on initial load
  handleResize();

  // Load mock data if in development mode
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    loadMockData();
  }
});

// Rest of your functions remain the same (initializeDOMElements, setupEventListeners, etc.)
// Make sure all functions are properly closed with }

// Initialize DOM elements
function initializeDOMElements() {
supportForm = document.getElementById('supportForm');
responseForm = document.getElementById('responseForm');
ticketDetailsModal = document.getElementById('ticketDetailsModal');
successModal = document.getElementById('successModal');
closeTicketDetails = document.getElementById('closeTicketDetails');
closeSuccessModal = document.getElementById('closeSuccessModal');
viewTicketsBtn = document.getElementById('viewTicketsBtn');
}

// Setup event listeners
function setupEventListeners() {
// Support form submission
if (supportForm) {
  supportForm.addEventListener('submit', (e) => {
    e.preventDefault();
    submitSupportRequest();
  });
}

// Response form submission
const responseForm = document.getElementById('responseForm');
if (responseForm) {
  responseForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await submitTicketResponse();
  });
}

// Modal close buttons
if (closeTicketDetails) {
  closeTicketDetails.addEventListener('click', () => {
    ticketDetailsModal.style.display = 'none';
  });
}

if (closeSuccessModal) {
  closeSuccessModal.addEventListener('click', () => {
    successModal.style.display = 'none';
  });
}

// View tickets button
if (viewTicketsBtn) {
  viewTicketsBtn.addEventListener('click', () => {
    successModal.style.display = 'none';
    const ticketsSection = document.getElementById('supportTickets');
    if (ticketsSection) {
      window.scrollTo({
        top: ticketsSection.offsetTop - 20,
        behavior: 'smooth'
      });
    }
  });
}

// Close modals when clicking outside
window.addEventListener('click', (e) => {
  if (e.target === ticketDetailsModal) {
    ticketDetailsModal.style.display = 'none';
  }
  if (e.target === successModal) {
    successModal.style.display = 'none';
  }
});
}

// Setup FAQ functionality
function setupFAQ() {
const faqItems = document.querySelectorAll('.faq-item');

faqItems.forEach(item => {
  const question = item.querySelector('.faq-question');
  
  if (question) {
    question.addEventListener('click', () => {
      // Toggle active class on clicked item
      item.classList.toggle('active');
      
      // Update toggle sign
      const toggle = question.querySelector('.faq-toggle');
      if (toggle) {
        toggle.textContent = item.classList.contains('active') ? '−' : '+';
      }
    });
  }
});
}

// Submit support request
function submitSupportRequest() {
const requestType = document.getElementById('requestType').value;
const subject = document.getElementById('subject').value;
const orderNumber = document.getElementById('orderNumber').value;
const message = document.getElementById('message').value;
const priority = document.getElementById('priority').value;
const contactMethod = document.getElementById('contactMethod').value;
const contactInfo = document.getElementById('contactInfo').value;

if (!requestType || !subject || !message || !priority || !contactMethod || !contactInfo) {
  alert('Please fill in all required fields.');
  return;
}

const db = firebase.firestore();

// Generate a ticket ID
const ticketId = 'TICKET-' + Date.now();

// Create ticket data object
const ticketData = {
  ticketId: ticketId,
  customerId: customerId,
  companyName: companyName,
  requestType: requestType,
  subject: subject,
  orderNumber: orderNumber || 'N/A',
  message: message,
  priority: priority,
  contactMethod: contactMethod,
  contactInfo: contactInfo,
  status: 'Pending',
  createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  responses: []
};

// Save to Firestore
db.collection('queries')
  .add(ticketData)
  .then((docRef) => {
    console.log('Support ticket submitted with ID:', docRef.id);
    
    // Reset form
    supportForm.reset();
    
    // Show success modal
    document.getElementById('newTicketId').textContent = ticketId;
    successModal.style.display = 'block';
    
    // Reload tickets
    loadUserTickets();
  })
  .catch((error) => {
    console.error('Error submitting support ticket:', error);
    alert('Error submitting support ticket: ' + error.message);
  });
}

// Continuation of the loadUserTickets function
function loadUserTickets() {
  const ticketsList = document.getElementById('ticketsList');
  
  if (!ticketsList) {
    console.error('Tickets list container not found');
    return;
  }
  
  // Show loading indicator
  ticketsList.innerHTML = '<div class="loading-indicator">Loading your tickets...</div>';
  
  const db = firebase.firestore();
  
  // Query tickets for the current customer
  db.collection('queries')
    .where('customerId', '==', customerId)
    .orderBy('createdAt', 'desc')
    .get()
    .then((querySnapshot) => {
      if (querySnapshot.empty) {
        ticketsList.innerHTML = '<div class="no-tickets">You have no support tickets yet.</div>';
        return;
      }
      
      // Clear loading indicator
      ticketsList.innerHTML = '';
      
      // Populate tickets
      querySnapshot.forEach((doc) => {
        const ticketData = doc.data();
        console.log('Ticket data:', ticketData);
        const date = ticketData.createdAt ? new Date(ticketData.createdAt.seconds * 1000) : new Date();
        const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        const ticketElement = document.createElement('div');
        ticketElement.className = 'ticket-item';
        ticketElement.innerHTML = `
          <div class="ticket-id">${ticketData.ticketId}</div>
          <div class="ticket-subject">${ticketData.subject}</div>
          <div class="ticket-date">${formattedDate}</div>
          <div class="ticket-status ${ticketData.status.toLowerCase()}">${ticketData.status}</div>
          <div class="ticket-actions">
            <button class="btn btn-view" data-id="${doc.id}">View</button>
          </div>
        `;
        
        ticketsList.appendChild(ticketElement);
        
        // Add event listener to view button
        const viewButton = ticketElement.querySelector('.btn-view');
        viewButton.addEventListener('click', () => {
          viewTicketDetails(doc.id);
        });
      });
    })
    .catch((error) => {
      console.error('Error loading tickets:', error);
      ticketsList.innerHTML = `<div class="error-message">Error loading tickets: ${error.message}</div>`
    });
}

// View ticket details
async function viewTicketDetails(docId) {
  currentTicketId = docId;
  
  try {
      const doc = await db.collection('queries').doc(docId).get();
      
      if (doc.exists) {
          const ticketData = doc.data();
          
          // Populate ticket details
          document.getElementById('ticketIdDetail').textContent = ticketData.ticketId;
          document.getElementById('ticketStatusDetail').textContent = ticketData.status;
          document.getElementById('ticketSubjectDetail').textContent = ticketData.subject;
          document.getElementById('ticketTypeDetail').textContent = ticketData.requestType;
          document.getElementById('ticketOrderDetail').textContent = ticketData.orderNumber;
          document.getElementById('ticketMessageDetail').textContent = ticketData.message;
          document.getElementById('ticketPriorityDetail').textContent = ticketData.priority;
          document.getElementById('ticketContactMethodDetail').textContent = ticketData.contactMethod;
          document.getElementById('ticketContactInfoDetail').textContent = ticketData.contactInfo;
          
          // Format date
          let dateText = 'Not available';
          if (ticketData.createdAt) {
              const date = new Date(ticketData.createdAt.seconds * 1000);
              dateText = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
          }
          document.getElementById('ticketDateDetail').textContent = dateText;
          
          // Load responses
          loadTicketResponses(ticketData.responses || []);
          
          // Show modal
          ticketDetailsModal.style.display = 'block';
      } else {
          console.error('Ticket not found');
          alert('Ticket not found');
      }
  } catch (error) {
      console.error('Error loading ticket details:', error);
      alert('Error loading ticket details: ' + error.message);
  }
}

// Load ticket responses
function loadTicketResponses(responses) {
  const responsesList = document.getElementById('responsesList');
  
  if (!responsesList) {
      console.error('Responses list container not found');
      return;
  }
  
  if (responses.length === 0) {
      responsesList.innerHTML = '<div class="no-responses">No responses yet.</div>';
      return;
  }
  
  // Clear previous responses
  responsesList.innerHTML = '';
  
  // Sort responses by date (oldest first)
  responses.sort((a, b) => a.timestamp.seconds - b.timestamp.seconds);
  
  // Add responses to the list
  responses.forEach((response) => {
      const responseDate = new Date(response.timestamp.seconds * 1000);
      const formattedDate = responseDate.toLocaleDateString() + ' ' + 
          responseDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      const responseElement = document.createElement('div');
      responseElement.className = `response-item ${response.isSupplier ? 'support' : 'customer'}`;
      responseElement.innerHTML = `
          <div class="response-header">
              <div class="response-author">${response.from}</div>
              <div class="response-time">${formattedDate}</div>
          </div>
          <div class="response-content">${response.message}</div>
      `;
      
      responsesList.appendChild(responseElement);
  });
  
  // Scroll to the latest message
  setTimeout(() => {
      responsesList.scrollTop = responsesList.scrollHeight;
  }, 100);
}

// Submit a response to a ticket
async function submitTicketResponse() {
  if (!currentTicketId) {
      alert('No ticket is currently selected.');
      return;
  }
  
  const responseMessage = document.getElementById('responseMessage');
  if (!responseMessage || !responseMessage.value.trim()) {
      alert('Please enter a response message.');
      return;
  }
  
  try {
      // Get the current ticket document
      const ticketDoc = await db.collection('queries').doc(currentTicketId).get();
      
      if (!ticketDoc.exists) {
          alert('Ticket not found.');
          return;
      }
      
      const ticketData = ticketDoc.data();
      
      // Create response object
      const responseData = {
          from: companyName,
          message: responseMessage.value.trim(),
          timestamp: firebase.firestore.Timestamp.now(),
          isSupplier: false // Set to false for customer messages
      };
      
      // Get existing responses array or create new one
      const responses = ticketData.responses || [];
      responses.push(responseData);
      
      // Update Firestore document
      await db.collection('queries').doc(currentTicketId).update({
          responses: responses,
          lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
          hasNewMessages: true
      });
      
      // Reset form
      responseMessage.value = '';
      
      // Reload ticket details and scroll to the latest message
      await viewTicketDetails(currentTicketId);
      
      // Show success message
      showSuccessMessage('Response submitted successfully');
      
  } catch (error) {
      console.error('Error submitting response:', error);
      showErrorMessage('Error submitting response: ' + error.message);
  }
}

// Add helper functions for showing messages
function showSuccessMessage(message) {
  const successDiv = document.createElement('div');
  successDiv.className = 'alert alert-success';
  successDiv.textContent = message;
  
  const formActions = document.querySelector('.form-actions');
  formActions.insertBefore(successDiv, formActions.firstChild);
  
  setTimeout(() => {
      successDiv.remove();
  }, 3000);
}

function showErrorMessage(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'alert alert-danger';
  errorDiv.textContent = message;
  
  const formActions = document.querySelector('.form-actions');
  formActions.insertBefore(errorDiv, formActions.firstChild);
  
  setTimeout(() => {
      errorDiv.remove();
  }, 3000);
}

// Update ticket status
function updateTicketStatus(docId, newStatus) {
  const db = firebase.firestore();
  
  db.collection('queries').doc(docId)
    .update({
      status: newStatus,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
      console.log('Ticket status updated to:', newStatus);
      
      // Reload user tickets
      loadUserTickets();
      
      // If ticket details are open, refresh them
      if (currentTicketId === docId && ticketDetailsModal.style.display === 'block') {
        viewTicketDetails(docId);
      }
    })
    .catch((error) => {
      console.error('Error updating ticket status:', error);
      alert('Error updating ticket status: ' + error.message);
    });
}

// Mock user authentication (in a real app, this would come from Firebase Auth)
function getCurrentUser() {
  // This is a placeholder - in a real app, this would interact with Firebase Auth
  return {
    customerId: customerId,
    companyName: companyName
  };
}

// Function to handle window resize events
function handleResize() {
  // Adjust UI elements based on window size if needed
  const isMobile = window.innerWidth < 768;
  
  // Apply responsive adjustments if needed
  const supportContainer = document.querySelector('.support-container');
  if (supportContainer) {
    if (isMobile) {
      supportContainer.classList.add('mobile-view');
    } else {
      supportContainer.classList.remove('mobile-view');
    }
  }
}

// Add resize event listener
window.addEventListener('resize', handleResize);

// Call handleResize on initial load
document.addEventListener('DOMContentLoaded', () => {
  handleResize();
});

// Helper function to format dates consistently
function formatDate(timestamp) {
  if (!timestamp) return 'N/A';
  
  const date = new Date(timestamp.seconds * 1000);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Initialize page with mock data for development/demo purposes
function loadMockData() {
  const ticketsList = document.getElementById('ticketsList');
  
  if (!ticketsList || ticketsList.children.length > 1) {
    // Don't load mock data if we already have tickets or the container doesn't exist
    return;
  }
  
  const mockTickets = [
    {
      id: 'mock-1',
      data: () => ({
        ticketId: 'TICKET-001',
        subject: 'Delayed Paper Delivery',
        createdAt: { seconds: Date.now() / 1000 - 86400 },
        status: 'Open',
        requestType: 'Order Issue',
        orderNumber: 'ORD-12345',
        message: 'My paper delivery was scheduled for yesterday but hasn\'t arrived yet.',
        priority: 'High',
        contactMethod: 'Email',
        contactInfo: 'client@company.com',
        responses: []
      })
    },
    {
      id: 'mock-2',
      data: () => ({
        ticketId: 'TICKET-002',
        subject: 'Product Availability Question',
        createdAt: { seconds: Date.now() / 1000 - 172800 },
        status: 'Resolved',
        requestType: 'Product Question',
        orderNumber: 'N/A',
        message: 'When will the recycled printer paper be back in stock?',
        priority: 'Medium',
        contactMethod: 'Phone',
        contactInfo: '555-123-4567',
        responses: [
          {
            from: 'Support Agent',
            message: 'We expect the recycled paper to be back in stock next week. Would you like us to notify you when it\'s available?',
            timestamp: { seconds: Date.now() / 1000 - 86400 }
          }
        ]
      })
    }
  ];
  
  // If in development/demo mode with no Firebase connection, display mock data
  if (typeof firebase === 'undefined' || !firebase.apps.length) {
    console.log('Loading mock ticket data for demo purposes');
    ticketsList.innerHTML = '';
    
    mockTickets.forEach(doc => {
      const ticketData = doc.data();
      const date = new Date(ticketData.createdAt.seconds * 1000);
      const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      const ticketElement = document.createElement('div');
      ticketElement.className = 'ticket-item';
      ticketElement.innerHTML = `
        <div class="ticket-id">${ticketData.ticketId}</div>
        <div class="ticket-subject">${ticketData.subject}</div>
        <div class="ticket-date">${formattedDate}</div>
        <div class="ticket-status ${ticketData.status.toLowerCase()}">${ticketData.status}</div>
        <div class="ticket-actions">
          <button class="btn btn-view" data-id="${doc.id}">View</button>
        </div>
      `;
      
      ticketsList.appendChild(ticketElement);
      
      // Add event listener to view button for mock data
      const viewButton = ticketElement.querySelector('.btn-view');
      viewButton.addEventListener('click', () => {
        document.getElementById('ticketIdDetail').textContent = ticketData.ticketId;
        document.getElementById('ticketStatusDetail').textContent = ticketData.status;
        document.getElementById('ticketSubjectDetail').textContent = ticketData.subject;
        document.getElementById('ticketTypeDetail').textContent = ticketData.requestType;
        document.getElementById('ticketOrderDetail').textContent = ticketData.orderNumber;
        document.getElementById('ticketMessageDetail').textContent = ticketData.message;
        document.getElementById('ticketPriorityDetail').textContent = ticketData.priority;
        document.getElementById('ticketContactMethodDetail').textContent = ticketData.contactMethod;
        document.getElementById('ticketContactInfoDetail').textContent = ticketData.contactInfo;
        
        // Format date
        let dateText = 'Not available';
        if (ticketData.createdAt) {
          const date = new Date(ticketData.createdAt.seconds * 1000);
          dateText = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        }
        document.getElementById('ticketDateDetail').textContent = dateText;
        
        // Load responses
        loadTicketResponses(ticketData.responses || []);
        
        // Show modal
        ticketDetailsModal.style.display = 'block';
        currentTicketId = doc.id;
      });
    });
  }
}

// Call loadMockData when in development mode
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  document.addEventListener('DOMContentLoaded', loadMockData);
}

// Load tickets into the list
function loadTickets() {
  const ticketsList = document.getElementById('ticketsList');
  ticketsList.innerHTML = '<div class="loading-message">Loading tickets...</div>';
  
  db.collection("queries")
      .where("customerId", "==", customerId)
      .orderBy("createdAt", "desc")
      .get()
      .then((querySnapshot) => {
          if (querySnapshot.empty) {
              ticketsList.innerHTML = '<div class="no-data">No support tickets found</div>';
              return;
          }
          
          ticketsList.innerHTML = '';
          
          querySnapshot.forEach((doc) => {
              const ticket = doc.data();
              
              const ticketEl = document.createElement('div');
              ticketEl.className = `ticket-item ${ticket.hasNewMessages ? 'has-unread' : ''}`;
              ticketEl.dataset.id = doc.id;
              
              const createdAt = ticket.createdAt ? new Date(ticket.createdAt.seconds * 1000) : new Date();
              
              ticketEl.innerHTML = `
                  <div class="ticket-id ${ticket.hasNewMessages ? 'unread' : ''}">${ticket.ticketId || 'N/A'}</div>
                  <div class="ticket-subject">${ticket.subject || 'No Subject'}</div>
                  <div class="ticket-date">${createdAt.toLocaleString()}</div>
                  <div class="ticket-status"><span class="status status-${ticket.status ? ticket.status.toLowerCase() : 'pending'}">${ticket.status || 'Pending'}</span></div>
                  <div class="ticket-actions">
                      <button class="btn btn-primary btn-view">View</button>
                  </div>
              `;
              
              ticketsList.appendChild(ticketEl);
              
              // Add click event to the View button
              const viewButton = ticketEl.querySelector('.btn-view');
              if (viewButton) {
                  viewButton.addEventListener('click', (e) => {
                      e.stopPropagation(); // Prevent the row click event from triggering
                      viewTicketDetails(doc.id);
                  });
              }
              
              // Also allow clicking the entire row to view details
              ticketEl.addEventListener('click', () => {
                  viewTicketDetails(doc.id);
              });
          });
      })
      .catch((error) => {
          console.error("Error loading tickets:", error);
          ticketsList.innerHTML = '<div class="error-message">Error loading tickets</div>';
      });
}

// View ticket details
async function viewTicketDetails(ticketId) {
  try {
      // Get the ticket document
      const ticketDoc = await db.collection("queries").doc(ticketId).get();
      
      if (!ticketDoc.exists) {
          alert('Ticket not found.');
          return;
      }
      
      const ticket = ticketDoc.data();
      currentTicketId = ticketId;
      currentTicketData = ticket;
      
      // If there are unread messages, mark them as read
      if (ticket.hasNewMessages) {
          await db.collection("queries").doc(ticketId).update({
              hasNewMessages: false
          });
          
          // Update the ticket item in the list to remove unread styling
          const ticketEl = document.querySelector(`.ticket-item[data-id="${ticketId}"]`);
          if (ticketEl) {
              ticketEl.classList.remove('has-unread');
              const ticketIdEl = ticketEl.querySelector('.ticket-id');
              if (ticketIdEl) {
                  ticketIdEl.classList.remove('unread');
              }
          }
      }
      
      // Populate the modal with ticket details
      document.getElementById('ticketIdDetail').textContent = ticket.ticketId || 'N/A';
      document.getElementById('ticketStatusDetail').textContent = ticket.status || 'Pending';
      document.getElementById('ticketSubjectDetail').textContent = ticket.subject || 'No Subject';
      document.getElementById('ticketTypeDetail').textContent = ticket.requestType || 'N/A';
      document.getElementById('ticketOrderDetail').textContent = ticket.orderNumber || 'N/A';
      document.getElementById('ticketMessageDetail').textContent = ticket.message || 'No message content';
      document.getElementById('ticketPriorityDetail').textContent = ticket.priority || 'Medium';
      document.getElementById('ticketContactMethodDetail').textContent = ticket.contactMethod || 'N/A';
      document.getElementById('ticketContactInfoDetail').textContent = ticket.contactInfo || 'N/A';
      
      const createdDate = ticket.createdAt ? new Date(ticket.createdAt.seconds * 1000) : new Date();
      document.getElementById('ticketDateDetail').textContent = createdDate.toLocaleString();
      
      // Load the conversation history
      const responsesList = document.getElementById('responsesList');
      responsesList.innerHTML = '';
      
      // Add the initial message
      const initialMessage = document.createElement('div');
      initialMessage.className = 'response-item customer';
      initialMessage.innerHTML = `
          <div class="response-header">
              <div class="response-author">You</div>
              <div class="response-time">${createdDate.toLocaleString()}</div>
          </div>
          <div class="response-content">${ticket.message || 'No message content'}</div>
      `;
      responsesList.appendChild(initialMessage);
      
      // Get the conversation history from responses array
      if (ticket.responses && Array.isArray(ticket.responses)) {
          // Sort responses by timestamp in ascending order (oldest first)
          const sortedResponses = [...ticket.responses].sort((a, b) => {
              const timeA = a.timestamp ? a.timestamp.seconds : 0;
              const timeB = b.timestamp ? b.timestamp.seconds : 0;
              return timeA - timeB;
          });

          sortedResponses.forEach(msg => {
              const responseEl = document.createElement('div');
              const isCustomer = msg.from !== "Support Agent";
              responseEl.className = `response-item ${isCustomer ? 'customer' : 'support'}`;
              
              const msgDate = msg.timestamp ? new Date(msg.timestamp.seconds * 1000) : new Date();
              const messageContent = msg.message || 'No message content';
              const sender = isCustomer ? 'You' : 'Support Agent';
              
              responseEl.innerHTML = `
                  <div class="response-header">
                      <div class="response-author">${sender}</div>
                      <div class="response-time">${msgDate.toLocaleString()}</div>
                  </div>
                  <div class="response-content">${messageContent}</div>
              `;
              responsesList.appendChild(responseEl);
          });
      }
      
      // Show the modal
      ticketDetailsModal.style.display = 'block';
      
      // Scroll to the bottom of the conversation
      setTimeout(() => {
          responsesList.scrollTop = responsesList.scrollHeight;
      }, 100);
      
      // Focus on the response textarea
      document.getElementById('responseMessage').focus();
      
  } catch (error) {
      console.error("Error loading ticket details:", error);
      alert("Failed to load ticket details. Please try again.");
  }
}

// Note: loadTickets is already called within the DOMContentLoaded event listener,
// so we don't need a duplicate call here



