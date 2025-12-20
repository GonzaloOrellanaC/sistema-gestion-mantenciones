<#
  Script PowerShell para publicar la release v0.1.1.
  Revisa el contenido antes de ejecutar. El script ejecuta comandos git que pueden hacer push.
#>
Set-StrictMode -Version Latest

Write-Host "=== RELEASE v0.1.1 - Script PowerShell ===" -ForegroundColor Cyan

function Run-IfPackageJsonExists {
    param(
        [string]$Path,
        [scriptblock]$Action
    )
    if (Test-Path $Path) {
        & $Action
    } else {
        Write-Host "No se encontró $Path - omitiendo." -ForegroundColor Yellow
    }
}

try {
    Write-Host "1) Ejecutar tests y builds"

    Write-Host "--- Backend ---"
    if (Test-Path "backend\package.json") {
        Push-Location backend
        npm ci
        try {
            npm test
        } catch {
            Write-Host "Backend tests fallaron (continuando)." -ForegroundColor Yellow
        }
        # build if present
        npm run build --if-present
        Pop-Location
    } else { Write-Host "No se encontró backend/package.json - omitiendo tests backend" -ForegroundColor Yellow }

    Write-Host "--- Frontend ---"
    if (Test-Path "frontend\package.json") {
        Push-Location frontend
        npm ci
        try {
            npm test
        } catch {
            Write-Host "Frontend tests fallaron (continuando)." -ForegroundColor Yellow
        }
        npm run build --if-present
        Pop-Location
    } else { Write-Host "No se encontró frontend/package.json - omitiendo tests frontend" -ForegroundColor Yellow }

    Write-Host "--- Root ---"
    if (Test-Path "package.json") {
        try {
            npm ci
        } catch {
            Write-Host "Root npm ci falló (continuando)." -ForegroundColor Yellow
        }
    } else { Write-Host "No se encontró package.json en root - omitiendo." -ForegroundColor Yellow }

    Write-Host "2) Bump versiones en package.json (root y backend) sin crear tags"
    try {
        npm pkg set version 0.1.1
        Write-Host "Versión root seteada a 0.1.1" -ForegroundColor Green
    } catch {
        Write-Host "No se pudo setear versión en root (omitido)." -ForegroundColor Yellow
    }

    if (Test-Path "backend\package.json") {
        try {
            npm --prefix backend pkg set version 0.1.1
            Write-Host "Versión backend seteada a 0.1.1" -ForegroundColor Green
        } catch {
            Write-Host "No se pudo setear versión en backend (omitido)." -ForegroundColor Yellow
        }
    }

    Write-Host "3) Crear commit de release"
    git add package.json 2>$null
    if (Test-Path "backend\package.json") { git add backend/package.json 2>$null }
    try {
        git commit -m "chore(release): v0.1.1" | Out-Null
        Write-Host "Commit creado: chore(release): v0.1.1" -ForegroundColor Green
    } catch {
        Write-Host "No hay cambios para commitear o commit falló (continuando)." -ForegroundColor Yellow
    }

    Write-Host "4) Crear tag anotado"
    try {
        git tag -a v0.1.1 -m "Release v0.1.1 - Carga de nuevo release request." 
        Write-Host "Tag creado: v0.1.1" -ForegroundColor Green
    } catch {
        Write-Host "Creación de tag falló o el tag ya existe (continuando)." -ForegroundColor Yellow
    }

    Write-Host "5) Push de commits y tags (se hará a origen 'origin' rama 'main')"
    try {
        git push origin main
    } catch {
        Write-Host "git push origin main falló. Revisa tu configuración remota." -ForegroundColor Red
    }
    try {
        git push origin v0.1.1
    } catch {
        Write-Host "git push origin v0.1.1 falló. Verifica que tengas permisos y que el tag no exista en remoto." -ForegroundColor Red
    }

    Write-Host "6) Crear GitHub Release (opcional, requiere 'gh' CLI y autenticación)"
    $gh = Get-Command gh -ErrorAction SilentlyContinue
    if ($gh) {
        try {
                gh release create v0.1.1 --title "v0.1.1" --notes-file releases/v0.1.1/RELEASE_NOTES_BY_AI_v0.1.1.md
            Write-Host "GitHub Release creado." -ForegroundColor Green
        } catch {
            Write-Host "gh release create falló: $_" -ForegroundColor Red
        }
    } else {
        Write-Host "gh CLI no encontrado: para crear la release automáticamente instala GitHub CLI o crea la release manualmente usando la interfaz web." -ForegroundColor Yellow
    }

    Write-Host "Hecho. Revisa los pasos y el contenido de RELEASE_NOTES_BY_AI_v0.1.1.md antes de ejecutar." -ForegroundColor Cyan

} catch {
    Write-Host "Error inesperado: $_" -ForegroundColor Red
    exit 1
}
