from pathlib import Path
import os
import logging
from django.contrib.messages import constants as messages

# .env loader (local dev)
from dotenv import load_dotenv
load_dotenv()

# Optional: dj_database_url for Render/managed DBs
try:
    import dj_database_url
except ImportError:
    dj_database_url = None

# ──────────────────────────────────────────────────────────────────────────────
# Core
# ──────────────────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv("DJANGO_SECRET_KEY")

DEBUG = os.getenv("DEBUG", "false").strip().lower() == "true"

if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True


# ──────────────────────────────────────────────────────────────────────────────
# Domains
# ──────────────────────────────────────────────────────────────────────────────
DEFAULT_ALLOWED = [
    "theenglishstudiocorvetto.onrender.com",
    "theenglishstudiocorvetto.com",
    "www.theenglishstudiocorvetto.com",
    "localhost",
    "127.0.0.1",
]

extra_hosts = [
    h.strip()
    for h in os.getenv("ALLOWED_HOSTS", "").split(",")
    if h.strip()
]

ALLOWED_HOSTS = list({*DEFAULT_ALLOWED, *extra_hosts})

# Allow Codespaces forwarded domain in DEBUG only
if DEBUG:
    codespace_host = os.getenv("CODESPACE_HOST", "").strip()
    if codespace_host:
        ALLOWED_HOSTS.append(codespace_host)
    ALLOWED_HOSTS.append(".app.github.dev")


# Trust Render’s proxy so reset links are HTTPS and hostnames are correct
USE_X_FORWARDED_HOST = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# CSRF trusted origins
DEFAULT_TRUSTED = [
    "https://theenglishstudiocorvetto.com",
    "https://*.onrender.com",
]
ENV_TRUSTED = [
    x
    for x in os.getenv("CSRF_TRUSTED_ORIGINS", "").split(",")
    if x
]
CSRF_TRUSTED_ORIGINS = list({*DEFAULT_TRUSTED, *ENV_TRUSTED})

# ──────────────────────────────────────────────────────────────────────────────
# 3rd-party / project config
# ──────────────────────────────────────────────────────────────────────────────
GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY", "")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    "main",
    "contact",
    "blog",
    # Disable schedule in Codespaces/local preview
    *([] if os.getenv("DISABLE_SCHEDULE", "")
      .lower() == "true" else ["schedule"]),
    "cloudinary",
    "cloudinary_storage",
    "ckeditor",
    "portal.apps.PortalConfig",  # loads signals via AppConfig
    "flyers",
]

LOGIN_REDIRECT_URL = "portal:portal_dashboard"
LOGIN_URL = "/portal/login/"
LOGOUT_REDIRECT_URL = "portal:portal_login"

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",  # before sessions for static
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.locale.LocaleMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
                "config.context_processors.google_maps_api_key",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

MESSAGE_TAGS = {
    messages.DEBUG: "secondary",
    messages.INFO: "info",
    messages.SUCCESS: "success",
    messages.WARNING: "warning",
    messages.ERROR: "danger",
}


# ──────────────────────────────────────────────────────────────────────────────
# Database
# ──────────────────────────────────────────────────────────────────────────────

# 1) Local/dev override (Codespaces etc.)
if os.getenv("USE_SQLITE", "").lower() == "true":
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

# 2) Render / production
elif os.getenv("RENDER") and os.getenv("DATABASE_URL") and dj_database_url:
    DATABASES = {"default": dj_database_url.config(conn_max_age=600)}

# 3) Default local Postgres
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.getenv("DB_NAME"),
            "USER": os.getenv("DB_USER"),
            "PASSWORD": os.getenv("DB_PASSWORD"),
            "HOST": os.getenv("DB_HOST", "localhost"),
            "PORT": os.getenv("DB_PORT", "5432"),
        }
    }

# Safety: refuse dangerous combos
if DEBUG and os.getenv("RENDER"):
    raise RuntimeError("DEBUG=True but RENDER is set. Refusing to run.")
if DEBUG and os.getenv("DATABASE_URL"):
    raise RuntimeError("DEBUG=True but DATABASE_URL is set. Refusing to run.")


# ──────────────────────────────────────────────────────────────────────────────
# Passwords / Auth
# ──────────────────────────────────────────────────────────────────────────────
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "UserAttributeSimilarityValidator"
        )
    },
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "CommonPasswordValidator"
        )
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "NumericPasswordValidator"
        )
    },
]

# ──────────────────────────────────────────────────────────────────────────────
# I18N
# ──────────────────────────────────────────────────────────────────────────────
LANGUAGE_CODE = "en"
LANGUAGES = [("en", "English"), ("it", "Italian")]
LOCALE_PATHS = [BASE_DIR / "locale"]
LANGUAGE_COOKIE_NAME = "django_language"

TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# ──────────────────────────────────────────────────────────────────────────────
# Static / Media
# ──────────────────────────────────────────────────────────────────────────────
STATIC_URL = "/static/"
STATIC_ROOT = (
    BASE_DIR
    / "staticfiles"
)


MEDIA_URL = "/media/"
# MEDIA_ROOT is unused by Cloudinary for user uploads but kept for local dev/
# fallback
MEDIA_ROOT = os.path.join(BASE_DIR, "media")

# Django 5+: storage backends must be configured via STORAGES
STORAGES = {
    # User-uploaded media → Cloudinary
    "default": {
        "BACKEND": "cloudinary_storage.storage.MediaCloudinaryStorage",
    },
    # Collected static files → WhiteNoise
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

WHITENOISE_KEEP_ONLY_HASHED = True

# Cloudinary credentials (use env vars in production)
CLOUDINARY_STORAGE = {
    "CLOUD_NAME": os.getenv("CLOUDINARY_CLOUD_NAME"),
    "API_KEY": os.getenv("CLOUDINARY_API_KEY"),
    "API_SECRET": os.getenv("CLOUDINARY_API_SECRET"),
}

# ──────────────────────────────────────────────────────────────────────────────
# Email (Gmail App Password in prod, console in dev)
# ──────────────────────────────────────────────────────────────────────────────
EMAIL_BACKEND = os.getenv(
    "EMAIL_BACKEND",
    "django.core.mail.backends.console.EmailBackend" if DEBUG
    else "django.core.mail.backends.smtp.EmailBackend"
)

# Gmail SMTP over STARTTLS (port 587)
EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))
EMAIL_HOST_USER = os.getenv(
    "EMAIL_HOST_USER",
    ""
)  # your Gmail/Workspace address
EMAIL_HOST_PASSWORD = os.getenv(
    "EMAIL_HOST_PASSWORD", ""
)    # 16-char Gmail App Password
EMAIL_USE_TLS = os.getenv("EMAIL_USE_TLS", "true").strip().lower() == "true"
EMAIL_USE_SSL = os.getenv("EMAIL_USE_SSL", "false").strip().lower() == "true"

# guard (fail fast if misconfigured)
if EMAIL_USE_TLS and EMAIL_USE_SSL:
    raise RuntimeError("EMAIL_USE_TLS/EMAIL_USE_SSL are mutually exclusive.")

EMAIL_TIMEOUT = int(os.getenv("EMAIL_TIMEOUT", "20"))

# Keep From EXACTLY the authenticated account to avoid DMARC rejections
DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL", EMAIL_HOST_USER)
SERVER_EMAIL = os.getenv("SERVER_EMAIL", DEFAULT_FROM_EMAIL)

# Optional: where contact form should deliver
CONTACT_TO_EMAIL = os.getenv("CONTACT_TO_EMAIL", EMAIL_HOST_USER)

# Safety: don't allow TLS and SSL at the same time
if EMAIL_USE_TLS and EMAIL_USE_SSL:
    raise RuntimeError("Configure either TLS or SSL, not both")


MAILCHIMP_API_KEY = os.getenv("MAILCHIMP_API_KEY", "")
MAILCHIMP_AUDIENCE_ID = os.getenv("MAILCHIMP_AUDIENCE_ID", "")

# ──────────────────────────────────────────────────────────────────────────────
# CKEditor
# ──────────────────────────────────────────────────────────────────────────────
CKEDITOR_CONFIGS = {
    "default": {
        "toolbar": "Custom",
        "toolbar_Custom": [
            [
                "Format", "Bold", "Italic", "Underline"
            ],
            [
                "NumberedList", "BulletedList"
            ],
            [
                "Blockquote"
            ],
            [
                "Link", "Unlink"
            ],
            [
                "RemoveFormat", "Source"
            ],
        ],
        "format_tags": "p;h2;h3;h4;pre",
        "height": 300,
        "width": "auto",
    }
}

# ──────────────────────────────────────────────────────────────────────────────
# Portal owner (env-driven)
# ──────────────────────────────────────────────────────────────────────────────
PORTAL_OWNER_USERNAME = (
    os.environ.get("PORTAL_OWNER_USERNAME", "").strip().lower()
)
PORTAL_OWNER_EMAIL = (
    os.environ.get("PORTAL_OWNER_EMAIL", "").strip().lower()
)

# ──────────────────────────────────────────────────────────────────────────────
# Security / Misc
# ──────────────────────────────────────────────────────────────────────────────
APPEND_SLASH = True

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Logging
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {"console": {"class": "logging.StreamHandler"}},
    "root": {
        "handlers": ["console"],
        "level": "DEBUG" if DEBUG else "WARNING",
    },
    # Optional: uncomment for more mail debugging
    # "loggers": {
    #     "django.core.mail": {"handlers": ["console"], "level": "INFO"},
    #     "smtplib": {"handlers": ["console"], "level": "INFO"},
    # },
}
logger = logging.getLogger(__name__)
