# Script para verificar la configuración del proyecto Ecommerce
Write-Host "🔍 Verificando configuración del proyecto..." -ForegroundColor Cyan

# Verificar estructura de directorios
Write-Host "`n📁 Verificando estructura de directorios..." -ForegroundColor Yellow
if (Test-Path "Ecommerce/frontend") {
    Write-Host "✅ Frontend encontrado" -ForegroundColor Green
} else {
    Write-Host "❌ Frontend no encontrado" -ForegroundColor Red
}

if (Test-Path "Ecommerce/backend") {
    Write-Host "✅ Backend encontrado" -ForegroundColor Green
} else {
    Write-Host "❌ Backend no encontrado" -ForegroundColor Red
}

# Verificar archivos de configuración
Write-Host "`n⚙️ Verificando archivos de configuración..." -ForegroundColor Yellow

# Frontend
if (Test-Path "Ecommerce/frontend/package.json") {
    Write-Host "✅ package.json del frontend" -ForegroundColor Green
} else {
    Write-Host "❌ package.json del frontend no encontrado" -ForegroundColor Red
}

if (Test-Path "Ecommerce/frontend/next.config.ts") {
    Write-Host "✅ next.config.ts" -ForegroundColor Green
} else {
    Write-Host "❌ next.config.ts no encontrado" -ForegroundColor Red
}

if (Test-Path "Ecommerce/frontend/vercel.json") {
    Write-Host "✅ vercel.json" -ForegroundColor Green
} else {
    Write-Host "❌ vercel.json no encontrado" -ForegroundColor Red
}

# Backend
if (Test-Path "Ecommerce/backend/go.mod") {
    Write-Host "✅ go.mod" -ForegroundColor Green
} else {
    Write-Host "❌ go.mod no encontrado" -ForegroundColor Red
}

if (Test-Path "Ecommerce/backend/config.env.example") {
    Write-Host "✅ config.env.example" -ForegroundColor Green
} else {
    Write-Host "❌ config.env.example no encontrado" -ForegroundColor Red
}

# Verificar archivo .env del backend
if (Test-Path "Ecommerce/backend/.env") {
    Write-Host "✅ .env del backend encontrado" -ForegroundColor Green
} else {
    Write-Host "⚠️ .env del backend no encontrado (usar config.env.example como base)" -ForegroundColor Yellow
}

# Verificar problemas comunes
Write-Host "`n🔧 Verificando problemas comunes..." -ForegroundColor Yellow

# Buscar referencias a localhost en archivos clave
$filesToCheck = @(
    "Ecommerce/frontend/src/lib/api.ts",
    "Ecommerce/frontend/src/lib/webauthn.ts",
    "Ecommerce/backend/internal/cmd/server/main.go",
    "Ecommerce/backend/internal/auth/webauthn.go"
)

foreach ($file in $filesToCheck) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        if ($content -match "localhost") {
            Write-Host "⚠️ $file contiene referencias a localhost" -ForegroundColor Yellow
        } else {
            Write-Host "✅ $file sin referencias problemáticas a localhost" -ForegroundColor Green
        }
    }
}

# Verificar dominios obsoletos
Write-Host "`n🌐 Verificando dominios..." -ForegroundColor Yellow
$obsoleteDomains = @(
    "importfredd-ecommercerv.vercel.app",
    "importfredd-ecommercerv-git-main-freddrvas-projects.vercel.app"
)

foreach ($domain in $obsoleteDomains) {
    $found = $false
    Get-ChildItem -Path "Ecommerce" -Recurse -Include "*.ts", "*.tsx", "*.js", "*.jsx", "*.go" | ForEach-Object {
        $content = Get-Content $_.FullName -Raw
        if ($content -match $domain) {
            Write-Host "❌ $($_.Name) contiene dominio obsoleto: $domain" -ForegroundColor Red
            $found = $true
        }
    }
    if (-not $found) {
        Write-Host "✅ No se encontraron referencias a $domain" -ForegroundColor Green
    }
}

Write-Host "`n📋 Resumen de configuración:" -ForegroundColor Cyan
Write-Host "• Frontend: Next.js con TypeScript" -ForegroundColor White
Write-Host "• Backend: Go con Gin y PostgreSQL" -ForegroundColor White
Write-Host "• Autenticación: WebAuthn (Passkeys)" -ForegroundColor White
Write-Host "• Email: Resend" -ForegroundColor White
Write-Host "• Pagos: Stripe" -ForegroundColor White
Write-Host "• Dominio principal: axiora.pro" -ForegroundColor White

Write-Host "`n🚀 Próximos pasos:" -ForegroundColor Cyan
Write-Host "1. Crear archivo .env en el backend basado en config.env.example" -ForegroundColor White
Write-Host "2. Configurar variables de entorno en Render (backend)" -ForegroundColor White
Write-Host "3. Configurar variables de entorno en Vercel (frontend)" -ForegroundColor White
Write-Host "4. Desplegar backend en Render" -ForegroundColor White
Write-Host "5. Desplegar frontend en Vercel" -ForegroundColor White

Write-Host "`n✅ Verificación completada!" -ForegroundColor Green 