import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Loads configuration from environment variables."""
    MONGO_URI = os.getenv('MONGO_URI')
    DB_NAME = os.getenv('DB_NAME')