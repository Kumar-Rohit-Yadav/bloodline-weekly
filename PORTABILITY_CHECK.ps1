# Portability Check Script for BloodLife
Write-Host "--- BloodLine Portability Check ---" -ForegroundColor Cyan

$allPass = $true

# 1. Check Node.js
try {
    $nodeVersion = node -v
    Write-Host "[PASS] Node.js is installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] Node.js is NOT installed or not in PATH." -ForegroundColor Red
    $allPass = $false
}

# 2. Check MongoDB (Simple check if reachable on 27017)
try {
    $tcpClient = New-Object System.Net.Sockets.TcpClient
    $tcpClient.Connect("127.0.0.1", 27017)
    Write-Host "[PASS] MongoDB is reachable on localhost:27017" -ForegroundColor Green
    $tcpClient.Close()
} catch {
    Write-Host "[FAIL] MongoDB is NOT reachable on localhost:27017. Ensure MongoDB Service is running." -ForegroundColor Yellow
    # This might not be a hard fail if they use Atlas, but we assume local for this project based on docs.
}

# 3. Check for .env files
$envFiles = @{ "server/.env" = $true; "client/.env" = $false } # True means required
foreach ($file in $envFiles.Keys) {
    if (Test-Path $file) {
        Write-Host "[PASS] Found $file" -ForegroundColor Green
    } else {
        if ($envFiles[$file]) {
            Write-Host "[FAIL] Missing $file" -ForegroundColor Red
            $allPass = $false
        } else {
            Write-Host "[INFO] Missing $file (Optional, using defaults)" -ForegroundColor Gray
        }
    }
}

if ($allPass) {
    Write-Host "`nReady to go! Run 'npm install' in both folders, then 'npm run dev'." -ForegroundColor Cyan
} else {
    Write-Host "`nSome issues found. Please fix them before running the project." -ForegroundColor Red
}
