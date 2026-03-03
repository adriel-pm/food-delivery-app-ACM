const express = require('express');
const app = express();
app.use(express.json()); // This allows the app to read "JSON" messages

// --- THE DATA LAYER (Your Fake Database) ---
let orders = [];

// --- THE LOGIC LAYER (Core Functionalities) ---

// 1. Viewing Cars (In your case, viewing Menus)
app.get('/menu', (req, res) => {
    const menu = [
        { id: 1, name: "Cheeseburger", price: 10 },
        { id: 2, name: "Pepperoni Pizza", price: 15 }
    ];
    res.json(menu);
});

// 2. Booking (Placing an Order)
app.post('/order', (req, res) => {
    const { customerId, itemId } = req.body;
    
    // This generates a Unique Order ID
    const newOrder = {
        orderId: `ORDER-${Math.floor(Math.random() * 9999)}`,
        customerId: customerId,
        status: "preparing", //
        time: new Date()
    };
    
    orders.push(newOrder);
    res.status(201).json(newOrder);
});

app.listen(3000, () => console.log("Food Delivery App is ALIVE on port 3000!"));