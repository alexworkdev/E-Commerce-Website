from flask import Flask, request, jsonify
from flask_cors import CORS
import random
from collections import Counter, defaultdict
import math
import requests

app = Flask(__name__)

CORS(app, resources={r"/*": {"origins": [
    "https://e-commerce-website-orcin-xi.vercel.app",
    "http://localhost:3000"
]}}, supports_credentials=True)

# Configuration for Node.js backend
NODE_JS_BACKEND = "https://e-commerce-website-3-uo7o.onrender.com"

# Start with an empty product list
products = []

# Store user purchase history and interactions
user_purchases = defaultdict(list)  # user_id -> [product_ids]
product_views = defaultdict(int)    # product_id -> view_count
product_purchases = defaultdict(int)  # product_id -> purchase_count

def sync_products_from_nodejs():
    """Sync products from Node.js backend to ML system"""
    try:
        response = requests.get(f"{NODE_JS_BACKEND}/api/products")
        if response.status_code == 200:
            fetched_products = response.json()
            
            # Clear existing products and update with fresh data
            global products
            products = []
            
            for product in fetched_products:
                ml_product = {
                    "id": product.get("id"),
                    "name": product.get("name"),
                    "price": float(product.get("price", 0)),
                    "image": product.get("image"),
                    "description": product.get("description", ""),
                    "category": product.get("category", "Others"),
                    "rating": round(random.uniform(3.5, 5.0), 1),
                    "reviews": random.randint(10, 500),
                    "tags": extract_tags(product.get("name", ""), product.get("description", ""))
                }
                products.append(ml_product)
            
            print(f"✅ Synced {len(products)} products from Node.js backend")
            return True
        else:
            print(f"❌ Failed to sync products: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error syncing products: {str(e)}")
        return False

def extract_tags(name, description):
    """Extract relevant tags from product name and description"""
    text = (name + " " + description).lower()
    
    # Common product attributes to look for
    keywords = [
        'wireless', 'bluetooth', 'smart', 'premium', 'portable', 'waterproof',
        'leather', 'cotton', 'organic', 'eco-friendly', 'rechargeable',
        'lightweight', 'durable', 'comfortable', 'stylish', 'modern',
        'vintage', 'classic', 'professional', 'gaming', 'fitness'
    ]
    
    found_tags = [keyword for keyword in keywords if keyword in text]
    return found_tags[:5]  # Limit to 5 tags

# Initialize products when the app starts
@app.before_first_request
def initialize_products():
    sync_products_from_nodejs()

@app.route('/products', methods=['GET'])
def get_products():
    print("✅ [GET] /products called - Returning all products")
    return jsonify(products)

@app.route('/', methods=['GET'])
def home():
    return "✅ Enhanced Recommendation API is Running"

@app.route('/sync-products', methods=['POST'])
def manual_sync():
    """Manually trigger product synchronization"""
    success = sync_products_from_nodejs()
    if success:
        return jsonify({"message": f"Successfully synced {len(products)} products"})
    else:
        return jsonify({"error": "Failed to sync products"}), 500

