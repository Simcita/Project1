# Automating Weekly Order JSON Generation for VAPI Voice Agent

## Overview
This guide provides a step-by-step approach to extracting weekly orders from Firebase Firestore, generating a JSON file, and making it accessible to a VAPI voice agent.

## Prerequisites
- Firebase Admin SDK
- Node.js
- Firebase project with Firestore database
- Web hosting or cloud storage service

## Step 1: Firestore Order Extraction Script

### Code Implementation
```javascript
const admin = require('firebase-admin');
const fs = require('fs');

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Function to retrieve weekly orders
const getWeeklyOrders = async () => {
    // Calculate start of the week (past 7 days)
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - 7);

    try {
        const snapshot = await db.collection('orders')
            .where('orderDate', '>=', startOfWeek)
            .get();

        const orders = [];
        snapshot.forEach(doc => {
            orders.push({ 
                id: doc.id, 
                ...doc.data(),
                extractedAt: new Date().toISOString()
            });
        });

        return orders;
    } catch (error) {
        console.error('Error retrieving weekly orders:', error);
        return [];
    }
};

// Function to create JSON file
const createWeeklyOrdersJson = async () => {
    const orders = await getWeeklyOrders();
    
    if (orders.length > 0) {
        const jsonContent = JSON.stringify(orders, null, 2);
        
        try {
            fs.writeFileSync('weekly_orders.json', jsonContent);
            console.log("Successfully created 'weekly_orders.json'");
            return true;
        } catch (writeError) {
            console.error('Error writing JSON file:', writeError);
            return false;
        }
    } else {
        console.log('No orders found for the week');
        return false;
    }
};

// Export functions for potential modular use
module.exports = {
    getWeeklyOrders,
    createWeeklyOrdersJson
};
```

## Step 2: Automation Options

### Cron Job (Linux/macOS)
```bash
# Run every Sunday at midnight
0 0 * * 0 /usr/bin/node /path/to/your/script.js
```

### Windows Task Scheduler
1. Open Task Scheduler
2. Create a new task
3. Set trigger to weekly on Sunday
4. Set action to run Node.js script

## Step 3: Hosting JSON File

### Hosting Options
1. **Firebase Hosting**
   - Easy integration with Firebase ecosystem
   - Simple static file hosting

2. **AWS S3**
   ```javascript
   const AWS = require('aws-sdk');
   const s3 = new AWS.S3();

   const uploadToS3 = async (file) => {
     const params = {
       Bucket: 'your-bucket-name',
       Key: 'weekly_orders.json',
       Body: fs.readFileSync(file),
       ContentType: 'application/json'
     };

     try {
       await s3.upload(params).promise();
       console.log('File uploaded successfully');
     } catch (error) {
       console.error('S3 upload error:', error);
     }
   };
   ```

3. **Google Cloud Storage**
   ```javascript
   const {Storage} = require('@google-cloud/storage');
   const storage = new Storage();

   const uploadToGCS = async (file) => {
     try {
       await storage
         .bucket('your-bucket-name')
         .upload(file, {
           destination: 'weekly_orders.json'
         });
       console.log('File uploaded successfully');
     } catch (error) {
       console.error('GCS upload error:', error);
     }
   };
   ```

## Step 4: VAPI Configuration

### JSON Access Configuration
1. Ensure the JSON file URL is publicly accessible
2. Configure VAPI to fetch from the specific URL
3. Implement error handling for network requests

## Security Considerations
- Use environment variables for sensitive credentials
- Implement proper access controls
- Use HTTPS for all file transfers
- Regularly rotate access tokens

## Potential Enhancements
- Add logging and monitoring
- Implement retry mechanisms
- Create backup and archival strategies
- Add email/slack notifications for process status

## Troubleshooting
- Check Firebase Admin SDK initialization
- Verify Firestore database rules
- Ensure network connectivity
- Validate JSON generation permissions

## Conclusion
This approach provides a robust method for generating weekly order JSONs and making them accessible to your VAPI voice agent.
```

## Recommended Next Steps
1. Set up Firebase project credentials
2. Install required Node.js dependencies
3. Configure hosting solution
4. Test the script locally
5. Set up automation scheduler

Would you like me to elaborate on any specific part of the implementation or discuss potential customizations for your specific use case?