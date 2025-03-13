from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token
from datetime import timedelta

bcrypt = Bcrypt()

def hash_password(password):
    return bcrypt.generate_password_hash(password).decode('utf-8')

def check_password(hashed_password, plain_password):
    return bcrypt.check_password_hash(hashed_password, plain_password)

def generate_jwt(identity):
    return create_access_token(identity=identity, expires_delta=timedelta(days=1))