@app.route('/delete-product/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    global products
    initial_count = len(products)
    products = [p for p in products if p['id'] != product_id]
    
    if len(products) == initial_count:
        print(f"⚠️ Product with ID {product_id} not found for deletion.")
        return jsonify({"error": "Product not found"}), 404
    
    print(f"🗑️ Product with ID {product_id} deleted.")
    return jsonify({"message": "Product deleted"})

@app.route('/add-product', methods=['POST'])
def add_product():
    data = request.get_json()
    required_fields = ("name", "price", "image", "description")
    
    if not all(k in data for k in required_fields):
        print("❌ Missing product fields in request.")
        return jsonify({"error": "Missing product fields"}), 400
    
    new_id = max((p["id"] for p in products), default=0) + 1
    new_product = {
        "id": new_id,
        "name": data["name"],
        "price": float(data["price"]),
        "image": data["image"],
        "description": data["description"],
        "category": data.get("category", "Others"),
        "rating": round(random.uniform(3.5, 5.0), 1),  # Simulate ratings
        "reviews": random.randint(10, 500),  # Simulate review count
        "tags": extract_tags(data["name"], data["description"])  # Extract keywords
    }
    products.append(new_product)
    
    print(f"✅ Product added: {new_product['name']} (ID: {new_id})")
    return jsonify({"message": "Product added", "product": new_product})

def calculate_similarity(product1, product2):
    """Calculate similarity between two products"""
    score = 0
    
    # Category match (highest weight)
    if product1['category'] == product2['category']:
        score += 0.4
    
    # Price similarity (within 50% range)
    price_ratio = min(product1['price'], product2['price']) / max(product1['price'], product2['price'])
    if price_ratio > 0.5:
        score += 0.3 * price_ratio
    
    # Tag similarity
    tags1 = set(product1.get('tags', []))
    tags2 = set(product2.get('tags', []))
    if tags1 and tags2:
        common_tags = len(tags1.intersection(tags2))
        union_tags = len(tags1.union(tags2))
        if union_tags > 0:
            score += 0.3 * (common_tags / union_tags)
    
    return score

def get_popular_products():
    """Get products sorted by popularity (views + purchases + rating)"""
    scored_products = []
    for product in products:
        popularity_score = (
            product_views.get(product['id'], 0) * 0.3 +
            product_purchases.get(product['id'], 0) * 0.5 +
            product.get('rating', 0) * product.get('reviews', 0) * 0.2
        )
        scored_products.append((product, popularity_score))
    
    return [p[0] for p in sorted(scored_products, key=lambda x: x[1], reverse=True)]

def get_category_recommendations(purchased_categories, exclude_ids):
    """Get recommendations based on purchased categories"""
    category_counts = Counter(purchased_categories)
    recommendations = []
    
    for category, count in category_counts.most_common():
        category_products = [
            p for p in products 
            if p['category'] == category and p['id'] not in exclude_ids
        ]
        # Sort by rating and reviews
        category_products.sort(
            key=lambda x: (x.get('rating', 0) * x.get('reviews', 0)), 
            reverse=True
        )
        recommendations.extend(category_products[:2])  # Top 2 from each category
    
    return recommendations

def get_similar_products(purchased_products, exclude_ids):
    """Get products similar to purchased ones"""
    recommendations = []
    
    for purchased in purchased_products:
        similar_products = []
        for product in products:
            if product['id'] not in exclude_ids:
                similarity = calculate_similarity(purchased, product)
                if similarity > 0.3:  # Threshold for similarity
                    similar_products.append((product, similarity))
        
        # Sort by similarity and add top matches
        similar_products.sort(key=lambda x: x[1], reverse=True)
        recommendations.extend([p[0] for p in similar_products[:2]])
    
    return recommendations

def get_price_range_recommendations(purchased_products, exclude_ids):
    """Get recommendations in similar price range"""
    if not purchased_products:
        return []
    
    avg_price = sum(p['price'] for p in purchased_products) / len(purchased_products)
    price_range_products = []
    
    for product in products:
        if product['id'] not in exclude_ids:
            price_diff = abs(product['price'] - avg_price) / avg_price
            if price_diff <= 0.5:  # Within 50% of average price
                price_range_products.append(product)
    
    # Sort by rating
    price_range_products.sort(
        key=lambda x: x.get('rating', 0), 
        reverse=True
    )
    
    return price_range_products[:3]

@app.route('/recommend', methods=['POST'])
def recommend():
    data = request.get_json()
    history = data.get("history", [])
    user_id = data.get("user_id", "anonymous")
    limit = data.get("limit", 6)
    
    # Extract purchased product IDs and details
    bought_ids = {item.get("id") for item in history if "id" in item}
    purchased_products = [
        next((p for p in products if p['id'] == item.get("id")), None) 
        for item in history if "id" in item
    ]
    purchased_products = [p for p in purchased_products if p is not None]
    
    # Update user purchase history
    user_purchases[user_id] = list(bought_ids)
    
    # Update product purchase counts
    for product_id in bought_ids:
        product_purchases[product_id] = product_purchases.get(product_id, 0) + 1
    
    recommendations = []
    recommendation_reasons = []
    
    if purchased_products:
        print(f"🛍️ User {user_id} has purchase history: {[p['name'] for p in purchased_products]}")
        
        # 1. Similar products (collaborative filtering)
        similar_recs = get_similar_products(purchased_products, bought_ids)
        for rec in similar_recs[:2]:
            if rec not in recommendations:
                recommendations.append(rec)
                recommendation_reasons.append(f"Similar to {purchased_products[0]['name']}")
        
        # 2. Category-based recommendations
        purchased_categories = [p['category'] for p in purchased_products]
        category_recs = get_category_recommendations(purchased_categories, bought_ids)
        for rec in category_recs[:2]:
            if rec not in recommendations:
                recommendations.append(rec)
                recommendation_reasons.append(f"Popular in {rec['category']}")
        
        # 3. Price range recommendations
        price_recs = get_price_range_recommendations(purchased_products, bought_ids)
        for rec in price_recs[:2]:
            if rec not in recommendations:
                recommendations.append(rec)
                recommendation_reasons.append("In your price range")
    
    # 4. Fill remaining slots with popular products
    popular_products = get_popular_products()
    for product in popular_products:
        if len(recommendations) >= limit:
            break
        if product['id'] not in bought_ids and product not in recommendations:
            recommendations.append(product)
            recommendation_reasons.append("Trending now")
    
    # 5. If still not enough, add random products
    available_products = [p for p in products if p['id'] not in bought_ids and p not in recommendations]
    while len(recommendations) < limit and available_products:
        random_product = random.choice(available_products)
        recommendations.append(random_product)
        recommendation_reasons.append("You might like this")
        available_products.remove(random_product)
    
    # Prepare response with reasons
    recommended_with_reasons = []
    for i, rec in enumerate(recommendations[:limit]):
        rec_copy = rec.copy()
        rec_copy['recommendation_reason'] = recommendation_reasons[i] if i < len(recommendation_reasons) else "Recommended for you"
        recommended_with_reasons.append(rec_copy)
    
    print(f"🎯 Recommended {len(recommended_with_reasons)} products for user {user_id}")
    print(f"📋 Recommendations: {[(p['name'], p['recommendation_reason']) for p in recommended_with_reasons]}")
    
    return jsonify({
        "recommendations": recommended_with_reasons,
        "total_products": len(products),
        "user_history_count": len(history)
    })

@app.route('/track-view', methods=['POST'])
def track_view():
    """Track when a user views a product"""
    data = request.get_json()
    product_id = data.get("product_id")
    
    if product_id:
        product_views[product_id] = product_views.get(product_id, 0) + 1
        print(f"👁️ Product {product_id} viewed (total views: {product_views[product_id]})")
    
    return jsonify({"message": "View tracked"})

@app.route('/analytics', methods=['GET'])
def get_analytics():
    """Get basic analytics about products and user behavior"""
    return jsonify({
        "total_products": len(products),
        "total_users": len(user_purchases),
        "most_viewed_products": dict(sorted(product_views.items(), key=lambda x: x[1], reverse=True)[:5]),
        "most_purchased_products": dict(sorted(product_purchases.items(), key=lambda x: x[1], reverse=True)[:5]),
        "categories": list(set(p['category'] for p in products))
    })

if __name__ == '__main__':
    app.run(port=5001, debug=True)
