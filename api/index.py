"""
Vercel serverless entry point.

Vercel's @vercel/python builder looks for an ASGI/WSGI callable in this file.
Mangum wraps FastAPI (ASGI) so it runs in a serverless (Lambda-style) context.

lifespan="off" is required because Vercel functions do not support long-running
startup/shutdown hooks. Table creation is handled explicitly below via init_db(),
which is idempotent and safe to call on every cold start.
"""

from mangum import Mangum

# Importing app.main triggers all router and model imports,
# which registers SQLModel metadata before init_db() is called.
from app.main import app
from app.core.database import init_db

# Ensure tables exist on every cold start (safe — create_all is idempotent)
init_db()

# `app` is the name Vercel looks for when detecting a Python ASGI handler
app = Mangum(app, lifespan="off")
