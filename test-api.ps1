# test-api.ps1
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   TESTING SPMS BACKEND API" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$BASE_URL = "https://spms-chh-sn.onrender.com"

# 1. Test Root
Write-Host "1. Testing Root Endpoint..." -ForegroundColor Yellow
curl $BASE_URL/
Write-Host "`n"

# 2. Test API Health
Write-Host "2. Testing API Health..." -ForegroundColor Yellow
curl $BASE_URL/api/test
Write-Host "`n"

# 3. Test Login
Write-Host "3. Testing Login..." -ForegroundColor Yellow
$loginBody = @{username="admin"; password="admin123"} | ConvertTo-Json
curl -X POST $BASE_URL/api/auth/login -H "Content-Type: application/json" -d $loginBody
Write-Host "`n"

# 4. Test Get Products
Write-Host "4. Testing Get Products..." -ForegroundColor Yellow
curl $BASE_URL/api/products
Write-Host "`n"

Write-Host "========================================" -ForegroundColor Green
Write-Host "   ALL TESTS COMPLETED!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green