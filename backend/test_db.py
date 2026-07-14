from database import SessionLocal, engine
import models
import traceback
from sqlalchemy import text

try:
    db = SessionLocal()
    # Test connection
    db.execute(text('SELECT 1'))
    print("DB Connection OK")
    
    # Test NumberSeries
    print(db.query(models.NumberSeries).all())
    print("Query OK")
except Exception as e:
    print("Error:")
    traceback.print_exc()
finally:
    db.close()
