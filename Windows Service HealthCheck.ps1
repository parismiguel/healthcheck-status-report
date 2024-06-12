# Define variables

# URLs of the IIS services to check
$services = @(
    @{ 
        url = "https://qa4.youruprise.com/UserManagement/UserManagementService.svc"; 
        key = "user-management"; 
        name = "User Management"
    },
        @{ 
        url = "https://qa4.youruprise.com/billingtransactions-webapi/swagger/index.html"; 
        key = "billing-api"; 
        name = "Billing Transactions Web API"
    },
    @{ 
        url = "http://your-service-url-2"; 
        key = "service-2"; 
        name = "Service 2"
    }
)

$reportingEndpoint = "http://localhost:3000/report" # Endpoint to report the status
$apiKey = "11053895d41b491f900c9813e8f05115" # API key for authentication
$timeout = 10 # Timeout in seconds for the service check

# Function to check if the service is up
function Test-Service {
    param (
        [string]$url,
        [int]$timeout
    )
    try {
        $response = Invoke-WebRequest -Uri $url -TimeoutSec $timeout -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            return $true
        }
        else {
            return $false
        }
    }
    catch {
        return $false
    }
}

# Function to report status to the endpoint
function Report-Status {
    param (
        [hashtable]$service,
        [bool]$status,
        [string]$reportingUrl,
        [string]$apiKey
    )
    $body = @{
        url = $service.url
        status = $status
        key = $service.key
        name = $service.name
        timestamp = (Get-Date).ToString("o")
    } | ConvertTo-Json

    try {
        Invoke-RestMethod -Uri $reportingUrl -Method Post -ContentType "application/json" -Body $body -Headers @{ "x-api-key" = $apiKey } -ErrorAction Stop | Out-Null
    }
    catch {
        Write-Host "Failed to report status to the endpoint for $($service.name)." -ForegroundColor Red
    }
}

# Iterate over each service, check its status, and report it
foreach ($service in $services) {
    $serviceStatus = Test-Service -url $service.url -timeout $timeout

    # Report the service status
    Report-Status -service $service -status $serviceStatus -reportingUrl $reportingEndpoint -apiKey $apiKey

    # Output the service status for logging purposes
    if ($serviceStatus) {
        Write-Host "$($service.name) is running." -ForegroundColor Green
    }
    else {
        Write-Host "$($service.name) is down." -ForegroundColor Red
    }
}