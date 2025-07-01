<h1 align="center">🛒 SURAKSHIT STORE - AI-Powered E-Commerce Platform</h1>

<p align="center">
  <img src="https://img.shields.io/badge/TechStack-MERN-blueviolet?style=flat-square">
  <img src="https://img.shields.io/badge/AI-Product%20Recommendations-orange?style=flat-square">
  <img src="https://img.shields.io/badge/Deployment-Cloud%20Ready-green?style=flat-square">
</p>

<p align="center">
  A full-stack E-Commerce platform with <strong>React</strong> Frontend, <strong>Node.js/Express</strong> Backend, <strong>MongoDB Atlas</strong> Database, and integrated <strong>AI-driven product suggestions</strong>.
</p>

<hr>

<h2>🚀 Features</h2>
<ul>
  <li>🔐 User Authentication with Auth0</li>
  <li>📦 Product Listings from MongoDB & DummyJSON API</li>
  <li>💡 AI-powered Smart Recommendations</li>
  <li>🔍 Live Search Bar with Suggestions (Amazon-like)</li>
  <li>🛒 Shopping Cart Functionality</li>
  <li>➕ Admin Product Add/Delete Panel</li>
  <li>🎨 Responsive, modern UI built with React</li>
</ul>

<h2>🛠️ Tech Stack</h2>
<ul>
  <li><strong>Frontend:</strong> React, CSS, Auth0</li>
  <li><strong>Backend:</strong> Node.js, Express, Axios</li>
  <li><strong>Database:</strong> MongoDB Atlas (Cloud)</li>
  <li><strong>AI/ML:</strong> Product Recommendation Logic (Extendable for advanced models)</li>
</ul>

<h2>📁 Project Structure</h2>

<pre>
ecommerce-ai/
├── frontend/        # React Frontend
│   ├── public/
│   ├── src/
│   ├── .env
│   └── package.json
├── backend/         # Node.js Express Backend
│   ├── server.js
│   ├── .env
│   └── package.json
├── ml-backend/      # ML Model Backend
│   └── model.py
├── .gitignore
└── README.html
</pre>

<h2>⚙️ Setup Instructions</h2>

<h3>📦 Backend Setup</h3>
<pre>
cd backend
npm install
node server.js
</pre>

<h3>🌐 Frontend Setup</h3>
<pre>
cd frontend
npm install
npm start
</pre>

<p><strong>Ensure:</strong> MongoDB Atlas connection string & Auth0 credentials are stored in <code>.env</code> files (never commit them to GitHub).</p>

<h2>🧠 AI Product Recommendations</h2>
<p>
Simple recommendation logic implemented based on purchase history. Easily extendable with ML models in the <code>ml-backend</code> folder.
</p>

<h2>💡 Author</h2>
<p>Developed with ❤️ by <strong>Suman Choudhury</strong></p>

<h2>🔗 Useful Links</h2>
<ul>
  <li><a href="https://github.com/1810suman/E-Commerce-Website" target="_blank">GitHub Repository</a></li>
  <li><a href="https://dummyjson.com" target="_blank">DummyJSON API for sample products</a></li>
  <li><a href="https://auth0.com" target="_blank">Auth0 for authentication</a></li>
</ul>

