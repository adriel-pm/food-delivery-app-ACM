const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

// ─── Secrets ──────────────────────────────────────────────────────────────────
const projectId   = defineSecret('APP_PROJECT_ID');
const clientEmail = defineSecret('APP_CLIENT_EMAIL');
const privateKey  = defineSecret('APP_PRIVATE_KEY');

// ─── Lazy Admin Init ──────────────────────────────────────────────────────────
let db;
function getDb() {
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId:   projectId.value(),
                clientEmail: clientEmail.value(),
                privateKey:  privateKey.value().replace(/\\n/g, '\n')
            })
        });
    }
    db = db || admin.firestore();
    return db;
}

// ─── Middleware: Verify Firebase ID Token ─────────────────────────────────────
async function verifyToken(req, res) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ message: 'Unauthorized: No token provided' });
        return null;
    }
    try {
        return await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1]);
    } catch {
        res.status(401).json({ message: 'Unauthorized: Invalid token' });
        return null;
    }
}

// ─── 1. Register ──────────────────────────────────────────────────────────────
exports.register = onRequest(
    { secrets: [projectId, clientEmail, privateKey] },
    (req, res) => cors(req, res, async () => {
        if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

        const user = await verifyToken(req, res);
        if (!user) return;

        const { username, role } = req.body;
        if (!username || !role) {
            return res.status(400).json({ message: 'Username and role are required.' });
        }

        const firestore = getDb();
        const existing = await firestore.collection('users').where('username', '==', username).get();
        if (!existing.empty) {
            return res.status(409).json({ message: 'Username already taken.' });
        }

        try {
            await firestore.collection('users').doc(user.uid).set({
                uid: user.uid,
                username,
                role,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
            res.status(201).json({ message: 'Account profile created!', role });
        } catch (err) {
            res.status(500).json({ message: 'Failed to save user profile.', error: err.message });
        }
    })
);

// ─── 2. Menu ──────────────────────────────────────────────────────────────────
exports.menu = onRequest(
    { secrets: [projectId, clientEmail, privateKey] },
    (req, res) => cors(req, res, async () => {
        if (req.method !== 'GET') return res.status(405).send('Method Not Allowed');

        const user = await verifyToken(req, res);
        if (!user) return;

        try {
            const firestore = getDb();
            const snapshot = await firestore.collection('menu').orderBy('name').get();
            if (snapshot.empty) {
                return res.json([
                    { id: '1', name: 'Cheeseburger', price: 12 },
                    { id: '2', name: 'Pepperoni Pizza', price: 15 },
                    { id: '3', name: 'Spicy Wings', price: 10 }
                ]);
            }
            res.json(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (err) {
            res.status(500).json({ message: 'Failed to load menu.', error: err.message });
        }
    })
);

// ─── 3. Place Order ───────────────────────────────────────────────────────────
exports.placeOrder = onRequest(
    { secrets: [projectId, clientEmail, privateKey] },
    (req, res) => cors(req, res, async () => {
        if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

        const user = await verifyToken(req, res);
        if (!user) return;

        const { itemId } = req.body;
        if (!itemId) return res.status(400).json({ message: 'itemId is required.' });

        try {
            const firestore = getDb();
            const orderRef = await firestore.collection('orders').add({
                uid: user.uid,
                itemId,
                status: 'Preparing',
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });

            const time = () => Math.floor(Math.random() * 4000) + 4000;
            setTimeout(async () => {
                await orderRef.update({ status: 'Ready' });
                setTimeout(async () => {
                    await orderRef.update({ status: 'Picked up' });
                    setTimeout(async () => {
                        await orderRef.update({ status: 'Delivered' });
                    }, time());
                }, time());
            }, time());

            res.status(201).json({ message: 'Order Placed!', orderId: orderRef.id });
        } catch (err) {
            res.status(500).json({ message: 'Failed to place order.', error: err.message });
        }
    })
);

// ─── 4. Get Order Status ──────────────────────────────────────────────────────
exports.getOrder = onRequest(
    { secrets: [projectId, clientEmail, privateKey] },
    (req, res) => cors(req, res, async () => {
        if (req.method !== 'GET') return res.status(405).send('Method Not Allowed');

        const user = await verifyToken(req, res);
        if (!user) return;

        const orderId = req.query.id;
        if (!orderId) return res.status(400).json({ message: 'Order ID is required.' });

        try {
            const firestore = getDb();
            const doc = await firestore.collection('orders').doc(orderId).get();
            if (!doc.exists) return res.status(404).json({ message: 'Order not found.' });
            if (doc.data().uid !== user.uid) return res.status(403).json({ message: 'Forbidden.' });
            res.json({ orderId: doc.id, ...doc.data() });
        } catch (err) {
            res.status(500).json({ message: 'Failed to fetch order.', error: err.message });
        }
    })
);