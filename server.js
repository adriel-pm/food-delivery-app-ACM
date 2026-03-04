const express = require('express');
const app = express();
app.use(express.json());
app.use(express.static('public')); // Serves your HTML file

let users = [];
let orders = [];

// 1. Authentication (Register & Login)
app.post('/register', (req, res) => {
    const { email, password, role } = req.body;
    users.push({ email, password, role });
    res.status(201).json({ message: "Account Created!", role });
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);
    if (user) res.json({ message: "Login Successful!", role: user.role });
    else res.status(401).json({ message: "Invalid credentials" });
});

// 2. Menu Retrieval
app.get('/menu', (req, res) => {
    res.json([
        { id: 1, name: "Cheeseburger", price: 12 },
        { id: 2, name: "Pepperoni Pizza", price: 15 },
        { id: 3, name: "Spicy Wings", price: 10 }
    ]);
});

// 3. Automated Ordering Sequence
app.post('/order', (req, res) => {
    const { itemId } = req.body;
    const orderId = Math.floor(Math.random() * 10000);
    const newOrder = { orderId, itemId, status: "Preparing" };
    orders.push(newOrder);

    // Automation: Random timers between 4 to 8 seconds per stage for a better demo feel
    const time = () => Math.floor(Math.random() * 4000) + 4000;
    setTimeout(() => { 
        newOrder.status = "Ready"; 
        setTimeout(() => { 
            newOrder.status = "Picked up"; 
            setTimeout(() => { newOrder.status = "Delivered"; }, time());
        }, time());
    }, time());

    res.status(201).json({ message: "Order Placed!", orderId });
});

// 4. Live Tracking Endpoint
app.get('/order/:id', (req, res) => {
    const order = orders.find(o => o.orderId === parseInt(req.params.id));
    order ? res.json(order) : res.status(404).json({ message: "Not found" });
});

app.listen(3000, () => console.log("Food Delivery App on Port 3000"));