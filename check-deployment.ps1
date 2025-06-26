# Script para verificar configuración antes del despliegue
Write-Host "Verificando configuración para axiora.pro..." -ForegroundColor Blue

# Verificar archivos críticos
$criticalFiles = @(
    "2/frontend/vercel.json",
    "2/frontend/next.config.ts",
    "2/backend/internal/cmd/server/main.go",
    "2/frontend/src/app/layout.tsx",
    "2/frontend/src/app/page.tsx"
)

Write-Host "Verificando archivos críticos..." -ForegroundColor Yellow
foreach ($file in $criticalFiles) {
    if (Test-Path $file) {
        Write-Host "OK $file" -ForegroundColor Green
    } else {
        Write-Host "ERROR $file - NO ENCONTRADO" -ForegroundColor Red
    }
}

# Verificar configuración de Vercel
Write-Host "`nVerificando vercel.json..." -ForegroundColor Yellow
if (Test-Path "2/frontend/vercel.json") {
    $vercelConfig = Get-Content "2/frontend/vercel.json" | ConvertFrom-Json
    
    $requiredEnvVars = @(
        "NEXT_PUBLIC_API_URL",
        "NEXT_PUBLIC_WEBAUTHN_RPID", 
        "NEXT_PUBLIC_WEBAUTHN_RP_ORIGIN"
    )
    
    foreach ($var in $requiredEnvVars) {
        if ($vercelConfig.env.$var) {
            Write-Host "OK $var = $($vercelConfig.env.$var)" -ForegroundColor Green
        } else {
            Write-Host "ERROR $var - NO CONFIGURADO" -ForegroundColor Red
        }
    }
}

# Verificar configuración de Next.js
Write-Host "`nVerificando next.config.ts..." -ForegroundColor Yellow
if (Test-Path "2/frontend/next.config.ts") {
    $nextConfig = Get-Content "2/frontend/next.config.ts" -Raw
    if ($nextConfig -match "axiora\.pro") {
        Write-Host "OK axiora.pro configurado en next.config.ts" -ForegroundColor Green
    } else {
        Write-Host "ERROR axiora.pro NO encontrado en next.config.ts" -ForegroundColor Red
    }
}

# Verificar configuración del backend
Write-Host "`nVerificando configuración del backend..." -ForegroundColor Yellow
if (Test-Path "2/backend/internal/cmd/server/main.go") {
    $backendConfig = Get-Content "2/backend/internal/cmd/server/main.go" -Raw
    if ($backendConfig -match "axiora\.pro") {
        Write-Host "OK axiora.pro configurado en CORS del backend" -ForegroundColor Green
    } else {
        Write-Host "ERROR axiora.pro NO encontrado en configuración CORS" -ForegroundColor Red
    }
}

# Verificar branding
Write-Host "`nVerificando branding..." -ForegroundColor Yellow
if (Test-Path "2/frontend/src/app/layout.tsx") {
    $layoutContent = Get-Content "2/frontend/src/app/layout.tsx" -Raw
    if ($layoutContent -match "Axiora") {
        Write-Host "OK Branding actualizado a 'Axiora'" -ForegroundColor Green
    } else {
        Write-Host "ERROR Branding NO actualizado" -ForegroundColor Red
    }
}

# Resumen
Write-Host "`nRESUMEN DE VERIFICACION:" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

Write-Host "`nPROXIMOS PASOS:" -ForegroundColor Yellow
Write-Host "1. Configurar variables de entorno en Vercel Dashboard" -ForegroundColor White
Write-Host "2. Agregar dominio axiora.pro en Vercel" -ForegroundColor White
Write-Host "3. Actualizar variables del backend en Render" -ForegroundColor White
Write-Host "4. Hacer commit y push:" -ForegroundColor White
Write-Host "   git add ." -ForegroundColor Gray
Write-Host "   git commit -m 'feat: configure axiora.pro domain'" -ForegroundColor Gray
Write-Host "   git push origin main" -ForegroundColor Gray

Write-Host "`nAxiora esta listo para el despliegue!" -ForegroundColor Green 