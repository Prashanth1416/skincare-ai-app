from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from datetime import timedelta
from PIL import Image
import datetime
import numpy as np
import os
import warnings
import sqlalchemy

warnings.filterwarnings('ignore', category=sqlalchemy.exc.LegacyAPIWarning)

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=False)

app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=7)
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:123456@localhost/skincare_ai'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'change-this-secret-in-production')
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

db = SQLAlchemy(app)
jwt = JWTManager(app)

try:
    import tensorflow as tf
    MODEL_PATH = os.path.join(BASE_DIR, 'models', 'skin_type_model.keras')
    CLASS_PATH = os.path.join(BASE_DIR, 'models', 'skin_type_classes.txt')
    skin_model = tf.keras.models.load_model(MODEL_PATH) if os.path.exists(MODEL_PATH) else None
    if os.path.exists(CLASS_PATH):
      with open(CLASS_PATH, 'r', encoding='utf-8') as f:
          CLASS_NAMES = [line.strip() for line in f if line.strip()]
    else:
      CLASS_NAMES = ['oily', 'dry', 'normal', 'combination', 'sensitive']
except Exception:
    skin_model = None
    CLASS_NAMES = ['oily', 'dry', 'normal', 'combination', 'sensitive']


class User(db.Model):
    __tablename__ = 'user'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    full_name = db.Column(db.String(120))
    age = db.Column(db.Integer)
    gender = db.Column(db.String(20))
    phone = db.Column(db.String(20))
    date_of_birth = db.Column(db.Date)
    height = db.Column(db.Float)
    weight = db.Column(db.Float)
    skin_type = db.Column(db.String(50))
    allergies = db.Column(db.Text)
    medical_records = db.Column(db.Text)
    cycle_length = db.Column(db.Integer, default=28)
    last_period_start = db.Column(db.Date)
    pms_severity = db.Column(db.String(20), default='mild')
    profile_completed = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    skin_analyses = db.relationship('SkinAnalysis', backref='user', lazy=True)
    mood_analyses = db.relationship('MorningMoodAnalysis', backref='user', lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


class SkinAnalysis(db.Model):
    __tablename__ = 'skin_analysis'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    skin_type = db.Column(db.String(50))
    issue = db.Column(db.String(200))
    recommendation = db.Column(db.Text)
    image_path = db.Column(db.String(255))
    model_confidence = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)


class MorningMoodAnalysis(db.Model):
    __tablename__ = 'morning_mood_analysis'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    dark_circle_severity = db.Column(db.String(50))
    skin_puffiness = db.Column(db.String(50))
    morning_mood = db.Column(db.String(50))
    sleep_quality_estimate = db.Column(db.String(50))
    face_condition = db.Column(db.String(200))
    recommendation = db.Column(db.Text)
    image_path = db.Column(db.String(255))
    model_prediction = db.Column(db.String(50))
    model_confidence = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)


def calculate_age_from_dob(dob):
    if not dob:
        return None
    today = datetime.date.today()
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))


def preprocess_image(path, img_size=(224, 224)):
    try:
        img = Image.open(path).convert('RGB')
        img = img.resize(img_size)
        arr = np.array(img) / 255.0
        return np.expand_dims(arr, axis=0)
    except Exception:
        return None


def predict_with_model(image_path):
    try:
        if not skin_model:
            return heuristic_skin_type(image_path)
        input_tensor = preprocess_image(image_path)
        if input_tensor is None:
            return heuristic_skin_type(image_path)
        predictions = skin_model.predict(input_tensor, verbose=0)
        pred_idx = int(np.argmax(predictions[0]))
        pred_class = CLASS_NAMES[pred_idx] if pred_idx < len(CLASS_NAMES) else 'normal'
        confidence = float(predictions[0][pred_idx])
        img = Image.open(image_path).convert('RGB')
        img_array = np.array(img)
        brightness = np.mean(img_array)
        contrast = np.std(img_array)
        return pred_class, confidence, {'brightness': float(brightness), 'contrast': float(contrast)}
    except Exception:
        return heuristic_skin_type(image_path)


