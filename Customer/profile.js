
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



document.addEventListener('DOMContentLoaded', function() {
  // Mock user authentication state
  const mockAuthUser = {
    uid: 'test-user-123',
    email: 'test@example.com',
    displayName: 'Test User'
  };

  // Mock customer data
  const mockCustomerData = {
    customerId: 'CUST-001',
    companyName: 'BCS AI Solutions',
    email: 'contact@bcsai.com',
    phone: '(555) 123-4567',
    address: '123 Tech Boulevard',
    city: 'Innovation City',
    state: 'California',
    postalCode: '90210',
    country: 'United States',
    contactName: 'Alex Johnson',
    contactPosition: 'Procurement Manager',
    contactEmail: 'alex@bcsai.com',
    contactPhone: '(555) 987-6543',
    accountType: 'Premium',
    customerSince: 'January 15, 2023',
    creditTerms: 'Net 30',
    creditLimit: '$25,000.00',
    logoUrl: 'https://via.placeholder.com/150'
  };

  // Function to populate profile data in the view
  function populateProfileData(data) {
    // Header company name
    document.getElementById('companyNameHeader').textContent = data.companyName;
    
    // View section elements
    document.getElementById('companyNameView').textContent = data.companyName;
    document.getElementById('accountTypeView').textContent = data.accountType;
    document.getElementById('customerIdView').textContent = data.customerId;
    document.getElementById('companyNameDetailView').textContent = data.companyName;
    document.getElementById('emailView').textContent = data.email;
    document.getElementById('phoneView').textContent = data.phone;
    document.getElementById('addressView').textContent = data.address;
    document.getElementById('cityView').textContent = data.city;
    document.getElementById('stateView').textContent = data.state;
    document.getElementById('postalView').textContent = data.postalCode;
    document.getElementById('countryView').textContent = data.country;
    document.getElementById('contactNameView').textContent = data.contactName;
    document.getElementById('contactPositionView').textContent = data.contactPosition;
    document.getElementById('contactEmailView').textContent = data.contactEmail;
    document.getElementById('contactPhoneView').textContent = data.contactPhone;
    document.getElementById('accountTypeDetailView').textContent = data.accountType;
    document.getElementById('customerSinceView').textContent = data.customerSince;
    document.getElementById('creditTermsView').textContent = data.creditTerms;
    document.getElementById('creditLimitView').textContent = data.creditLimit;
    
    // Set the logo
    document.getElementById('companyLogoView').src = data.logoUrl;
    
    // Edit form elements
    document.getElementById('companyName').value = data.companyName;
    document.getElementById('email').value = data.email;
    document.getElementById('phone').value = data.phone;
    document.getElementById('address').value = data.address;
    document.getElementById('city').value = data.city;
    document.getElementById('state').value = data.state;
    document.getElementById('postal').value = data.postalCode;
    document.getElementById('country').value = data.country;
    document.getElementById('contactName').value = data.contactName;
    document.getElementById('contactPosition').value = data.contactPosition;
    document.getElementById('contactEmail').value = data.contactEmail;
    document.getElementById('contactPhone').value = data.contactPhone;
    document.getElementById('logoUrl').value = data.logoUrl;
    
    // Preferences form
    document.getElementById('notificationEmail').value = data.email;
    document.getElementById('orderNotifications').checked = true;
    document.getElementById('defaultPaymentMethod').value = 'creditCard';
  }

  // Set up event listeners
  function setupEventListeners() {
    // Edit profile button
    document.getElementById('editProfileBtn').addEventListener('click', function() {
      document.getElementById('viewProfileSection').style.display = 'none';
      document.getElementById('editProfileSection').style.display = 'block';
    });
    
    // Cancel edit button
    document.getElementById('cancelEditBtn').addEventListener('click', function() {
      document.getElementById('editProfileSection').style.display = 'none';
      document.getElementById('viewProfileSection').style.display = 'block';
    });
    
    // Profile form submission
    document.getElementById('profileForm').addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Gather form data
      const formData = {
        companyName: document.getElementById('companyName').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        address: document.getElementById('address').value,
        city: document.getElementById('city').value,
        state: document.getElementById('state').value,
        postalCode: document.getElementById('postal').value,
        country: document.getElementById('country').value,
        contactName: document.getElementById('contactName').value,
        contactPosition: document.getElementById('contactPosition').value,
        contactEmail: document.getElementById('contactEmail').value,
        contactPhone: document.getElementById('contactPhone').value,
        logoUrl: document.getElementById('logoUrl').value,
        // Keep the other values from mock data
        customerId: mockCustomerData.customerId,
        accountType: mockCustomerData.accountType,
        customerSince: mockCustomerData.customerSince,
        creditTerms: mockCustomerData.creditTerms,
        creditLimit: mockCustomerData.creditLimit
      };
      
      // Save the profile data to Firestore in the "profiles" collection
      firebase.firestore().collection('profiles')
        .doc(mockAuthUser.uid)
        .set(formData, { merge: true })
        .then(() => {
          document.getElementById('successMessage').textContent = 'Your profile has been updated successfully.';
          document.getElementById('successModal').style.display = 'block';
          
          // Update the view with new values
          populateProfileData(formData);
          
          // Hide edit form and show view
          document.getElementById('editProfileSection').style.display = 'none';
          document.getElementById('viewProfileSection').style.display = 'block';
        })
        .catch((error) => {
          document.getElementById('errorMessage').textContent = 'There was an error updating your profile: ' + error.message;
          document.getElementById('errorModal').style.display = 'block';
        });
    });
    
    // Preferences form submission
    document.getElementById('preferencesForm').addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Normally, you would save preferences to Firestore here.
      // For testing, we'll just show success.
      document.getElementById('successMessage').textContent = 'Your preferences have been saved successfully.';
      document.getElementById('successModal').style.display = 'block';
    });
    
    // Modal close buttons
    document.getElementById('closeSuccessModal').addEventListener('click', function() {
      document.getElementById('successModal').style.display = 'none';
    });
    
    document.getElementById('confirmSuccessBtn').addEventListener('click', function() {
      document.getElementById('successModal').style.display = 'none';
    });
    
    document.getElementById('closeErrorModal').addEventListener('click', function() {
      document.getElementById('errorModal').style.display = 'none';
    });
    
    document.getElementById('confirmErrorBtn').addEventListener('click', function() {
      document.getElementById('errorModal').style.display = 'none';
    });
  }

  // Initialize the page
  function init() {
    console.log("Profile page initialized in test mode");
    populateProfileData(mockCustomerData);
    setupEventListeners();
  }

  // Start the page
  init();
});
