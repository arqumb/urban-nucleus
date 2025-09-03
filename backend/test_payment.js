const axios = require('axios');

async function testPaymentEndpoint() {
    try {
        console.log('🧪 Testing payment endpoint...');
        
        const response = await axios.post('http://31.97.239.99/payment/create-order', {
            amount: 3500,
            currency: 'INR',
            receipt: 'test_receipt_123'
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Payment endpoint test successful!');
        console.log('Response:', JSON.stringify(response.data, null, 2));
        
        if (response.data.demo_mode) {
            console.log('🎭 Demo mode is working correctly!');
        }
        
    } catch (error) {
        console.error('❌ Payment endpoint test failed:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

testPaymentEndpoint();
