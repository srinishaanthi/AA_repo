import os
from sqlalchemy import create_engine, inspect, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:1797@localhost/logistics_db")
engine = create_engine(DATABASE_URL)

def run_migration():
    inspector = inspect(engine)
    columns_in_invoices = [c['name'] for c in inspector.get_columns('invoices')]
    
    new_columns = {
        "customer_contact_person": "VARCHAR",
        "lr_date": "VARCHAR",
        "consignor_name": "VARCHAR",
        "consignee_name": "VARCHAR",
        "material_description": "TEXT",
        "no_of_packages": "VARCHAR",
        "actual_weight": "VARCHAR",
        "chargeable_weight": "VARCHAR",
        "unloading_charge": "DOUBLE PRECISION DEFAULT 0.0",
        "halting_charge": "DOUBLE PRECISION DEFAULT 0.0",
        "detention_charge": "DOUBLE PRECISION DEFAULT 0.0",
        "customer_state": "VARCHAR",
    }
    
    with engine.connect() as conn:
        for col, col_type in new_columns.items():
            if col not in columns_in_invoices:
                print(f"Adding column '{col}' to table 'invoices'...")
                conn.execute(text(f"ALTER TABLE invoices ADD COLUMN {col} {col_type}"))
                conn.commit()
                print(f"Column '{col}' added successfully.")
            else:
                print(f"Column '{col}' already exists in 'invoices'.")
                
    print("Migration completed successfully!")

if __name__ == "__main__":
    run_migration()
