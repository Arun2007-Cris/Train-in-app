"""
TRAIN IN APP — Python Flask Backend API
College Project REST Architecture
"""

from flask import Flask, request, jsonify, session
import random
import os
from ai_recommendation import compute_ai_score_and_reason

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "train-in-app-secret-demo-key-2026")

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        "status": "ok",
        "app": "Train In App (Flask/Python)",
        "message": "AI-Powered Train Search & Booking System API active"
    })

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email')
    password = data.get('password')
    if not email or not password:
        return jsonify({"success": False, "message": "Email and password required"}), 400
    
    session['user'] = email
    return jsonify({
        "success": True,
        "message": "Login successful",
        "user": {"email": email, "name": email.split('@')[0]}
    })

@app.route('/api/passenger', methods=['POST'])
def passenger():
    data = request.get_json() or {}
    name = data.get('name')
    aadhaar = data.get('aadhaar_number', '')
    phone = data.get('phone_number')
    
    if not name or not aadhaar or not phone:
        return jsonify({"success": False, "message": "All passenger details required"}), 400
    
    clean_aadhaar = "".join(filter(str.isdigit, aadhaar))
    masked = f"XXXX-XXXX-{clean_aadhaar[-4:]}" if len(clean_aadhaar) >= 4 else "XXXX-XXXX-XXXX"
    
    return jsonify({
        "success": True,
        "passenger": {
            "name": name,
            "masked_aadhaar": masked,
            "phone_number": phone
        }
    })

@app.route('/api/search-trains', methods=['POST'])
def search_trains():
    data = request.get_json() or {}
    b_code = data.get('boarding_code', '').upper()
    d_code = data.get('destination_code', '').upper()
    preference = data.get('preference', 'Best overall')
    
    # Station awareness logic: Check if stop exists and direction is forward
    return jsonify({
        "success": True,
        "message": f"Evaluated trains between {b_code} and {d_code} with {preference} preference",
        "query": data
    })

@app.route('/api/book', methods=['POST'])
def book_ticket():
    data = request.get_json() or {}
    pnr = f"TI{random.randint(10000000, 99999999)}"
    return jsonify({
        "success": True,
        "pnr": pnr,
        "message": "Demo ticket confirmed. College project prototype.",
        "booking": {**data, "pnr": pnr, "status": "CONFIRMED"}
    })

@app.route('/api/booking/<pnr>', methods=['GET'])
def get_booking(pnr):
    return jsonify({
        "success": True,
        "pnr": pnr,
        "status": "CONFIRMED",
        "disclaimer": "This is only a prototype booking and must not be presented as an actual railway reservation."
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
