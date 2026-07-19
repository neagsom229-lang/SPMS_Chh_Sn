import sqlite3

conn = sqlite3.connect('database/spms.db')
cursor = conn.cursor()

# Get all tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()

print("=" * 60)
print("📊 DATABASE SCHEMA ANALYSIS")
print("=" * 60)

for table in tables:
    table_name = table[0]
    print(f"\n📁 Table: {table_name}")
    print("-" * 40)
    
    # Get column info
    cursor.execute(f"PRAGMA table_info({table_name})")
    columns = cursor.fetchall()
    
    print("Columns:")
    for col in columns:
        print(f"  - {col[1]} ({col[2]})")
    
    # Get sample data
    cursor.execute(f"SELECT * FROM {table_name} LIMIT 3")
    rows = cursor.fetchall()
    
    if rows:
        print(f"\nSample Data ({len(rows)} rows):")
        for row in rows:
            print(f"  {row}")
    else:
        print("\n  (No data)")

conn.close()
print("\n" + "=" * 60)
print("✅ Analysis complete!")