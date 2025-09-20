require('dotenv').config();

const express = require('express');
const cors = require('cors');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ✅ Fixed: Correct Razorpay initialization
const instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ✅ Fixed: Complete create-order endpoint
app.post('/create-order', async (req, res) => {
  try {
    const { totalCost } = req.body;

    if (!totalCost || totalCost <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid total cost' 
      });
    }

    const options = {
      amount: Math.round(totalCost * 100), // Amount in paise
      currency: 'INR',
      receipt: `receipt_order_${new Date().getTime()}`,
    };

    // ✅ Fixed: Correct API call (orders.create not order.create)
    const order = await instance.orders.create(options);

    if (!order) {
      return res.status(500).json({ 
        success: false, 
        message: 'Error creating order with Razorpay' 
      });
    }

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: process.env.RAZORPAY_KEY_ID,
    });

  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ 
      success: false, 
      message: 'An internal server error occurred',
      error: error.message 
    });
  }
});

// ✅ Fixed: Complete verify-payment endpoint
app.post('/verify-payment', (req, res) => {
  try {
    const { order_id, payment_id, razorpay_signature } = req.body;

    if (!order_id || !payment_id || !razorpay_signature) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required parameters' 
      });
    }

    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    // ✅ Fixed: Correct signature generation (| not /)
    const generated_signature = crypto
      .createHmac('sha256', key_secret)
      .update(order_id + '|' + payment_id)
      .digest('hex');

    if (generated_signature === razorpay_signature) {
      console.log(`Payment verification successful for order: ${order_id}`);
      res.status(200).json({ 
        success: true, 
        message: 'Payment verified successfully' 
      });
    } else {
      console.error(`Payment verification failed for order: ${order_id}`);
      res.status(400).json({ 
        success: false, 
        message: 'Payment verification failed' 
      });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during verification' 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is live and listening on port ${PORT}`);
});