def heuristic_skin_type(image_path):
    try:
        img = Image.open(image_path).convert('RGB')
        arr = np.array(img)
        brightness = float(np.mean(arr))
        contrast = float(np.std(arr))
        if brightness > 165 and contrast < 45:
            skin_type = 'dry'
        elif contrast > 62:
            skin_type = 'oily'
        elif 48 <= contrast <= 62:
            skin_type = 'combination'
        else:
            skin_type = 'normal'
        return skin_type, 0.55, {'brightness': brightness, 'contrast': contrast}
    except Exception:
        return 'normal', 0.4, {}


def build_personalized_recommendation(skin_type, user_id):
    user = db.session.get(User, user_id)
    age = calculate_age_from_dob(user.date_of_birth) if user and user.date_of_birth else user.age if user else None
    bank = {
        'oily': {
            'base': 'Use a gel cleanser, lightweight oil-free moisturizer, and sunscreen every morning.',
            'routine': ['Morning: cleanser, niacinamide, moisturizer, SPF', 'Night: cleanser, salicylic acid 2-3x weekly, moisturizer'],
            'products': ['Niacinamide serum', 'Salicylic acid cleanser', 'Oil-free moisturizer'],
            'foods': ['Green tea', 'Fresh fruits', 'Omega-3 foods'],
            'avoid': ['Heavy creams', 'Over-layering oils']
        },
        'dry': {
            'base': 'Use a hydrating cleanser, ceramide moisturizer, and avoid harsh exfoliation.',
            'routine': ['Morning: cleanser, hydrating serum, moisturizer, SPF', 'Night: cleanser, hyaluronic acid, rich cream'],
            'products': ['Ceramide cream', 'Hyaluronic acid serum', 'Gentle cleanser'],
            'foods': ['Avocado', 'Nuts', 'Hydrating fruits'],
            'avoid': ['Hot water', 'Alcohol-heavy toners']
        },
        'combination': {
            'base': 'Balance hydration and oil control with a lightweight but supportive routine.',
            'routine': ['Morning: cleanser, balancing serum, gel cream, SPF', 'Night: cleanser, serum, light moisturizer'],
            'products': ['Balancing toner', 'Gel moisturizer', 'Gentle exfoliant'],
            'foods': ['Whole grains', 'Leafy greens', 'Water-rich fruits'],
            'avoid': ['Using the same heavy product on all zones']
        },
        'sensitive': {
            'base': 'Keep the routine gentle, fragrance-free, and barrier-focused.',
            'routine': ['Morning: gentle cleanser, calming serum, moisturizer, mineral SPF', 'Night: cleanser, soothing cream'],
            'products': ['Centella serum', 'Fragrance-free moisturizer', 'Mineral sunscreen'],
            'foods': ['Chamomile tea', 'Berries', 'Omega-3 foods'],
            'avoid': ['Fragrance', 'Strong acids', 'Aggressive scrubs']
        },
        'normal': {
            'base': 'Maintain a simple routine with cleanser, moisturizer, and daily sunscreen.',
            'routine': ['Morning: cleanser, vitamin C, moisturizer, SPF', 'Night: cleanser, serum, moisturizer'],
            'products': ['Vitamin C serum', 'Lightweight moisturizer', 'Gentle cleanser'],
            'foods': ['Berries', 'Water', 'Leafy greens'],
            'avoid': ['Skipping SPF', 'Over-exfoliation']
        }
    }
    rec = bank.get((skin_type or 'normal').lower(), bank['normal'])
    age_based = []
    if age and age >= 25:
        age_based = ['Introduce retinol slowly', 'Prioritize daily SPF', 'Add antioxidant support']
    return {**rec, 'age_based': age_based}


