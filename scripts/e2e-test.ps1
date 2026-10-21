# ---------------------------------------------------------------------------
# End-to-end test that mimics exactly what the React frontend does:
#   - CORS pre-flight (OPTIONS) from the Vite dev server origin
#   - Register  (POST /api/register)
#   - Login     (POST /api/login)      -> stores the JWT
#   - Home      (GET  /api/home)       -> sends "Authorization: Bearer <jwt>"
#   - Logout    -> the frontend clears the token, so /api/home must fail again
#
# It also checks that the Vite dev server serves the SPA for /register,
# /login and /home (history fallback) and that the built bundle contains the
# configured API base URL.
#
#   powershell -ExecutionPolicy Bypass -File scripts/e2e-test.ps1
# ---------------------------------------------------------------------------

param(
    [string]$ApiUrl = "http://localhost:8080",
    [string]$AppUrl = "http://127.0.0.1:5173",
    [string]$Origin = "http://127.0.0.1:5173"
)

$pass = 0
$fail = 0

function Assert-True {
    param([string]$Name, [bool]$Condition, [string]$Detail = "")
    if ($Condition) {
        Write-Host ("[PASS] {0,-56}" -f $Name) -ForegroundColor Green
        $script:pass++
    } else {
        Write-Host ("[FAIL] {0,-56} {1}" -f $Name, $Detail) -ForegroundColor Red
        $script:fail++
    }
}

function Invoke-Api {
    param(
        [string]$Path,
        [string]$Method = "GET",
        $Body = $null,
        [hashtable]$Headers = @{},
        [string]$OriginHeader = ""
    )
    $h = $Headers.Clone()
    if ($OriginHeader) { $h["Origin"] = $OriginHeader }

    try {
        $params = @{
            Uri             = "$ApiUrl$Path"
            Method          = $Method
            Headers         = $h
            UseBasicParsing = $true
        }
        if ($null -ne $Body) {
            $params["ContentType"] = "application/json"
            $params["Body"] = $Body | ConvertTo-Json -Depth 5
        }
        $response = Invoke-WebRequest @params
        return @{ Status = [int]$response.StatusCode; Content = $response.Content; Headers = $response.Headers }
    } catch [System.Net.WebException] {
        $status = 0; $content = ""; $respHeaders = $null
        if ($_.Exception.Response) {
            $status = [int]$_.Exception.Response.StatusCode
            $respHeaders = $_.Exception.Response.Headers
            $stream = $_.Exception.Response.GetResponseStream()
            if ($stream) {
                $reader = New-Object System.IO.StreamReader($stream)
                $content = $reader.ReadToEnd()
                $reader.Close()
            }
        }
        return @{ Status = $status; Content = $content; Headers = $respHeaders }
    }
}

Write-Host "`n=== RegLog end-to-end test (frontend <-> backend) ===" -ForegroundColor Cyan
Write-Host "API : $ApiUrl" -ForegroundColor Cyan
Write-Host "App : $AppUrl" -ForegroundColor Cyan
Write-Host "Origin: $Origin`n" -ForegroundColor Cyan

# ---------------------------------------------------------------------------
# 1. CORS pre-flight for the registration call
# ---------------------------------------------------------------------------
Write-Host "-- CORS --" -ForegroundColor Yellow
$preflight = Invoke-WebRequest -Uri "$ApiUrl/api/register" -Method OPTIONS `
    -Headers @{ Origin = $Origin; "Access-Control-Request-Method" = "POST"; "Access-Control-Request-Headers" = "content-type" } `
    -UseBasicParsing -ErrorAction SilentlyContinue
Assert-True "CORS pre-flight allows the frontend origin" ($preflight.StatusCode -eq 200) "got $($preflight.StatusCode)"
$acao = $preflight.Headers["Access-Control-Allow-Origin"]
Assert-True "CORS returns Access-Control-Allow-Origin" ($acao -eq $Origin) "got '$acao'"

# ---------------------------------------------------------------------------
# 2. Register
# ---------------------------------------------------------------------------
Write-Host "`n-- Register --" -ForegroundColor Yellow
$email = "e2e$([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())@example.com"
$password = "Password@123"

$register = Invoke-Api -Path "/api/register" -Method POST -OriginHeader $Origin -Body @{
    username        = "Brijesh"
    email           = $email
    password        = $password
    confirmPassword = $password
    mobileNumber    = "9876543210"
}
Assert-True "Register returns 201 Created" ($register.Status -eq 201) "got $($register.Status)"
$registerJson = $register.Content | ConvertFrom-Json
Assert-True "Register returns the created user" ($null -ne $registerJson.user) "no user in response"
Assert-True "Register response contains no password" (-not ($registerJson.user.PSObject.Properties.Name -contains "password"))

