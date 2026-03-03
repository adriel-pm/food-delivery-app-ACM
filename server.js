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
        status: "preparing", //
        time: new Date()
    };
    
    orders.push(newOrder);
    res.status(201).json(newOrder);
});

app.listen(3000, () => console.log("Food Delivery App is ALIVE on port 3000!"));