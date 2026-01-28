$body = @{
    email = "tm1@dm1.com"
    password = "tm@123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -ContentType "application/json" -Body $body
    if ($response.token) {
        Write-Host "✅ TM LOGIN SUCCESS"
        Write-Host "Token:" $response.token.Substring(0, 20) "..."
        Write-Host "Role:" $response.user.role
    } else {
        Write-Host "❌ Error:" $response.error
    }
} catch {
    Write-Host "❌ Request failed:"
    Write-Host $_.Exception.Message
}

# Test driver login
$bodyDriver = @{
    email = "driver1@tm1.com"
    password = "driver@123"
} | ConvertTo-Json

try {
    $response2 = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -ContentType "application/json" -Body $bodyDriver
    if ($response2.token) {
        Write-Host ""
        Write-Host "✅ DRIVER LOGIN SUCCESS"
        Write-Host "Token:" $response2.token.Substring(0, 20) "..."
        Write-Host "Role:" $response2.user.role
    } else {
        Write-Host ""
        Write-Host "❌ Driver error:" $response2.error
    }
} catch {
    Write-Host ""
    Write-Host "❌ Driver request failed:"
    Write-Host $_.Exception.Message
}
