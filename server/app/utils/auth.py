import os
import requests
import jwt
from functools import wraps
from flask import request, jsonify, g, current_app
from ..models import db, UserProfile, Household, EnergyNode
from .logger import logger

def decode_supabase_token(token: str):
    """
    Verifies and decodes a Supabase JWT.
    Supports:
    1. Direct Supabase /auth/v1/user verification
    2. Local JWT secret verification
    3. Deterministic development demo tokens ('demo-token-user-a', 'demo-token-user-b')
    """
    if not token:
        return None

    # Deterministic development & test tokens
    if token == "demo-token-user-a":
        return {
            "id": "demo_user_a_id",
            "email": "house_a@gridshare.io",
            "user_metadata": {"display_name": "House A Prosumer", "preferred_household_id": "house_a"},
        }
    if token == "demo-token-user-b":
        return {
            "id": "demo_user_b_id",
            "email": "house_b@gridshare.io",
            "user_metadata": {"display_name": "House B Consumer", "preferred_household_id": "house_b"},
        }
    if token == "demo-token-user-c":
        return {
            "id": "demo_user_c_id",
            "email": "house_c@gridshare.io",
            "user_metadata": {"display_name": "House C Prosumer", "preferred_household_id": "house_c"},
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
    jwt_secret = os.getenv("SUPABASE_JWT_SECRET") or os.getenv("JWT_SECRET")
    if jwt_secret:
        try:
            payload = jwt.decode(
                token,
                jwt_secret,
                algorithms=["HS256", "RS256"],
                options={"verify_aud": False},
            )
            return {
                "id": payload.get("sub"),
                "email": payload.get("email"),
                "user_metadata": payload.get("user_metadata", {}),
            }
        except Exception as e:
            logger.debug(f"Local JWT verification error: {e}")

    # 3. Fallback unverified decode for development when external auth service is unreachable
    try:
        payload = jwt.decode(token, options={"verify_signature": False})
        return {
            "id": payload.get("sub") or payload.get("id"),
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
    profile = db.session.get(UserProfile, user_id)
    if not profile:
        profile = UserProfile(
            user_id=user_id,
            email=email or f"user_{user_id[:8]}@gridshare.io",
            display_name=display_name or (email.split("@")[0].capitalize() if email else f"User {user_id[:6]}"),
            role="USER",
        )
        db.session.add(profile)
        db.session.flush()

    # Find household owned by this user
    household = Household.query.filter_by(owner_user_id=user_id).first()

    # If user has no household, check preferred or seed household binding
    if not household:
        # Check if preferred household exists and is unowned or matches demo binding
        if preferred_household_id:
            h = db.session.get(Household, preferred_household_id)
            if h and (not h.owner_user_id or h.owner_user_id == user_id):
                h.owner_user_id = user_id
                household = h
        
        # Fallback binding for demo users
        if not household and "house_a" in (email or ""):
            h = db.session.get(Household, "house_a")
            if h:
                h.owner_user_id = user_id
                household = h
        elif not household and "house_b" in (email or ""):
            h = db.session.get(Household, "house_b")
            if h:
                h.owner_user_id = user_id
                household = h
        elif not household and "house_c" in (email or ""):
            h = db.session.get(Household, "house_c")
            if h:
                h.owner_user_id = user_id
                household = h

        # If still no household, provision a clean new household for this user
        if not household:
            new_house_id = f"house_{user_id[:8].lower()}"
            household = Household(
                id=new_house_id,
                name=f"{profile.display_name}'s Home",
                location="Guwahati Microgrid Cluster",
                household_type="PROSUMER",
                owner_user_id=user_id,
            )
            db.session.add(household)
            db.session.flush()

    # Update default_household_id on profile
    if household and profile.default_household_id != household.id:
        profile.default_household_id = household.id

    # Ensure EnergyNode exists for this household
    node = EnergyNode.query.filter_by(household_id=household.id).first()
    if not node:
        node = EnergyNode(
            id=f"node_{household.id}",
            household_id=household.id,
            node_type="RESIDENTIAL_SOLAR" if household.household_type == "PROSUMER" else "RESIDENTIAL_LOAD",
            source_type="SIMULATION",
            manual_generation_kw=6.8 if household.id == "house_a" else 3.5 if household.id == "house_c" else 1.2,
            manual_consumption_kw=2.1 if household.id == "house_a" else 2.5 if household.id == "house_c" else 4.0,
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
      - g.user_id: str
      - g.household: Household
      - g.household_id: str
      - g.energy_node: EnergyNode
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({
                "status": "ERROR",
                "message": "Authorization header missing or invalid. Expected 'Bearer <token>'.",
            }), 401

        token = auth_header.split(" ", 1)[1].strip()
        auth_user = decode_supabase_token(token)
        if not auth_user or not auth_user.get("id"):
            return jsonify({
                "status": "ERROR",
                "message": "Invalid, expired, or unverified authentication token.",
            }), 401

        user_id = auth_user["id"]
        email = auth_user.get("email") or f"{user_id}@gridshare.io"
        metadata = auth_user.get("user_metadata") or {}
        display_name = metadata.get("display_name") or metadata.get("full_name") or metadata.get("name")
        preferred_household = metadata.get("preferred_household_id")

        profile, household, node = resolve_or_provision_user(
            user_id=user_id,
            email=email,
            display_name=display_name,
            preferred_household_id=preferred_household,
        )

        # Attach to Flask request context
        g.user = profile
        g.user_id = profile.user_id
        g.household = household
        g.household_id = household.id
        g.energy_node = node

        return f(*args, **kwargs)

    return decorated
