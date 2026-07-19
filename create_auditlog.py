import sqlite3
import os

print("🔄 Creating tbl_auditlog table...")

# Database path
db_path = "database/spms.db"

# Check if database exists
if not os.path.exists(db_path):
    print("❌ Database not found at:", db_path)
    print("📁 Please make sure the database exists")
    exit(1)

# Connect to database
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Create audit log table
try:
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS tbl_auditlog (
        audit_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        action TEXT,
        table_name TEXT,
        record_id INTEGER,
        old_value TEXT,
        new_value TEXT,
        action_date DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # Create stock_log table if missing
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS tbl_stock_log (
        log_id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER,
        transaction_type TEXT,
        qty_change INTEGER,
        stock_before INTEGER,
        stock_after INTEGER,
        reference_id INTEGER,
        log_date DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # Create orders_details table if missing
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS tbl_orders_details (
        detail_id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER,
        product_id INTEGER,
        qty INTEGER,
        unit_price REAL,
        discount REAL DEFAULT 0,
        subtotal REAL
    )
    ''')
    
    conn.commit()
    print("✅ Tables created successfully!")
    print("   - tbl_auditlog")
    print("   - tbl_stock_log")  
    print("   - tbl_orders_details")
    
except Exception as e:
    print("❌ Error creating tables:", e.message)
    conn.rollback()

conn.close()
print("✅ Done!")