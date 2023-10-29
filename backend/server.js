const express = require('express');
const { initializeApp } = require("firebase/app");
const { getFirestore, doc, collection, getDoc, getDocs, setDoc, updateDoc, addDoc, query, where } = require("firebase/firestore");
const { PurchasesByUser, PurchaseRecords } = require('./utils/customClasses');
const algoliasearch = require('algoliasearch');
require('dotenv').config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const cors = require('cors');

const ALGOLIA_INDEX_NAME = 'products';
const client = algoliasearch(process.env.ALGOLIA_ID, process.env.ALGOLIA_ADMIN_KEY);
const index = client.initIndex(ALGOLIA_INDEX_NAME);


const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: "onlinestore-2.firebaseapp.com",
    projectId: "onlinestore-2",
    storageBucket: "onlinestore-2.appspot.com",
    messagingSenderId: "741302016722",
    appId: "1:741302016722:web:5a23b4f35c3cff76c62b0b",
    measurementId: "G-W6DG7SC029"
};

const appFB = initializeApp(firebaseConfig);
const db = getFirestore(appFB);


const app = express();
const port = process.env.PORT || 3001;

// app.use(cors({ origin: `${process.env.PUBLIC_IP}:80` }));
app.use(cors({ origin: "*" }));



app.use(express.json());


app.get('/api/userData', async (req, res) => {
    const { action, col, document } = req.query;
    try {
        if (action === 'getuser') {
            const docRef = doc(db, col, document);
            const docSnap = await getDoc(docRef);
            const userData = docSnap.data();
            res.status(200).json(userData);
        }
        if (action === 'getpurchases') {
            const allData = await getDocs(collection(db, 'store'));
            const purchasesRef = collection(db, col);
            const q = query(purchasesRef, where('userID', '==', document));
            const querySnapshot = await getDocs(q);
            const records = new PurchasesByUser(querySnapshot);
            const showableRecords = await records.getProdsFromPurchaseRecords(allData, getDocs, query, collection, db, where);
            res.status(200).json(showableRecords);
        }
    } catch (error) {
        console.log(error.message)
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/userData', async (req, res) => {
    const userData = req.body;
    try {
        if (userData.action === "register") {
            await setDoc(doc(db, "userdata", userData.uid), userData.newUserData);
            res.status(200).json('success');
        }
        if (userData.action === "savePurchase") {
            const savablePurchase = new PurchaseRecords(userData);
            await savablePurchase.addPurchaseRecords(addDoc, collection, db);
            res.status(200).json('success');
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.patch('/api/userData', async (req, res) => {
    const newData = req.body;
    try {
        if (newData.field === 'First name') {
            const userRef = doc(db, "userdata", newData.uid);
            await updateDoc(userRef, {
                first: newData.newVal,
            });
        } else if (newData.field === 'Last name') {
            const userRef = doc(db, "userdata", newData.uid);
            await updateDoc(userRef, {
                last: newData.newVal,
            });
        } else if (newData.field === 'Gender') {
            const userRef = doc(db, "userdata", newData.uid);
            await updateDoc(userRef, {
                gender: newData.newVal,
            });
        } else if (newData.field === 'Date of birth') {
            const userRef = doc(db, "userdata", newData.uid);
            await updateDoc(userRef, {
                date: newData.newVal,
            });
        }
        res.status(200).json('success');
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////



app.get('/api/products', async (req, res) => {
    const { action } = req.query;
    if (action === 'homepage') {
        try {
            const allData = await getDocs(collection(db, 'store'));
            const bests = [];
            const promises = allData.docs.map(async (document) => {
                const bestSellers = await getDocs(query(collection(db, 'store', document.id, 'searchProductDetails'), where('productRating', '==', '5.0 out of 5 stars')));
                const bestSellerPromises = bestSellers.docs.map(async (best) => {
                    const bestData = await best.data();
                    bests.push(bestData);
                });
                await Promise.all(bestSellerPromises);
            });
            await Promise.all(promises);
            res.status(200).json(bests);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    if (action === 'categorypage') {
        const { category } = req.query;
        const prods = [];
        try {
            if (category === 'men' || category === 'women') {
                const searchParams = {
                    hitsPerPage: 50,
                    attributesToRetrieve: [
                        'asin',
                        'deliveryMessage',
                        'imgUrl',
                        'price',
                        'productDescription',
                    ],
                };
                const prodsByCat = await index.search(category, searchParams)
                    .then(({ hits }) => hits)
                    .catch((error) => {
                        console.error('Error:', error);
                    });
                res.status(200).json(prodsByCat);
            } else {
                const docData = await getDocs(collection(db, 'store', category, 'searchProductDetails'));
                const prodsPromises = docData.docs.map(async (item) => {
                    const prodData = await item.data();
                    prods.push(prodData);
                });
                await Promise.all(prodsPromises);
                res.status(200).json(prods);
            }
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    if (action === 'keywordsearch') {
        const { kw } = req.query;
        const searchParams = {
            hitsPerPage: 50,
            attributesToRetrieve: [
                'asin',
                'deliveryMessage',
                'imgUrl',
                'price',
                'productDescription',
            ],
        };
        try {
            const prodsByKw = await index.search(kw, searchParams)
                .then(({ hits }) => hits)
                .catch((error) => {
                    console.error('Error:', error);
                });
            res.status(200).json(prodsByKw);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
})


///////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////



const calculateOrderAmount = (items) => {
    // Replace this constant with a calculation of the order's amount
    // Calculate the order total on the server to prevent
    // people from directly manipulating the amount on the client
    return 1400;
};

app.post('/api/create-payment-intent', async (req, res) => {
    const { items } = await req.body;

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
        amount: calculateOrderAmount(items),
        currency: "eur",
        // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
        automatic_payment_methods: {
            enabled: true,
        },
    });
    res.status(200).json({
        clientSecret: paymentIntent.client_secret,
    })
})

app.listen(port, () => {
    console.log(`API server is running on port ${port}`);
});