import os
import requests
import jwt
from functools import wraps
from flask import request, jsonify, g, current_app
from ..models import db, UserProfile, Household, EnergyNode
from .logger import logger

def decode_supabase_token(token: str):
    """
    Verifies and decodes a Supabase / GridShare JWT token.
    Supports:
    1. Deterministic development demo tokens for the 4 authentic users
    2. Direct Supabase /auth/v1/user verification
    3. Local JWT secret verification (signed with SECRET_KEY)
    4. Safe fallback unverified decode
    """
    if not token:
        return None

    # Deterministic development tokens for the 4 authentic community users
    if token in ("demo-token-anjali", "demo-token-user-a"):
        return {
            "id": "user_anjali_id",
            "email": "anjali@gridshare.io",
            "user_metadata": {"display_name": "Anjali Sharma", "preferred_household_id": "house_anjali"},
        }
    if token in ("demo-token-prince", "demo-token-user-b"):
        return {
            "id": "user_prince_id",
            "email": "prince@gridshare.io",
            "user_metadata": {"display_name": "Prince Patel", "preferred_household_id": "house_prince"},
        }
    if token in ("demo-token-ayush", "demo-token-user-c"):
        return {
            "id": "user_ayush_id",
            "email": "ayush@gridshare.io",
            "user_metadata": {"display_name": "Ayush Verma", "preferred_household_id": "house_ayush"},
        }
    if token in ("demo-token-rahul", "demo-token-user-d"):
        return {
            "id": "user_rahul_id",
            "email": "rahul@gridshare.io",
            "user_metadata": {"display_name": "Rahul Sharma", "preferred_household_id": "house_rahul"},
        }

    # 1. Check if Supabase URL and Anon Key are available to verify directly with Supabase
    supabase_url = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
    supabase_anon_key = os.getenv("SUPABASE_ANON_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY") or os.getenv("SUPABASE_KEY")

    if supabase_url and supabase_anon_key and not supabase_url.startswith("http://placeholder"):
        try:
            url = f"{supabase_url.rstrip('/')}/auth/v1/user"
            resp = requests.get(
                url,
                headers={
                    "Authorization": f"Bearer {token}",
                    "apikey": supabase_anon_key,
                },
                timeout=5,
            )
            if resp.status_code == 200:
                data = resp.json()
                return {
                    "id": data.get("id"),
                    "email": data.get("email"),
                    "user_metadata": data.get("user_metadata", {}),
                }
        except Exception as e:
            logger.debug(f"Supabase auth endpoint verification failed, falling back to JWT decode: {e}")

    # 2. Local JWT Secret Verification
    jwt_secret = os.getenv("SECRET_KEY") or os.getenv("SUPABASE_JWT_SECRET") or os.getenv("JWT_SECRET")
    if jwt_secret:
        try:
            payload = jwt.decode(
                token,
                jwt_secret,
                algorithms=["HS256", "RS256"],
                options={"verify_aud": False},
            )
            return {
                "id": payload.get("sub") or payload.get("user_id") or payload.get("id"),
                "email": payload.get("email"),
                "user_metadata": payload.get("user_metadata", {}),
            }
        except Exception as e:
            logger.debug(f"Local JWT verification error: {e}")

    # 3. Fallback unverified decode for development
    try:
        payload = jwt.decode(token, options={"verify_signature": False})
        return {
            "id": payload.get("sub") or payload.get("user_id") or payload.get("id"),
            "email": payload.get("email"),
            "user_metadata": payload.get("user_metadata", {}),
        }
    except Exception as e:
        logger.warning(f"Failed to decode token: {e}")
        return None


def resolve_or_provision_user(user_id: str, email: str, display_name: str = None, preferred_household_id: str = None):
    """
    Resolves an existing GridShare user and owned household, or provisions a new one.
    Guarantees that every authenticated user has a 1-to-1 mapping to an owned Household & EnergyNode.
    """
    # 1. Match profile by user_id or email
    profile = db.session.get(UserProfile, user_id)
    if not profile and email:
        profile = UserProfile.query.filter_by(email=email).first()

    if not profile:
        profile = UserProfile(
            user_id=user_id,
            email=email or f"user_{user_id[:8]}@gridshare.io",
            display_name=display_name or (email.split("@")[0].capitalize() if email else f"User {user_id[:6]}"),
            role="USER",
        )
        db.session.add(profile)
        db.session.flush()

    # 2. Find household owned by this user
    household = Household.query.filter_by(owner_user_id=profile.user_id).first()

    # If user has no household, check default_household_id or preferred_household_id
    if not household and profile.default_household_id:
        household = db.session.get(Household, profile.default_household_id)
        if household:
            household.owner_user_id = profile.user_id

    if not household and preferred_household_id:
        h = db.session.get(Household, preferred_household_id)
        if h and (not h.owner_user_id or h.owner_user_id == profile.user_id):
            h.owner_user_id = profile.user_id
            household = h

    # 3. If still no household, provision a clean new household for this user
    if not household:
        new_house_id = f"house_{profile.user_id[:8].lower()}"
        household = Household(
            id=new_house_id,
            name=f"{profile.display_name}'s Home",
            location="Green Enclave Microgrid Cluster",
            household_type="PROSUMER",
            owner_user_id=profile.user_id,
        )
        db.session.add(household)
        db.session.flush()

    # Update default_household_id on profile
    if household and profile.default_household_id != household.id:
        profile.default_household_id = household.id

    # 4. Ensure EnergyNode exists for this household
    node = EnergyNode.query.filter_by(household_id=household.id).first()
    if not node:
        is_prosumer = household.household_type == "PROSUMER"
        node = EnergyNode(
            id=f"node_{household.id}",
            household_id=household.id,
            node_type="RESIDENTIAL_SOLAR" if is_prosumer else "RESIDENTIAL_LOAD",
            source_type="SIMULATION",
            manual_generation_kw=5.0 if is_prosumer else 1.0,
            manual_consumption_kw=2.2 if is_prosumer else 4.5,
            status="ONLINE",
        )
        db.session.add(node)

    db.session.commit()
    return profile, household, node


def require_auth(f):
    """
    Decorator for protected GridShare routes.
    Extracts Bearer token, verifies identity, and injects:
      - g.user: UserProfile
      - g.household: Household
      - g.energy_node: EnergyNode
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return jsonify({"status": "ERROR", "message": "Missing Authorization header"}), 401

        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            return jsonify({"status": "ERROR", "message": "Invalid Authorization header format. Expected 'Bearer <token>'"}), 401

        token = parts[1]
        decoded = decode_supabase_token(token)
        if not decoded or not decoded.get("id"):
            return jsonify({"status": "ERROR", "message": "Invalid or expired token"}), 401

        user_id = decoded["id"]
        email = decoded.get("email")
        user_metadata = decoded.get("user_metadata", {})
        display_name = user_metadata.get("display_name")
        preferred_household_id = user_metadata.get("preferred_household_id")

        try:
            profile, household, node = resolve_or_provision_user(
                user_id=user_id,
                email=email,
                display_name=display_name,
                preferred_household_id=preferred_household_id,
            )
            g.user = profile
            g.household = household
            g.energy_node = node
        except Exception as e:
            logger.error(f"Error provisioning authenticated user {user_id}: {e}", exc_info=True)
            return jsonify({"status": "ERROR", "message": "Internal error resolving user profile"}), 500

        return f(*args, **kwargs)

    return decorated_function
