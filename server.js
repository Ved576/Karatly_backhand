require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


const instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});



app.post('/create-order', async (req, res) => {
    try {
        const { totalCost} = req.body;

        const options = {
            amount: Math.round(totalCost * 100),
            currency: 'INR',
            receipt: `receipt_order_${new Date().getTime()}`,
        };

        const order = await instance.order.create(options);


        if (!order) {
            return res.status(500).send('Error creating oder with Razorpay');
        }

        res.json({orderId: order.id});
    }

    catch (error) {
        console.error('Error creating order:', error);
        res.status(500).send('An internal server error ocurred');
    }
});


app.post('/verify-payment', (req, res) => {

    const {order_id, payment_id, razorpay_signature} = req.body;

    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    const generated_signature = crypto
    .createHmac('sha256', key_secret)
    .update(order_id + '/' + paymnet_id)
    .digest('hex');

    if(generated_signature === razorpay_signature) {
        console.log('Payment verification successful for oder: ${order_id}');

        res.status(200).json({message: 'Payment verified successfully'});
    }
    else {
        console.error('Payment verification failed for order: ${order_id}');

        res.status(400).json({message: 'Payment verifiaction failed'});
    }
});

app.listen(PORT, () => {
    console.log('Server is live and listening on port ${PORT}');
});