# ---------------------------------------------------------------------------
# 3. Login
# ---------------------------------------------------------------------------
Write-Host "`n-- Login --" -ForegroundColor Yellow
$login = Invoke-Api -Path "/api/login" -Method POST -OriginHeader $Origin -Body @{
    email    = $email
    password = $password
}
Assert-True "Login returns 200 OK" ($login.Status -eq 200) "got $($login.Status)"

$token = $null
$loginJson = $login.Content | ConvertFrom-Json
if ($loginJson.token) { $token = $loginJson.token }
Assert-True "Login returns a JWT" (-not [string]::IsNullOrWhiteSpace($token))
Assert-True "JWT has three base64url segments" (($token -split '\.').Count -eq 3)
Assert-True "Login response contains no password" (-not ($loginJson.user.PSObject.Properties.Name -contains "password"))
Assert-True "Login response carries the CORS header" ($login.Headers["Access-Control-Allow-Origin"] -eq $Origin)

# The JWT payload must not contain the password.
$payloadSegment = ($token -split '\.')[1].Replace('-', '+').Replace('_', '/')
switch ($payloadSegment.Length % 4) { 2 { $payloadSegment += '==' } 3 { $payloadSegment += '=' } }
$decodedPayload = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($payloadSegment))
Assert-True "JWT payload does not contain the password" (-not $decodedPayload.Contains($password))
Assert-True "JWT payload does not contain a password hash" (-not $decodedPayload.Contains('$2a$'))
Write-Host ("       JWT payload: {0}" -f $decodedPayload) -ForegroundColor DarkGray

# ---------------------------------------------------------------------------
# 4. Protected home endpoint
# ---------------------------------------------------------------------------
Write-Host "`n-- Protected /api/home --" -ForegroundColor Yellow
$noToken = Invoke-Api -Path "/api/home" -Method GET -OriginHeader $Origin
Assert-True "GET /api/home without token returns 401" ($noToken.Status -eq 401) "got $($noToken.Status)"

$badToken = Invoke-Api -Path "/api/home" -Method GET -OriginHeader $Origin -Headers @{ Authorization = "Bearer invalid.token.here" }
Assert-True "GET /api/home with invalid token returns 401" ($badToken.Status -eq 401) "got $($badToken.Status)"

$homeResponse = Invoke-Api -Path "/api/home" -Method GET -OriginHeader $Origin -Headers @{ Authorization = "Bearer $token" }
Assert-True "GET /api/home with valid token returns 200" ($homeResponse.Status -eq 200) "got $($homeResponse.Status)"
$homeJson = $homeResponse.Content | ConvertFrom-Json
Assert-True "Home response says 'Welcome to Our Home!'" ($homeJson.message -eq "Welcome to Our Home!") "got '$($homeJson.message)'"
Assert-True "Home response contains the logged-in user" ($homeJson.user.email -eq $email) "got '$($homeJson.user.email)'"

# ---------------------------------------------------------------------------
# 5. Logout -> the frontend clears the token, the API must reject it again
# ---------------------------------------------------------------------------
Write-Host "`n-- Logout --" -ForegroundColor Yellow
$afterLogout = Invoke-Api -Path "/api/home" -Method GET -OriginHeader $Origin
Assert-True "After logout (no token sent) /api/home returns 401" ($afterLogout.Status -eq 401) "got $($afterLogout.Status)"

# ---------------------------------------------------------------------------
# 6. The Vite dev server must serve the SPA for every route
# ---------------------------------------------------------------------------
Write-Host "`n-- Frontend dev server --" -ForegroundColor Yellow
foreach ($route in @("/", "/register", "/login", "/home")) {
    try {
        $page = Invoke-WebRequest -Uri "$AppUrl$route" -UseBasicParsing -ErrorAction Stop
        $hasRoot = $page.Content -match 'id="root"'
        Assert-True "Dev server serves $route (history fallback)" ($page.StatusCode -eq 200 -and $hasRoot) "status $($page.StatusCode)"
    } catch {
        Assert-True "Dev server serves $route (history fallback)" $false $_.Exception.Message
    }
}

# The main entry module and the source files must be reachable.
try {
    $main = Invoke-WebRequest -Uri "$AppUrl/src/main.jsx" -UseBasicParsing -ErrorAction Stop
    Assert-True "Dev server transforms /src/main.jsx" ($main.Content -match "createRoot") "unexpected content"
} catch {
    Assert-True "Dev server transforms /src/main.jsx" $false $_.Exception.Message
}

try {
    $api = Invoke-WebRequest -Uri "$AppUrl/src/services/api.js" -UseBasicParsing -ErrorAction Stop
    Assert-True "api.js is served with the VITE_API_BASE_URL default" ($api.Content -match "VITE_API_BASE_URL") "unexpected content"
} catch {
    Assert-True "api.js is served with the VITE_API_BASE_URL default" $false $_.Exception.Message
}

Write-Host "`n=== Result: $pass passed, $fail failed ===" -ForegroundColor Cyan
if ($fail -gt 0) { exit 1 }