def analyze_morning_mood_with_model(image_path, model_skin_type=None):
    try:
        img = Image.open(image_path).convert('RGB')
        img_array = np.array(img)
        brightness = np.mean(img_array, axis=2)
        contrast = float(np.std(brightness))
        dark_regions = float(np.sum(brightness < 100) / brightness.size)
        if dark_regions > 0.3:
            dark_circle_severity, dark_circle_score = 'severe', 0.8
        elif dark_regions > 0.15:
            dark_circle_severity, dark_circle_score = 'moderate', 0.5
        else:
            dark_circle_severity, dark_circle_score = 'mild', 0.2
        if contrast < 15:
            skin_puffiness, puffiness_score = 'severe', 0.9
        elif contrast < 25:
            skin_puffiness, puffiness_score = 'moderate', 0.5
        else:
            skin_puffiness, puffiness_score = 'none', 0.1
        combined = (dark_circle_score + puffiness_score) / 2
        if combined > 0.7:
            sleep_quality_estimate, estimated_sleep_hours, morning_mood = 'poor', '< 5 hours', 'very_tired'
        elif combined > 0.4:
            sleep_quality_estimate, estimated_sleep_hours, morning_mood = 'average', '5-7 hours', 'tired'
        else:
            sleep_quality_estimate, estimated_sleep_hours, morning_mood = 'good', '> 7 hours', 'normal'
        if combined < 0.15:
            morning_mood = 'energetic'
        return {
            'dark_circle_severity': dark_circle_severity,
            'dark_circle_score': dark_circle_score,
            'skin_puffiness': skin_puffiness,
            'puffiness_score': puffiness_score,
            'sleep_quality_estimate': sleep_quality_estimate,
            'estimated_sleep_hours': estimated_sleep_hours,
            'morning_mood': morning_mood,
            'model_prediction': model_skin_type or 'normal',
            'model_confidence': 0.6,
        }
    except Exception:
        return None


def build_morning_remedies(dark_circle_severity, puffiness, mood, sleep_estimate, model_skin_type=None):
    remedies = {
        'immediate_steps': [],
        'skincare_routine': [],
        'lifestyle_tips': [],
        'supplements': [],
        'diet_suggestions': []
    }
    if model_skin_type == 'dry':
        remedies['immediate_steps'].append('Apply a hydrating eye cream before starting the day')
    if model_skin_type in ['oily', 'combination']:
        remedies['immediate_steps'].append('Use a lightweight oil-control gel under the eyes and T-zone')
    if dark_circle_severity == 'severe':
        remedies['immediate_steps'] += ['Use a cold compress for 5 minutes', 'Apply caffeine-based eye serum']
    elif dark_circle_severity == 'moderate':
        remedies['immediate_steps'].append('Use a cool roller around the under-eye area')
    else:
        remedies['immediate_steps'].append('Maintain your current eye-care routine')
    if puffiness in ['severe', 'moderate']:
        remedies['lifestyle_tips'] += ['Reduce sodium intake', 'Sleep with head slightly elevated', 'Hydrate early in the day']
    if sleep_estimate == 'poor':
        remedies['lifestyle_tips'] += ['Aim for 7-9 hours tonight', 'Limit screens before bed']
        remedies['supplements'] += ['Magnesium before bed']
    if mood in ['tired', 'very_tired']:
        remedies['lifestyle_tips'] += ['Get morning sunlight', 'Take a short walk or stretch']
    remedies['skincare_routine'] += ['Cleanse gently', 'Use moisturizer suited to your skin type', 'Apply sunscreen every morning']
    remedies['diet_suggestions'] += ['Berries', 'Leafy greens', 'Omega-3 sources', 'Adequate water intake']
    return remedies


def get_cycle_day(last_start, cycle_length):
    if not last_start or not cycle_length:
        return None
    delta = (datetime.date.today() - last_start).days
    return (delta % cycle_length) + 1


