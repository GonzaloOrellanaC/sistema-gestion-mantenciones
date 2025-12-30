Param(
    [string]$AtlasPassword
)

# PowerShell script to dump local MongoDB into a directory and restore to Atlas (no gzip/archive)
# Usage: .\backup_and_restore_mongo.ps1 -AtlasPassword "yourpassword"

$ErrorActionPreference = 'Stop'

$LocalMongoUri = $env:LOCAL_MONGO_URI
if (-not $LocalMongoUri) { $LocalMongoUri = 'mongodb://localhost:27017/sistema_gestion' }

$AtlasUser = if ($env:ATLAS_USER) { $env:ATLAS_USER } else { 'gonzalo' }
$AtlasHost = if ($env:ATLAS_HOST) { $env:ATLAS_HOST } else { 'cluster0.sdkklxl.mongodb.net' }
$AtlasDb = if ($env:ATLAS_DB) { $env:ATLAS_DB } else { 'sistema_gestion' }

if (-not $AtlasPassword) {
    if ($env:MONGO_ATLAS_PASSWORD) { $AtlasPassword = $env:MONGO_ATLAS_PASSWORD }
    else {
        Write-Host -NoNewline "Atlas password: "
        $secure = Read-Host -AsSecureString
        $Ptr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
        $AtlasPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($Ptr)
        [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($Ptr)
    }
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$tmpDir = Join-Path -Path (Get-Location) -ChildPath "mongo_backups"
New-Item -ItemType Directory -Path $tmpDir -Force | Out-Null
$dumpDir = Join-Path $tmpDir "mongo_dump_$timestamp"

Write-Host "Creating dump from local MongoDB ($LocalMongoUri) into directory $dumpDir ..."
& mongodump --uri="$LocalMongoUri" --out="$dumpDir"

if ($LASTEXITCODE -ne 0) { Write-Error "mongodump failed"; exit 1 }

$atlasUri = "mongodb+srv://${AtlasUser}:${AtlasPassword}@${AtlasHost}/${AtlasDb}"
# If dump directory contains a nested directory with the same DB name,
# use the parent directory for mongorestore to avoid the "don't know what to do with subdirectory" error.
if (Test-Path (Join-Path $dumpDir $AtlasDb)) {
    $restoreDir = Split-Path -Parent $dumpDir
    Write-Host "Detected nested DB directory. Using parent directory for restore: $restoreDir"
} else {
    $restoreDir = $dumpDir
}

Write-Host "Restoring to Atlas (user: $AtlasUser, host: $AtlasHost) from directory $restoreDir ..."
& mongorestore --uri="$atlasUri" --dir="$restoreDir" --drop

if ($LASTEXITCODE -ne 0) { Write-Error "mongorestore failed"; exit 2 }

Write-Host "Backup directory saved to $dumpDir and restored to Atlas successfully."
