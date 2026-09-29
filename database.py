"""
TRAIN IN APP — Database Connection & Query Utility
College Project Prototype
"""

import os
import mysql.connector
from mysql.connector import Error

def get_db_connection():
    """Establish and return MySQL database connection."""
    try:
        connection = mysql.connector.connect(
            host=os.getenv("MYSQL_HOST", "localhost"),
            user=os.getenv("MYSQL_USER", "root"),
            password=os.getenv("MYSQL_PASSWORD", "password"),
            database=os.getenv("MYSQL_DATABASE", "train_in_app"),
            port=int(os.getenv("MYSQL_PORT", 3306))
        )
        return connection
    except Error as e:
        print(f"Warning: MySQL connection error: {e}. (Using in-memory mock fallback if offline)")
        return None
