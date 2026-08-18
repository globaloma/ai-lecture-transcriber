import os
import requests

SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_STORAGE_BUCKET = os.getenv("SUPABASE_STORAGE_BUCKET", "lecture-uploads")


def _object_url(object_name: str) -> str:
    return f"{SUPABASE_URL}/storage/v1/object/{SUPABASE_STORAGE_BUCKET}/{object_name}"


def _public_url(object_name: str) -> str:
    return f"{SUPABASE_URL}/storage/v1/object/public/{SUPABASE_STORAGE_BUCKET}/{object_name}"


def upload_to_storage(local_path: str, object_name: str) -> str:
    """
    Uploads a local file to the Supabase Storage bucket.
    Returns the public URL for the uploaded object.
    """
    with open(local_path, "rb") as f:
        response = requests.post(
            _object_url(object_name),
            headers={
                "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
                "x-upsert": "true"
            },
            data=f
        )
    response.raise_for_status()
    return _public_url(object_name)


def delete_from_storage(object_name: str) -> None:
    """
    Deletes an object from the Supabase Storage bucket.
    Safe to call even if the object doesn't exist.
    """
    response = requests.delete(
        _object_url(object_name),
        headers={"Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}"}
    )
    if response.status_code not in (200, 204, 404):
        response.raise_for_status()