def predict_hormonal_skin_and_mood(cycle_day, cycle_length, model_skin_type=None):
    if not cycle_day or not cycle_length:
        return None
    phase_pos = cycle_day * 28.0 / float(cycle_length)
    if phase_pos <= 5:
        phase = 'menstrual'
    elif phase_pos <= 13:
        phase = 'follicular'
    elif phase_pos <= 16:
        phase = 'ovulation'
    else:
        phase = 'luteal'
    forecast = []
    for offset in [0, 3, 7]:
        d = (cycle_day + offset - 1) % cycle_length + 1
        pos = d * 28.0 / float(cycle_length)
        if pos <= 5:
            ph = 'menstrual'; skin = 'more sensitive and dehydrated'; mood = 'lower energy, rest is helpful'; risk = 'barrier support is best'
        elif pos <= 13:
            ph = 'follicular'; skin = 'balanced to slightly dry'; mood = 'energy improving'; risk = 'good time for actives'
        elif pos <= 16:
            ph = 'ovulation'; skin = 'glowy and clearer'; mood = 'more social and confident'; risk = 'watch for occasional hormonal bump'
        else:
            ph = 'luteal'; skin = 'oilier and more congestion-prone'; mood = 'more sensitive and irritable'; risk = 'premenstrual acne more likely'
        if model_skin_type == 'sensitive' and ph in ['menstrual', 'luteal']:
            skin = 'more reactive than usual, keep routine very gentle'
        forecast.append({'cycle_day': d, 'phase': ph, 'skin_state': skin, 'risk_note': risk, 'mood_tendency': mood})
    return {'today_phase': phase, 'today_cycle_day': cycle_day, 'forecast': forecast}


PRODUCT_BANK = {
    'oily': [
        {'name': 'CeraVe Foaming Facial Cleanser', 'brand': 'CeraVe', 'category': 'Cleanser', 'reason': 'Helps remove excess oil without stripping the skin', 'use': 'AM/PM'},
        {'name': 'The Ordinary Niacinamide 10% + Zinc 1%', 'brand': 'The Ordinary', 'category': 'Serum', 'reason': 'Supports oil balance and helps with visible pores', 'use': 'AM/PM'},
        {'name': 'La Roche-Posay Anthelios Oil Control SPF 50+', 'brand': 'La Roche-Posay', 'category': 'Sunscreen', 'reason': 'Lightweight daily SPF with better oil control', 'use': 'AM'}
    ],
    'dry': [
        {'name': 'CeraVe Hydrating Cleanser', 'brand': 'CeraVe', 'category': 'Cleanser', 'reason': 'Cleanses while supporting the skin barrier', 'use': 'AM/PM'},
        {'name': 'Vanicream Moisturizing Cream', 'brand': 'Vanicream', 'category': 'Moisturizer', 'reason': 'Rich hydration for dryness and sensitivity', 'use': 'AM/PM'},
        {'name': 'La Roche-Posay Hyalu B5 Serum', 'brand': 'La Roche-Posay', 'category': 'Serum', 'reason': 'Adds hydration and plumpness', 'use': 'AM/PM'}
    ],
    'combination': [
        {'name': 'Cetaphil Gentle Skin Cleanser', 'brand': 'Cetaphil', 'category': 'Cleanser', 'reason': 'Balanced cleansing for mixed skin zones', 'use': 'AM/PM'},
        {'name': 'Neutrogena Hydro Boost Water Gel', 'brand': 'Neutrogena', 'category': 'Moisturizer', 'reason': 'Hydrates without feeling heavy on oily areas', 'use': 'AM/PM'},
        {'name': 'Paula’s Choice 2% BHA Liquid', 'brand': 'Paula’s Choice', 'category': 'Exfoliant', 'reason': 'Helps congestion, especially around the T-zone', 'use': 'PM 2-3x weekly'}
    ],
    'sensitive': [
        {'name': 'La Roche-Posay Toleriane Dermo-Cleanser', 'brand': 'La Roche-Posay', 'category': 'Cleanser', 'reason': 'Low-irritation cleansing for reactive skin', 'use': 'AM/PM'},
        {'name': 'Avène Cicalfate+ Restorative Cream', 'brand': 'Avène', 'category': 'Moisturizer', 'reason': 'Supports skin barrier repair', 'use': 'PM'},
        {'name': 'EltaMD UV Clear SPF 46', 'brand': 'EltaMD', 'category': 'Sunscreen', 'reason': 'Well-suited to sensitive and acne-prone skin', 'use': 'AM'}
    ],
    'normal': [
        {'name': 'CeraVe PM Facial Moisturizing Lotion', 'brand': 'CeraVe', 'category': 'Moisturizer', 'reason': 'Simple balanced hydration', 'use': 'PM'},
        {'name': 'La Roche-Posay Pure Vitamin C10', 'brand': 'La Roche-Posay', 'category': 'Serum', 'reason': 'Supports brightness and antioxidant protection', 'use': 'AM'},
        {'name': 'Bioderma Sensibio Gel Moussant', 'brand': 'Bioderma', 'category': 'Cleanser', 'reason': 'Gentle maintenance cleanser', 'use': 'AM/PM'}
    ]
}


