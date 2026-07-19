import sqlite3
import csv
import os
from pathlib import Path

print("🔄 Starting Access to SQLite import...")

# Paths - UPDATE THIS TO YOUR FOLDER
access_csv_folder = "C:/Users/samnang/OneDrive/Music/Documents/"
sqlite_db_path = "database/spms.db"

# Make sure the database folder exists
os.makedirs(os.path.dirname(sqlite_db_path), exist_ok=True)

# Connect to SQLite
conn = sqlite3.connect(sqlite_db_path)
cursor = conn.cursor()

# Get all CSV files from Access export
csv_files = [f for f in os.listdir(access_csv_folder) if f.endswith('.csv')]

if not csv_files:
    print("❌ No CSV files found in:", access_csv_folder)
    print("📁 Please export your Access tables to CSV first.")
    print("   Export to: C:/Users/samnang/OneDrive/Music/Documents/")
    exit()

print(f"📁 Found {len(csv_files)} CSV files")

for csv_file in csv_files:
    table_name = os.path.splitext(csv_file)[0].lower()
    print(f"📥 Importing {table_name}...")
    
    try:
        with open(os.path.join(access_csv_folder, csv_file), 'r', encoding='utf-8-sig') as f:
            reader = csv.reader(f)
            headers = next(reader)  # Get column headers
            
            # Clean up column names (remove spaces, special chars)
            clean_headers = []
            for h in headers:
                # Replace spaces and special characters
                clean = h.strip().replace(' ', '_').replace('#', '').replace('!', '')
                if clean == '':
                    clean = 'column_' + str(len(clean_headers))
                clean_headers.append(clean)
            
            # Create table
            columns = ', '.join([f'"{h}" TEXT' for h in clean_headers])
            cursor.execute(f'DROP TABLE IF EXISTS {table_name}')
            cursor.execute(f'CREATE TABLE {table_name} ({columns})')
            
            # Insert data
            inserted = 0
            for row in reader:
                # Make sure row has same number of columns
                while len(row) < len(clean_headers):
                    row.append('')  # Add empty values for missing columns
                placeholders = ', '.join(['?' for _ in clean_headers])
                cursor.execute(f'INSERT INTO {table_name} VALUES ({placeholders})', row[:len(clean_headers)])
                inserted += 1
            
            print(f'✅ Imported {table_name}: {inserted} rows, {len(clean_headers)} columns')
            
    except Exception as e:
        print(f'❌ Error importing {csv_file}: {e}')

# Commit and close
conn.commit()
conn.close()

print('')
print('✅ Database conversion complete!')
print(f'📁 Database saved to: {sqlite_db_path}')
print('')
print('🚀 Now run:')
print('   cd backend')
print('   node server.js')