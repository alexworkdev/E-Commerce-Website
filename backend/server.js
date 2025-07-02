require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
const axios = require('axios');

const app = express();
app.use(cors({
  origin: [
    'https://e-commerce-website-7e16rchmp-suman-choudhurys-projects.vercel.app/',
    'http://localhost:3000'  // for local development
  ]}));

app.use(express.json());

// MongoDB Setup
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);
let productsCollection;

async function connectDB() {
  try {
    await client.connect();
    const db = client.db('EcommerceDB');
    productsCollection = db.collection('products');
    console.log('✅ Connected to MongoDB Atlas');
  } catch (err) {
    console.error('MongoDB connection error:', err);
  }
}

connectDB();

// Health Check
app.get('/', (req, res) => {
  res.send("✅ API is Running (MongoDB + DummyJSON Products)");
});

// Fetch all products
app.get('/api/products', async (req, res) => {
  try {
    const category = req.query.category;
    const mongoFilter = category && category !== 'All' ? { category } : {};
    const mongoProducts = await productsCollection.find(mongoFilter).toArray();

    const formattedMongo = mongoProducts.map(p => ({
      id: p._id.toString(),
      name: p.name,
      price: p.price,
      image: p.image,
      description: p.description,
      category: p.category || "Others",
      isMongo: true
    }));

    const dummyRes = await axios.get('https://dummyjson.com/products?limit=100');
    let dummyProducts = dummyRes.data.products.map(p => ({
      id: (p.id + 1000).toString(),
      name: p.title,
      price: p.price,
      image: p.thumbnail,
      description: p.description,
      category: p.category || "Others",
      isMongo: false
    }));

    if (category && category !== 'All') {
      dummyProducts = dummyProducts.filter(p => p.category === category);
    }

    res.json([...formattedMongo, ...dummyProducts]);

  } catch (err) {
    console.error('Fetch products error:', err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// Get Unique Categories
app.get('/api/categories', async (req, res) => {
  try {
    const mongoCategories = await productsCollection.distinct("category");
    const dummyRes = await axios.get('https://dummyjson.com/products/categories');
    const dummyCategories = dummyRes.data;
    const combined = Array.from(new Set([...mongoCategories, ...dummyCategories])).filter(Boolean);
    res.json(combined);
  } catch (err) {
    console.error('Fetch categories error:', err);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// Add Product
app.post('/api/add-product', async (req, res) => {
  try {
    const { name, price, image, description, category } = req.body;
    if (!name || !price || !image || !description || !category) {
      return res.status(400).json({ error: "Missing product fields" });
    }
    const newProduct = { name, price: parseFloat(price), image, description, category };
    await productsCollection.insertOne(newProduct);
    res.json({ message: "Product added successfully", product: newProduct });
  } catch (err) {
    console.error('Add product error:', err);
    res.status(500).json({ error: "Failed to add product" });
  }
});

// Delete Product
app.delete('/api/delete-product/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await productsCollection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

// Recommend Products
app.post('/api/recommend', async (req, res) => {
  try {
    const history = req.body.history || [];
    const boughtIds = history.map(item => item.id.toString());

    const mongoProducts = await productsCollection.find({}).toArray();
    const filteredMongo = mongoProducts.filter(p => !boughtIds.includes(p._id.toString())).map(p => ({
      id: p._id.toString(),
      name: p.name,
      price: p.price,
      image: p.image,
      description: p.description,
      category: p.category || "Others",
      isMongo: true
    }));

    const dummyRes = await axios.get('https://dummyjson.com/products?limit=100');
    const filteredDummy = dummyRes.data.products.filter(p => !boughtIds.includes((p.id + 1000).toString())).map(p => ({
      id: (p.id + 1000).toString(),
      name: p.title,
      price: p.price,
      image: p.thumbnail,
      description: p.description,
      category: p.category || "Others",
      isMongo: false
    }));

    const recommendations = [...filteredMongo, ...filteredDummy].slice(0, 10);
    res.json(recommendations);

  } catch (err) {
    console.error('Recommendations error:', err);
    res.status(500).json({ error: "Failed to fetch recommendations" });
  }
});

// Start Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