def serialize_profile(user):
    return {
        'id': user.id,
        'email': user.email,
        'full_name': user.full_name,
        'age': user.age,
        'gender': user.gender,
        'phone': user.phone,
        'date_of_birth': user.date_of_birth.isoformat() if user.date_of_birth else None,
        'height': user.height,
        'weight': user.weight,
        'skin_type': user.skin_type,
        'allergies': user.allergies,
        'medical_records': user.medical_records,
        'profile_completed': user.profile_completed,
    }


@app.errorhandler(404)
def not_found(_):
    return jsonify({'error': 'Endpoint not found'}), 404


@app.errorhandler(500)
def internal_error(_):
    return jsonify({'error': 'Internal server error'}), 500


@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({'error': 'Token has expired'}), 401


@jwt.invalid_token_loader
def invalid_token_callback(error):
    return jsonify({'error': 'Invalid token'}), 401


@jwt.unauthorized_loader
def missing_token_callback(error):
    return jsonify({'error': 'Missing authorization token'}), 401


@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'}), 200


@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json() or {}
        email = (data.get('email') or '').strip().lower()
        password = (data.get('password') or '').strip()
        if not email or not password:
            return jsonify({'error': 'Email and password required'}), 400
        if len(password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters'}), 400
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email already exists'}), 400
        user = User(email=email)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        token = create_access_token(identity=str(user.id))
        return jsonify({'message': 'User registered successfully', 'access_token': token, 'user_id': user.id, 'profile_completed': False}), 201
    except Exception as err:
        db.session.rollback()
        return jsonify({'error': str(err)}), 500


@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json() or {}
        email = (data.get('email') or '').strip().lower()
        password = (data.get('password') or '').strip()
        if not email or not password:
            return jsonify({'error': 'Email and password required'}), 400
        user = User.query.filter_by(email=email).first()
        if not user or not user.check_password(password):
            return jsonify({'error': 'Invalid email or password'}), 401
        token = create_access_token(identity=str(user.id))
        profile_completed = bool(user.profile_completed and user.full_name and user.age and user.gender)
        return jsonify({'access_token': token, 'user_id': user.id, 'profile_completed': profile_completed}), 200
    except Exception as err:
        return jsonify({'error': str(err)}), 500


@app.route('/api/profile', methods=['GET'])
@jwt_required()
def get_profile():
    user = db.session.get(User, int(get_jwt_identity()))
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(serialize_profile(user)), 200


@app.route('/api/profile-setup', methods=['POST'])
@jwt_required()
def profile_setup():
    try:
        user = db.session.get(User, int(get_jwt_identity()))
        if not user:
            return jsonify({'error': 'User not found'}), 404
        data = request.get_json() or {}
        user.full_name = (data.get('full_name') or user.full_name or '').strip() or None
        if data.get('age') not in [None, '']:
            user.age = int(data.get('age'))
        user.phone = (data.get('phone') or user.phone or '').strip() or None
        if data.get('date_of_birth'):
            user.date_of_birth = datetime.datetime.strptime(str(data.get('date_of_birth')), '%Y-%m-%d').date()
            if not user.age:
                user.age = calculate_age_from_dob(user.date_of_birth)
        if data.get('gender'):
            user.gender = str(data.get('gender')).strip().lower()
        if data.get('skin_type'):
            user.skin_type = str(data.get('skin_type')).strip().lower()
        if data.get('height') not in [None, '']:
            user.height = float(data.get('height'))
        if data.get('weight') not in [None, '']:
            user.weight = float(data.get('weight'))
        user.allergies = (data.get('allergies') or '').strip() or None
        user.medical_records = (data.get('medical_records') or '').strip() or None
        user.profile_completed = bool(user.full_name and user.age and user.gender)
        db.session.commit()
        return jsonify({'message': 'Profile setup completed', **serialize_profile(user)}), 200
    except Exception as err:
        db.session.rollback()
        return jsonify({'error': str(err)}), 500


@app.route('/api/analyze-skin', methods=['POST'])
@jwt_required()
def analyze_skin():
    try:
        user_id = int(get_jwt_identity())
        user = db.session.get(User, user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        if 'image' not in request.files:
            return jsonify({'error': 'No image provided'}), 400
        image = request.files['image']
        filename = secure_filename(f"skin_{user_id}_{int(datetime.datetime.utcnow().timestamp())}.jpg")
        path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        image.save(path)
        skin_type, confidence, _ = predict_with_model(path)
        recommendation_data = build_personalized_recommendation(skin_type, user_id)
        recommendation = recommendation_data['base'] + '\n\nRoutine:\n' + '\n'.join(f'- {item}' for item in recommendation_data['routine'])
        analysis = SkinAnalysis(user_id=user_id, skin_type=skin_type, issue=f'Skin type: {skin_type}', recommendation=recommendation, image_path=path, model_confidence=confidence or 0.0)
        db.session.add(analysis)
        db.session.commit()
        if not user.skin_type:
            user.skin_type = skin_type
            db.session.commit()
        return jsonify({'analysis_id': analysis.id, 'skin_type': skin_type, 'model_confidence': confidence or 0.0, 'issue': analysis.issue, 'recommendation': recommendation}), 200
    except Exception as err:
        db.session.rollback()
        return jsonify({'error': str(err)}), 500


@app.route('/api/analysis-history', methods=['GET'])
@jwt_required()
def get_analysis_history():
    user_id = int(get_jwt_identity())
    analyses = SkinAnalysis.query.filter_by(user_id=user_id).order_by(SkinAnalysis.created_at.desc()).limit(20).all()
    return jsonify([{'id': a.id, 'skin_type': a.skin_type, 'issue': a.issue, 'recommendation': a.recommendation, 'model_confidence': a.model_confidence, 'created_at': a.created_at.isoformat()} for a in analyses]), 200


@app.route('/api/analyze-morning-mood', methods=['POST'])
@jwt_required()
def analyze_morning_mood():
    try:
        user_id = int(get_jwt_identity())
        if 'image' not in request.files:
            return jsonify({'error': 'No image provided'}), 400
        image = request.files['image']
        filename = secure_filename(f"morning_{user_id}_{int(datetime.datetime.utcnow().timestamp())}.jpg")
        path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        image.save(path)
        latest_skin = SkinAnalysis.query.filter_by(user_id=user_id).order_by(SkinAnalysis.created_at.desc()).first()
        model_skin_type = latest_skin.skin_type if latest_skin else None
        face_analysis = analyze_morning_mood_with_model(path, model_skin_type=model_skin_type) or {
            'dark_circle_severity': 'mild', 'dark_circle_score': 0.2, 'skin_puffiness': 'none', 'puffiness_score': 0.1,
            'sleep_quality_estimate': 'average', 'estimated_sleep_hours': '5-7 hours', 'morning_mood': 'normal',
            'model_prediction': model_skin_type or 'normal', 'model_confidence': 0.0
        }
        remedies = build_morning_remedies(face_analysis['dark_circle_severity'], face_analysis['skin_puffiness'], face_analysis['morning_mood'], face_analysis['sleep_quality_estimate'], model_skin_type=model_skin_type)
        recommendation = 'Morning Mood Analysis\n\n' + '\n'.join([
            f"Sleep quality: {face_analysis['sleep_quality_estimate']}",
            f"Dark circles: {face_analysis['dark_circle_severity']}",
            f"Puffiness: {face_analysis['skin_puffiness']}",
            f"Mood: {face_analysis['morning_mood']}",
            '',
            'Immediate steps:'
        ] + [f"- {x}" for x in remedies['immediate_steps']] + ['','Skincare routine:'] + [f"- {x}" for x in remedies['skincare_routine']])
        record = MorningMoodAnalysis(user_id=user_id, dark_circle_severity=face_analysis['dark_circle_severity'], skin_puffiness=face_analysis['skin_puffiness'], morning_mood=face_analysis['morning_mood'], sleep_quality_estimate=face_analysis['sleep_quality_estimate'], face_condition=f"Detected {face_analysis['dark_circle_severity']} dark circles and {face_analysis['skin_puffiness']} puffiness", recommendation=recommendation, image_path=path, model_prediction=face_analysis['model_prediction'], model_confidence=face_analysis['model_confidence'])
        db.session.add(record)
        db.session.commit()
        return jsonify({'analysis_id': record.id, **face_analysis, 'recommendation': recommendation, 'remedies': remedies}), 200
    except Exception as err:
        db.session.rollback()
        return jsonify({'error': str(err)}), 500


@app.route('/api/morning-mood-history', methods=['GET'])
@jwt_required()
def get_morning_mood_history():
    user_id = int(get_jwt_identity())
    analyses = MorningMoodAnalysis.query.filter_by(user_id=user_id).order_by(MorningMoodAnalysis.created_at.desc()).limit(30).all()
    return jsonify([{
        'id': a.id,
        'dark_circle_severity': a.dark_circle_severity,
        'skin_puffiness': a.skin_puffiness,
        'morning_mood': a.morning_mood,
        'sleep_quality_estimate': a.sleep_quality_estimate,
        'face_condition': a.face_condition,
        'model_prediction': a.model_prediction,
        'model_confidence': a.model_confidence,
        'recommendation': a.recommendation,
        'created_at': a.created_at.isoformat()
    } for a in analyses]), 200



@app.route('/api/menstrual-settings', methods=['GET', 'POST'])
@jwt_required()
def menstrual_settings():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        return jsonify({'error': 'User not found'}), 404

    if request.method == 'GET':
        return jsonify({
            'cycle_length': user.cycle_length if user.cycle_length is not None else 28,
            'last_period_start': user.last_period_start or '',
            'pms_severity': user.pms_severity or 'Moderate'
        }), 200

    data = request.get_json() or {}

    user.cycle_length = int(data.get('cycle_length', user.cycle_length or 28))
    user.last_period_start = data.get('last_period_start', user.last_period_start or '')
    user.pms_severity = data.get('pms_severity', user.pms_severity or 'Moderate')

    db.session.commit()

    return jsonify({
        'message': 'Menstrual settings saved successfully',
        'cycle_length': user.cycle_length,
        'last_period_start': user.last_period_start,
        'pms_severity': user.pms_severity
    }), 200


@app.route('/api/product-recommendations', methods=['GET'])
@jwt_required()
def product_recommendations():
    user = db.session.get(User, int(get_jwt_identity()))
    if not user:
        return jsonify({'error': 'User not found'}), 404
    latest_analysis = SkinAnalysis.query.filter_by(user_id=user.id).order_by(SkinAnalysis.created_at.desc()).first()
    skin_type = (latest_analysis.skin_type if latest_analysis else user.skin_type or 'normal').lower()
    cycle_day = get_cycle_day(user.last_period_start, user.cycle_length)
    prediction = predict_hormonal_skin_and_mood(cycle_day, user.cycle_length, model_skin_type=skin_type) if cycle_day else None
    phase = prediction['today_phase'] if prediction else 'general'
    products = PRODUCT_BANK.get(skin_type, PRODUCT_BANK['normal'])
    enriched = []
    for item in products:
        reason = item['reason']
        if phase == 'luteal':
            reason += ' Especially helpful in the luteal phase when congestion can increase.'
        elif phase == 'menstrual':
            reason += ' Good for barrier support during the menstrual phase.'
        enriched.append({**item, 'skin_type': skin_type, 'cycle_phase': phase})
    return jsonify({'skin_type': skin_type, 'cycle_phase': phase, 'cycle_day': cycle_day, 'products': enriched}), 200


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', port=5000, debug=True)