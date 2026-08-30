import os
import jwt
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash

SECRET_KEY = os.getenv("SECRET_KEY")
TOKEN_TTL_DAYS = 7

# Fail loudly at startup rather than returning 500 on every login, signup and
# password reset (the token step is the last thing each of those does).
if not SECRET_KEY:
    raise RuntimeError(
        "SECRET_KEY environment variable is not set. Auth tokens cannot be "
        "signed without it. Set it in the deployment environment "
        "(e.g. `python -c \"import secrets; print(secrets.token_hex(32))\"`)."
    )


def hash_password(password: str) -> str:
    return generate_password_hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return check_password_hash(password_hash, password)


def generate_token(user_id: int) -> str:
    payload = {
        "user_id": user_id,
        "exp": datetime.utcnow() + timedelta(days=TOKEN_TTL_DAYS)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")


def decode_token(token: str) -> int:
    """
    Returns the user_id encoded in the token.
    Raises jwt.PyJWTError (ExpiredSignatureError, InvalidTokenError, ...) on failure.
    """
    payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    return payload["user_id"]
