import base64
import io

from PIL import Image


def decode_base64_image(data: str) -> bytes:
    """Strip optional data URI prefix and decode base64 to bytes."""
    if "," in data:
        data = data.split(",", 1)[1]
    return base64.b64decode(data)


def get_media_type(image_bytes: bytes) -> str:
    """Detect JPEG or PNG from magic bytes."""
    if image_bytes[:3] == b"\xff\xd8\xff":
        return "image/jpeg"
    if image_bytes[:8] == b"\x89PNG\r\n\x1a\n":
        return "image/png"
    # Default to JPEG
    return "image/jpeg"


def resize_image(image_bytes: bytes, max_width: int = 1024) -> bytes:
    """Resize image so width <= max_width, preserving aspect ratio.
    Always returns JPEG or PNG bytes — unknown formats (WebP, GIF, etc.) are
    normalized to JPEG so the vision model always receives a supported type.
    """
    img = Image.open(io.BytesIO(image_bytes))

    is_png = image_bytes[:8] == b"\x89PNG\r\n\x1a\n"
    out_fmt = "PNG" if is_png else "JPEG"

    needs_resize = img.width > max_width
    # Unknown format (not JPEG/PNG) always needs re-encoding even if small
    is_known_format = image_bytes[:3] == b"\xff\xd8\xff" or is_png
    needs_reencode = not is_known_format

    if not needs_resize and not needs_reencode:
        return image_bytes

    if needs_resize:
        ratio = max_width / img.width
        new_height = int(img.height * ratio)
        img = img.resize((max_width, new_height), Image.LANCZOS)

    if out_fmt == "JPEG" and img.mode in ("RGBA", "P"):
        img = img.convert("RGB")

    output = io.BytesIO()
    img.save(output, format=out_fmt, quality=85)
    return output.getvalue()


def encode_to_base64(image_bytes: bytes) -> str:
    """Encode bytes to base64 string (no data URI prefix)."""
    return base64.b64encode(image_bytes).decode("utf-8")
