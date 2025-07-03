from flask import Flask, request, jsonify
from flask_cors import CORS
import random
from collections import Counter, defaultdict
import math

# Handle requests import with fallback
try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False
    print("⚠️ Warning: 'requests' module not available. Product sync will be disabled.")

app = Flask(__name__)

CORS(app, resources={r"/*": {"origins": [
    "https://e-commerce-website-orcin-xi.vercel.app",
    "http://localhost:3000"
]}}, supports_credentials=True)

@app.route('/health', methods=['GET', 'OPTIONS'])
def health_check():
    return jsonify({"status": "OK"})

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
    if not REQUESTS_AVAILABLE:
        print("❌ Cannot sync products: 'requests' module not available")
        return False
        
    try:
        response = requests.get(f"{NODE_JS_BACKEND}/api/products")
        if response.status_code == 200:
            fetched_products = response.json()
            
            # Clear existing products and update with fresh data
            global products
            products = []
            
            for product in fetched_products:
                # Handle both MongoDB and DummyJSON products
                product_id = product.get("_id") or product.get("id")
                ml_product = {
                    "id": product_id,
                    "name": product.get("name") or product.get("title"),
                    "price": float(product.get("price", 0)),
                    "image": product.get("image") or product.get("thumbnail"),
                    "description": product.get("description", ""),
                    "category": product.get("category", "Others"),
                    "rating": product.get("rating", round(random.uniform(3.5, 5.0), 1)),
                    "reviews": product.get("reviews", random.randint(10, 500)),
                    "tags": extract_tags(
                        product.get("name") or product.get("title", ""), 
                        product.get("description", "")
                    )
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

def sync_dummyjson_products():
    """Sync DummyJSON products (IDs 1001-1100) to ML system"""
    if not REQUESTS_AVAILABLE:
        print("❌ Cannot sync DummyJSON products: 'requests' module not available")
        return False
        
    try:
        # Fetch products from DummyJSON (IDs 1-100)
        response = requests.get("https://dummyjson.com/products?limit=100")
        if response.status_code == 200:
            dummy_data = response.json()
            
            for product in dummy_data.get("products", []):
                # Convert DummyJSON ID to frontend ID (add 1000)
                frontend_id = product.get("id", 0) + 1000
                
                ml_product = {
                    "id": frontend_id,  # Use frontend ID format
                    "name": product.get("title", ""),
                    "price": float(product.get("price", 0)),
                    "image": product.get("thumbnail", ""),
                    "description": product.get("description", ""),
                    "category": product.get("category", "Others"),
                    "rating": product.get("rating", round(random.uniform(3.5, 5.0), 1)),
                    "reviews": random.randint(10, 500),
                    "tags": extract_tags(
                        product.get("title", ""), 
                        product.get("description", "")
                    )
                }
                products.append(ml_product)
            
            print(f"✅ Synced {len(dummy_data.get('products', []))} DummyJSON products")
            return True
        else:
            print(f"❌ Failed to sync DummyJSON products: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error syncing DummyJSON products: {str(e)}")
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
def initialize_products():
    """Initialize products from both Node.js backend and DummyJSON"""
    print("🔄 Initializing products from multiple sources...")
    
    # Sync from Node.js backend
    nodejs_success = sync_products_from_nodejs()
    
    # Sync from DummyJSON
    dummyjson_success = sync_dummyjson_products()
    
    if not nodejs_success and not dummyjson_success:
        print("⚠️ Failed to sync from both sources. Using fallback products.")
        # Create some fallback products to ensure ML system works
        create_fallback_products()
    
    print(f"📦 Total products available: {len(products)}")

def create_fallback_products():
    """Create fallback products if syncing fails"""
    global products
    fallback_products = [
        {
            "id": "fallback_001",
            "name": "Sample Product 1",
            "price": 99.99,
            "image": "https://via.placeholder.com/300",
            "description": "A great sample product",
            "category": "Electronics",
            "rating": 4.5,
            "reviews": 150,
            "tags": ["sample", "electronics"]
        },
        {
            "id": "fallback_002",
            "name": "Sample Product 2",
            "price": 149.99,
            "image": "https://via.placeholder.com/300",
            "description": "Another great sample product",
            "category": "Fashion",
            "rating": 4.2,
            "reviews": 200,
            "tags": ["sample", "fashion"]
        }
    ]
    
    products.extend(fallback_products)
    print(f"➕ Added {len(fallback_products)} fallback products")

# Initialize products on first request
@app.before_request
def before_first_request():
    if not hasattr(app, 'products_initialized'):
        initialize_products()
        app.products_initialized = True

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
    # Clear existing products
    global products
    products = []
    
    # Re-initialize
    initialize_products()
    
    return jsonify({"message": f"Successfully synced {len(products)} products"})

@app.route('/delete-product/<product_id>', methods=['DELETE'])
def delete_product(product_id):
    """Delete a product - handle both string and int IDs"""
    global products
    initial_count = len(products)
    
    # Handle both string and integer product IDs
    products = [p for p in products if str(p['id']) != str(product_id)]
    
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
    
    # Generate new ID - handle both string and int IDs
    existing_ids = [p["id"] for p in products]
    numeric_ids = [int(id) for id in existing_ids if str(id).isdigit()]
    new_id = max(numeric_ids, default=0) + 1
    
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
        # Convert product ID to string for consistent lookup
        product_id_str = str(product['id'])
        popularity_score = (
            product_views.get(product_id_str, 0) * 0.3 +
            product_purchases.get(product_id_str, 0) * 0.5 +
            product.get('rating', 0) * product.get('reviews', 0) * 0.2
        )
        scored_products.append((product, popularity_score))
    
    return [p[0] for p in sorted(scored_products, key=lambda x: x[1], reverse=True)]

def get_category_recommendations(purchased_categories, exclude_ids):
    """Get recommendations based on purchased categories"""
    category_counts = Counter(purchased_categories)
    recommendations = []
    
    # Convert exclude_ids to strings for consistent comparison
    exclude_ids_str = set(str(id) for id in exclude_ids)
    
    for category, count in category_counts.most_common():
        category_products = [
            p for p in products 
            if p['category'] == category and str(p['id']) not in exclude_ids_str
        ]
        # Sort by rating and reviews
        category_products.sort(
            key=lambda x: (x.get('rating', 0) * x.get('reviews', 0)), 
            reverse=True
        )
        recommendations.extend(category_products[:2])  # Top 2 from each category
    
    return recommendations

def get_diverse_category_recommendations(purchased_categories, exclude_ids, used_categories):
    """Get recommendations from different categories for diversity"""
    category_counts = Counter(purchased_categories)
    recommendations = []
    
    # Convert exclude_ids to strings for consistent comparison
    exclude_ids_str = set(str(id) for id in exclude_ids)
    
    # Get all available categories
    all_categories = set(p['category'] for p in products)
    
    # Prioritize categories that user has purchased from but haven't been used yet
    for category, count in category_counts.most_common():
        if category not in used_categories:
            category_products = [
                p for p in products 
                if p['category'] == category and str(p['id']) not in exclude_ids_str
            ]
            if category_products:
                # Sort by rating and reviews, get the best one
                category_products.sort(
                    key=lambda x: (x.get('rating', 0) * x.get('reviews', 0)), 
                    reverse=True
                )
                recommendations.append(category_products[0])
                if len(recommendations) >= 2:
                    break
    
    # If still need more, add from completely different categories
    if len(recommendations) < 2:
        unused_categories = all_categories - used_categories - set(purchased_categories)
        for category in unused_categories:
            category_products = [
                p for p in products 
                if p['category'] == category and str(p['id']) not in exclude_ids_str
            ]
            if category_products:
                # Sort by rating and reviews, get the best one
                category_products.sort(
                    key=lambda x: (x.get('rating', 0) * x.get('reviews', 0)), 
                    reverse=True
                )
                recommendations.append(category_products[0])
                if len(recommendations) >= 2:
                    break
    
    return recommendations

def get_similar_products(purchased_products, exclude_ids):
    """Get products similar to purchased ones"""
    recommendations = []
    
    # Convert exclude_ids to strings for consistent comparison
    exclude_ids_str = set(str(id) for id in exclude_ids)
    
    for purchased in purchased_products:
        similar_products = []
        for product in products:
            if str(product['id']) not in exclude_ids_str:
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
    
    # Convert exclude_ids to strings for consistent comparison
    exclude_ids_str = set(str(id) for id in exclude_ids)
    
    avg_price = sum(p['price'] for p in purchased_products) / len(purchased_products)
    price_range_products = []
    
    for product in products:
        if str(product['id']) not in exclude_ids_str:
            price_diff = abs(product['price'] - avg_price) / avg_price
            if price_diff <= 0.5:  # Within 50% of average price
                price_range_products.append(product)
    
    # Sort by rating
    price_range_products.sort(
        key=lambda x: x.get('rating', 0), 
        reverse=True
    )
    
    return price_range_products[:3]

def find_product_by_id(product_id):
    """Find product by ID, handling both string and integer IDs"""
    for product in products:
        if str(product['id']) == str(product_id):
            return product
    return None

@app.route('/recommend', methods=['POST'])
def recommend():
    data = request.get_json()
    history = data.get("history", [])
    user_id = data.get("user_id", "anonymous")
    limit = data.get("limit", 6)
    
    print(f"🔍 Recommendation request for user {user_id}")
    print(f"📊 Available products: {len(products)}")
    print(f"🛒 User history: {len(history)} items")
    
    # If no products available, return empty recommendations
    if not products:
        print("❌ No products available for recommendations")
        return jsonify({
            "recommendations": [],
            "total_products": 0,
            "user_history_count": len(history),
            "message": "No products available for recommendations"
        })
    
    # Extract purchased product IDs and details
    bought_ids = {str(item.get("id")) for item in history if "id" in item}
    purchased_products = []
    
    for item in history:
        if "id" in item:
            product = find_product_by_id(item.get("id"))
            if product:
                purchased_products.append(product)
    
    # Update user purchase history
    user_purchases[user_id] = list(bought_ids)
    
    # Update product purchase counts
    for product_id in bought_ids:
        product_purchases[product_id] = product_purchases.get(product_id, 0) + 1
    
    recommendations = []
    recommendation_reasons = []
    used_categories = set()
    
    if purchased_products:
        print(f"🛍️ User {user_id} has purchase history: {[p['name'] for p in purchased_products]}")
        
        # 1. Add ONE similar product (avoid duplicates)
        similar_recs = get_similar_products(purchased_products, bought_ids)
        if similar_recs:
            best_similar = similar_recs[0]
            recommendations.append(best_similar)
            recommendation_reasons.append(f"Similar to {purchased_products[0]['name']}")
            used_categories.add(best_similar['category'])
        
        # 2. Add products from DIFFERENT categories than already added
        purchased_categories = [p['category'] for p in purchased_products]
        category_recs = get_diverse_category_recommendations(purchased_categories, bought_ids, used_categories)
        for rec in category_recs[:2]:
            if rec not in recommendations:
                recommendations.append(rec)
                recommendation_reasons.append(f"Popular in {rec['category']}")
                used_categories.add(rec['category'])
        
        # 3. Add ONE price range recommendation from different category
        price_recs = get_price_range_recommendations(purchased_products, bought_ids)
        for rec in price_recs:
            if rec not in recommendations and rec['category'] not in used_categories:
                recommendations.append(rec)
                recommendation_reasons.append("In your price range")
                used_categories.add(rec['category'])
                break
    
    # 4. Fill remaining slots with diverse popular products
    popular_products = get_popular_products()
    for product in popular_products:
        if len(recommendations) >= limit:
            break
        if (str(product['id']) not in bought_ids and 
            product not in recommendations and 
            product['category'] not in used_categories):
            recommendations.append(product)
            recommendation_reasons.append("Trending now")
            used_categories.add(product['category'])
    
    # 5. If still not enough, add random products from different categories
    available_products = [p for p in products if str(p['id']) not in bought_ids and p not in recommendations]
    random.shuffle(available_products)  # Shuffle for better diversity
    
    for product in available_products:
        if len(recommendations) >= limit:
            break
        if product['category'] not in used_categories:
            recommendations.append(product)
            recommendation_reasons.append("You might like this")
            used_categories.add(product['category'])
    
    # 6. If still not enough, fill with any remaining products
    for product in available_products:
        if len(recommendations) >= limit:
            break
        if product not in recommendations:
            recommendations.append(product)
            recommendation_reasons.append("Recommended for you")
    
    # Prepare response with reasons
    recommended_with_reasons = []
    for i, rec in enumerate(recommendations[:limit]):
        rec_copy = rec.copy()
        rec_copy['recommendation_reason'] = recommendation_reasons[i] if i < len(recommendation_reasons) else "Recommended for you"
        recommended_with_reasons.append(rec_copy)
    
    print(f"🎯 Recommended {len(recommended_with_reasons)} products for user {user_id}")
    print(f"📋 Recommendations: {[(p['name'], p['recommendation_reason']) for p in recommended_with_reasons]}")
    print(f"🎨 Categories used: {list(used_categories)}")
    
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
        # Convert to string for consistent storage
        product_id_str = str(product_id)
        product_views[product_id_str] = product_views.get(product_id_str, 0) + 1
        print(f"👁️ Product {product_id_str} viewed (total views: {product_views[product_id_str]})")
    
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
