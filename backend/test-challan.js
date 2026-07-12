const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/v1';

const testCredentials = {
  email: 'admin@steeltrack.com',
  password: 'Admin123'
};

async function testDeliveryChallanFlow() {
  try {
    console.log('🔐 Logging in...');
    
    // Login to get token
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, testCredentials);
    const token = loginResponse.data.data.accessToken;
    
    console.log('✅ Login successful');
    
    // Get orders to create challan for
    console.log('📋 Fetching orders...');
    const ordersResponse = await axios.get(`${BASE_URL}/orders?status=confirmed&limit=1`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const orders = ordersResponse.data.data;
    if (orders.length === 0) {
      console.log('❌ No confirmed orders found. Creating sample order...');
      
      // Get first customer and admin user for sample order
      const customersResponse = await axios.get(`${BASE_URL}/customers?limit=1`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const inventoryResponse = await axios.get(`${BASE_URL}/inventory?limit=1`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (customersResponse.data.data.length === 0 || inventoryResponse.data.data.length === 0) {
        console.log('❌ Need customers and inventory to create test order');
        return;
      }
      
      const customer = customersResponse.data.data[0];
      const item = inventoryResponse.data.data[0];
      
      // Create sample order
      const orderData = {
        customerId: customer.id,
        items: [{
          inventoryId: item.id,
          name: item.name,
          quantity: 10,
          unitPrice: parseFloat(item.sellingPrice),
          totalPrice: 10 * parseFloat(item.sellingPrice)
        }],
        subtotal: 10 * parseFloat(item.sellingPrice),
        taxableAmount: 10 * parseFloat(item.sellingPrice),
        cgst: (10 * parseFloat(item.sellingPrice)) * 0.09,
        sgst: (10 * parseFloat(item.sellingPrice)) * 0.09,
        totalTax: (10 * parseFloat(item.sellingPrice)) * 0.18,
        grandTotal: (10 * parseFloat(item.sellingPrice)) * 1.18,
        status: 'confirmed'
      };
      
      const orderResponse = await axios.post(`${BASE_URL}/orders`, orderData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (orderResponse.data.success) {
        orders.push(orderResponse.data.data);
        console.log(`✅ Created sample order: ${orderResponse.data.data.orderNumber}`);
      }
    }
    
    const order = orders[0];
    console.log(`✅ Using order: ${order.orderNumber}`);
    
    // Create delivery challan
    console.log('🚚 Creating delivery challan...');
    const challanData = {
      orderId: order.id,
      vehicleNumber: 'GJ01AB1234',
      driverName: 'Ramesh Kumar',
      driverPhone: '9876543210',
      transporterName: 'Gujarat Transport Co.',
      eWayBillNo: '123456789012',
      dispatchDate: new Date().toISOString(),
      notes: 'Handle with care - fragile items'
    };
    
    const challanResponse = await axios.post(`${BASE_URL}/delivery-challans`, challanData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (challanResponse.data.success) {
      const challan = challanResponse.data.data;
      console.log(`✅ Created delivery challan: ${challan.challanNumber}`);
      
      // Test fetching challan details
      console.log('📄 Fetching challan details...');
      const detailResponse = await axios.get(`${BASE_URL}/delivery-challans/${challan.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (detailResponse.data.success) {
        console.log('✅ Fetched challan details successfully');
        console.log(`📊 Challan Status: ${detailResponse.data.data.status}`);
        console.log(`🚛 Vehicle: ${detailResponse.data.data.vehicleNumber}`);
        console.log(`👨‍💼 Driver: ${detailResponse.data.data.driverName}`);
        console.log(`💰 Subtotal: ₹${parseFloat(detailResponse.data.data.subtotal).toLocaleString('en-IN')}`);
      }
      
      // Test marking as delivered
      console.log('📦 Marking challan as delivered...');
      const deliveryResponse = await axios.post(`${BASE_URL}/delivery-challans/${challan.id}/mark-delivered`, {
        receivedBy: 'John Smith',
        receivedDate: new Date().toISOString(),
        customerSignature: 'Received in good condition'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (deliveryResponse.data.success) {
        console.log('✅ Marked challan as delivered successfully');
      }
      
      // Test listing challans
      console.log('📋 Testing challan listing...');
      const listResponse = await axios.get(`${BASE_URL}/delivery-challans?limit=5`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (listResponse.data.success) {
        console.log(`✅ Listed ${listResponse.data.data.length} challans`);
        console.log(`📊 Total challans: ${listResponse.data.pagination.total}`);
      }
    }
    
    console.log('\n🎉 Delivery Challan API testing completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Message: ${error.response.data.message || error.response.statusText}`);
      console.error('Details:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
  }
}

testDeliveryChallanFlow();