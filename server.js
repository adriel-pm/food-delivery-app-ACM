const express = require('express');
const app = express();
app.use(express.json()); // This allows the app to read "JSON" messages
app.use(express.static('public'));

// --- THE DATA LAYER (Fake Database) ---
let orders = [];
let users = [];

// 1. Registration (Functional Requirement) 
app.post('/register', (req, res) => {
    const { email, password, role } = req.body; // roles: 'customer' or 'driver'
    const newUser = { id: users.length + 1, email, password, role };
    
    users.push(newUser);
    res.status(201).json({ message: "User Registered!", userId: newUser.id });
});

// 2. Login (Functional Requirement) 
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        res.json({ message: "Login Successful!", role: user.role });
    } else {
        res.status(401).send("Invalid email or password.");
    }
});

// --- THE LOGIC LAYER (Core Functionalities) ---

// 1. Viewing Menu
app.get('/menu', (req, res) => {
    const menu = [
        { id: 1, name: "Cheeseburger", price: 10 },
        { id: 2, name: "Pepperoni Pizza", price: 15 }
    ];
    res.json(menu);
});

// 2. Placing an Order
app.post('/order', (req, res) => {
    const { customerId, itemId } = req.body;
    
    // This generates a Unique Order ID
    const newOrder = {
        orderId: `ORDER-${Math.floor(Math.random() * 9999)}`,
        customerId: customerId,
        status: "Preparing", //
        time: new Date()
    };
    
    orders.push(newOrder);
    res.status(201).json(newOrder);
});

// 3. Update Order Status (Tracking Logic)
app.patch('/order/:id/status', (req, res) => {
    const { status } = req.body; // e.g., "ready", "picked up", or "delivered"
    const order = orders.find(o => o.orderId === req.params.id);
    
    if (order) {
        order.status = status;
        res.json({ message: `Order updated to ${status}`, order });
    } else {
        res.status(404).send("Order ID not found.");
    }
});

// 4. Order lifecycle
app.post('/order', (req, res) => {
    const { customerId, itemId } = req.body;
    const orderId = Math.floor(Math.random() * 10000);
    const newOrder = { orderId, customerId, itemId, status: "preparing" };
    orders.push(newOrder);

    // Helper to get a random time between 5s and 15s (in milliseconds)
    const randomTime = () => Math.floor(Math.random() * (15000 - 5000 + 1)) + 5000;

    // --- THE AUTOMATION SEQUENCE ---
    setTimeout(() => {
        newOrder.status = "ready";
        console.log(`Order ${orderId}: READY`);

        setTimeout(() => {
            newOrder.status = "picked up";
            console.log(`Order ${orderId}: PICKED UP`);

            setTimeout(() => {
                newOrder.status = "delivered";
                console.log(`Order ${orderId}: DELIVERED`);
            }, randomTime());
        }, randomTime());
    }, randomTime());

    res.status(201).json({ 
        message: "Order placed! It will advance through stages automatically.", 
        orderId: orderId 
    });
});

app.listen(3000, () => console.log("Food Delivery App is ALIVE on port 3000!"));