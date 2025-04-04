// Test customer data for the supplier portal
export const testCustomers = [
    {
        customerId: "CUST-001",
        accountType: "Premium",
        companyName: "BCS AI Solutions",
        contactName: "ClayMen Collection",
        contactPosition: "Boss",
        contactEmail: "alex@bcsai.com",
        contactPhone: "(555) 987-6543",
        email: "contact@bcsai.com",
        phone: "(555) 123-4567",
        address: "123 Tech Boulevard",
        city: "Innovation City",
        state: "California",
        country: "South Africa",
        postalCode: "9201",
        creditLimit: "$25,000.00",
        creditTerms: "Net 30",
        customerSince: "January 15, 2023",
        logoUrl: "https://via.placeholder.com/150"
    },
    {
        customerId: "CUST-002",
        accountType: "Standard",
        companyName: "Tech Innovators Ltd",
        contactName: "John Smith",
        contactPosition: "CEO",
        contactEmail: "john@techinnovators.com",
        contactPhone: "(555) 876-5432",
        email: "info@techinnovators.com",
        phone: "(555) 234-5678",
        address: "456 Innovation Drive",
        city: "Tech City",
        state: "Gauteng",
        country: "South Africa",
        postalCode: "2000",
        creditLimit: "$15,000.00",
        creditTerms: "Net 15",
        customerSince: "February 1, 2023",
        logoUrl: "https://via.placeholder.com/150"
    },
    {
        customerId: "CUST-003",
        accountType: "Basic",
        companyName: "Digital Solutions Inc",
        contactName: "Sarah Johnson",
        contactPosition: "Manager",
        contactEmail: "sarah@digitalsolutions.com",
        contactPhone: "(555) 765-4321",
        email: "support@digitalsolutions.com",
        phone: "(555) 345-6789",
        address: "789 Digital Street",
        city: "Digital City",
        state: "Western Cape",
        country: "South Africa",
        postalCode: "8001",
        creditLimit: "$10,000.00",
        creditTerms: "Net 7",
        customerSince: "March 15, 2023",
        logoUrl: "https://via.placeholder.com/150"
    }
];

// Function to get all test customers
export function getAllTestCustomers() {
    return testCustomers;
}

// Function to get a specific customer by ID
export function getTestCustomerById(customerId) {
    return testCustomers.find(customer => customer.customerId === customerId);
}

// Function to get customers by account type
export function getTestCustomersByAccountType(accountType) {
    return testCustomers.filter(customer => customer.accountType === accountType);
}

// Function to get customers by status
export function getTestCustomersByStatus(status) {
    return testCustomers.filter(customer => customer.status === status);
}

// Function to get customers by credit limit range
export function getTestCustomersByCreditLimit(min, max) {
    return testCustomers.filter(customer => 
        customer.creditLimit >= min && customer.creditLimit <= max
    );
} 