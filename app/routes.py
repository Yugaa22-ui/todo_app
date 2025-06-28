from flask import Blueprint, request, jsonify
from app.models import get_connection
from app.utils import hash_password, verify_password

bp = Blueprint("api", __name__)

# Tes endpoint
@bp.route("/", methods=["GET"])
def index():
    return jsonify({"message": "To-Do API is running"})

# Endpoint Register User
@bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"error": "Username and password required"}), 400

    password_hashed = hash_password(password)

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            # Cek apakah username sudah ada
            cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
            existing = cursor.fetchone()
            if existing:
                return jsonify({"error": "Username already exists"}), 400

            # Insert user baru
            cursor.execute(
                "INSERT INTO users (username, password_hash) VALUES (%s, %s)",
                (username, password_hashed)
            )
            conn.commit()
        return jsonify({"message": "User registered successfully"}), 201
    finally:
        conn.close()

# Endpoint Login User
@bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"error": "Username and password required"}), 400

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT id, password_hash FROM users WHERE username = %s",
                (username,)
            )
            user = cursor.fetchone()
            if not user or not verify_password(password, user["password_hash"]):
                return jsonify({"error": "Invalid username or password"}), 401

            return jsonify({"message": "Login successful", "user_id": user["id"]})
    finally:
        conn.close()
