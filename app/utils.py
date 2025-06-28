from werkzeug.security import generate_password_hash, check_password_hash

def hash_password(password):
    """
    Hash plain password pakai Werkzeug.
    """
    return generate_password_hash(password)

def verify_password(password, hashed):
    """
    Verifikasi password input terhadap hash di database.
    """
    return check_password_hash(hashed, password)
