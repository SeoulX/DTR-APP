from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from bson.objectid import ObjectId
from pymongo import MongoClient
import os

app = Flask(__name__)
CORS(app)

# MongoDB Connection
mongo_uri = os.environ.get('MONGO_URI', 'mongodb://mongodb:27017/')
client = MongoClient(mongo_uri)
db = client.dtr_database

# Helper function to convert MongoDB ObjectId to string
def serialize_doc(doc):
    if doc.get('_id'):
        doc['id'] = str(doc['_id'])
        del doc['_id']
    return doc

# Initialize database with test user
def init_db():
    # Check if users collection has any documents
    if db.users.count_documents({}) == 0:
        # Create a test user
        test_user = {
            'name': 'Test Intern',
            'email': 'test@oaktree.com',
            'password': generate_password_hash('password123'),
            'role': 'intern',
            'created_at': datetime.now()
        }
        db.users.insert_one(test_user)
        print("Test user created")

# Call init_db function
init_db()

# Routes
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    user = db.users.find_one({'email': email})
    
    if not user or not check_password_hash(user['password'], password):
        return jsonify({'message': 'Invalid credentials'}), 401
    
    # Instead of JWT, just return user info
    return jsonify({
        'user': {
            'id': str(user['_id']),
            'name': user['name'],
            'email': user['email'],
            'role': user['role']
        }
    })

@app.route('/api/time-records', methods=['GET'])
def get_time_records():
    # Get user_id from query parameter instead of JWT
    user_id = request.args.get('user_id')
    
    if not user_id:
        return jsonify({'message': 'User ID is required'}), 400
    
    # Get the last 7 days of records
    records = list(db.time_records.find(
        {'user_id': user_id}
    ).sort('date', -1).limit(7))
    
    # Calculate total hours
    total_hours = 0
    records_data = []
    
    for record in records:
        # Convert ObjectId to string for JSON serialization
        record_data = serialize_doc(record)
        
        # Format dates for frontend
        if 'date' in record_data:
            record_data['date'] = record_data['date'].isoformat()
        if 'time_in' in record_data:
            record_data['timeIn'] = record_data['time_in'].isoformat()
            del record_data['time_in']
        if 'time_out' in record_data and record_data['time_out']:
            record_data['timeOut'] = record_data['time_out'].isoformat()
            del record_data['time_out']
        else:
            record_data['timeOut'] = None
            
        # Add hours to total
        if 'hours' in record_data and record_data['hours']:
            total_hours += record_data['hours']
            
        records_data.append(record_data)
    
    return jsonify({
        'records': records_data,
        'totalHours': total_hours
    })

@app.route('/api/clock-in', methods=['POST'])
def clock_in():
    data = request.get_json()
    user_id = data.get('user_id')
    
    if not user_id:
        return jsonify({'message': 'User ID is required'}), 400
    
    # Check if user is already clocked in
    today = datetime.now().date()
    existing_record = db.time_records.find_one({
        'user_id': user_id,
        'date': today,
        'time_out': None
    })
    
    if existing_record:
        return jsonify({'message': 'You are already clocked in'}), 400
    
    # Create new time record
    now = datetime.now()
    new_record = {
        'user_id': user_id,
        'date': today,
        'time_in': now,
        'time_out': None,
        'hours': None,
        'created_at': now
    }
    
    result = db.time_records.insert_one(new_record)
    
    return jsonify({
        'message': 'Clocked in successfully',
        'record': {
            'id': str(result.inserted_id),
            'date': today.isoformat(),
            'timeIn': now.isoformat()
        }
    })

@app.route('/api/clock-out', methods=['POST'])
def clock_out():
    data = request.get_json()
    user_id = data.get('user_id')
    
    if not user_id:
        return jsonify({'message': 'User ID is required'}), 400
    
    # Find the active time record
    today = datetime.now().date()
    active_record = db.time_records.find_one({
        'user_id': user_id,
        'date': today,
        'time_out': None
    })
    
    if not active_record:
        return jsonify({'message': 'No active clock-in found'}), 400
    
    # Update the record with clock-out time
    now = datetime.now()
    
    # Calculate hours worked (in decimal)
    time_diff = now - active_record['time_in']
    hours_worked = round(time_diff.total_seconds() / 3600, 2)
    
    db.time_records.update_one(
        {'_id': active_record['_id']},
        {'$set': {
            'time_out': now,
            'hours': hours_worked,
            'updated_at': now
        }}
    )
    
    return jsonify({
        'message': 'Clocked out successfully',
        'record': {
            'id': str(active_record['_id']),
            'date': active_record['date'].isoformat(),
            'timeIn': active_record['time_in'].isoformat(),
            'timeOut': now.isoformat(),
            'hours': hours_worked
        }
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)), debug=True)

