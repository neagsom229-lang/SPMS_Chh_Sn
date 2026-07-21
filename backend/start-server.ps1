# start-server.ps1
Write-Host "🚀 Starting SPMS Backend..." -ForegroundColor Cyan

# Set environment
$env:NODE_ENV = "development"
$env:DB_PATH = "D:\DSA_Y2_S2_for_Assighment_HW_and_Lesson\spms-dashboard\spms-dashboard\database\spms.accdb"

# Check if database exists
if (Test-Path $env:DB_PATH) {
    Write-Host "✅ Database found: $env:DB_PATH" -ForegroundColor Green
} else {
    Write-Host "❌ Database NOT found!" -ForegroundColor Red
}

# Start server
Write-Host "🔄 Starting server..." -ForegroundColor Yellow
npm run dev