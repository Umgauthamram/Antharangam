from flask import current_app
from pymongo import MongoClient

class DB:
    """Singleton-like class for managing the MongoDB connection."""
    def __init__(self):
        self._client = None
        self._db = None

    def init_app(self, app):
        """Initializes the database connection using app config."""
        self._client = MongoClient(app.config['MONGO_URI'])
        self._db = self._client[app.config['DB_NAME']]

    @property
    def posts(self):
        """Returns the 'posts' collection."""
        return self._db.posts
    
    @property
    def cases(self):
        """Returns the 'cases' collection."""
        return self._db.cases

db = DB()