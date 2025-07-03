<h1 align="center">🛒 SURAKSHIT STORE - AI-Powered E-Commerce Platform</h1>

<p align="center">
  <img src="https://img.shields.io/badge/TechStack-MERN-blueviolet">
  <img src="https://img.shields.io/badge/AI-Product%20Recommendations-orange">
  <img src="https://img.shields.io/badge/Deployment-Cloud%20Ready-green">
</p>

<p align="center">
  A full-stack E-Commerce platform with <strong>React</strong> Frontend, <strong>Node.js/Express</strong> Backend, <strong>MongoDB Atlas</strong> Database, and integrated <strong>AI-driven product suggestions</strong>.
</p>

<hr>

<h2>🚀 Features</h2>
<ul>
  <li>🔐 User Authentication with Auth0</li>
  <li>📦 Product Listings from MongoDB & DummyJSON API</li>
  <li>💡 AI-powered Smart Recommendations (Category-based, Similar Products, Price Range, Popular Items)</li>
  <li>🔍 Live Search Bar with Suggestions (Amazon-like)</li>
  <li>🛒 Shopping Cart Functionality</li>
  <li>➕ Admin Product Add Panel</li>
  <li>🎨 Responsive, modern UI built with React</li>
</ul>

<h2>🛠️ Tech Stack</h2>
<ul>
  <li><strong>Frontend:</strong> React, CSS, Auth0</li>
  <li><strong>Backend:</strong> Node.js, Express, Axios</li>
  <li><strong>Database:</strong> MongoDB Atlas (Cloud)</li>
  <li><strong>AI/ML:</strong> Python Flask Recommendation System (Deployed on Render)</li>
</ul>

<h2>📂 Project Structure</h2>
<pre>
E-Commerce-Website/
├── Screenshots/
├── frontend/        # React Frontend (Vercel Deployed)
│   ├── public/
│   ├── src/
│   ├── package-lock.json
│   └── package.json
├── backend/         # Node.js Express Backend (Render Deployed)
│   ├── server.js
│   ├── package-lock.json
│   └── package.json
├── ml-backend/      # Python Flask ML Backend (Render Deployed)
│   ├── app.py
│   └── requirements.txt
├── .gitignore
└── README.md
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

<h3>🤖 ML Backend Setup (Python)</h3>
<pre>
cd ml-backend
pip install -r requirements.txt
python app.py
</pre>

<p><strong>Note:</strong> Store MongoDB Atlas URI, Auth0 credentials, and backend API links in respective <code>.env</code> files. Never commit sensitive keys to GitHub.</p>

<h2>🧠 AI Product Recommendations</h2>
<p>
  The recommendation system provides intelligent product suggestions based on:
</p>
<ul>
  <li>User Purchase History</li>
  <li>Category Preferences</li>
  <li>Similar Product Attributes</li>
  <li>Price Range Recommendations</li>
  <li>Trending Popular Items</li>
</ul>
<p>
Fully extendable to integrate advanced ML models using the Python-based <code>ml-backend</code>.
</p>

<h2>🌐 Live Project Links</h2>
<ul>
  <li><strong>E-Commerce Webapp:</strong> <a href="https://e-commerce-website-orcin-xi.vercel.app" target="_blank">https://e-commerce-website-orcin-xi.vercel.app</a></li>
  <li><strong>Demo Video:</strong> <a href="https://drive.google.com/file/d/1--Flz496hk7AUpJ4EkmsKchNNVBoa6xv/view?usp=sharing" target="_blank">Watch on Google Drive</a></li>
</ul>

<h2>🖥️ Frontend Demo</h2>
<p align="center">
  <img src="https://github.com/1810suman/E-Commerce-Website/blob/main/Screenshots/Home_page.png" alt="Surakshit Store Front Page" width="600">
</p>

<h2>💡 Author</h2>
<p>
  Developed with ❤️ by <strong>Suman Choudhury</strong>
</p>

<h2>🔗 Useful Links</h2>
<ul>
  <li><a href="https://github.com/1810suman/E-Commerce-Website" target="_blank">GitHub Repository</a></li>
  <li><a href="https://dummyjson.com" target="_blank">DummyJSON API for Sample Products</a></li>
  <li><a href="https://auth0.com" target="_blank">Auth0 for Secure Authentication</a></li>
</ul>
