# Script de despliegue para Axiora en axiora.pro
Write-Host "🚀 Desplegando Axiora en axiora.pro..." -ForegroundColor Green

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: No se encontró package.json. Ejecuta este script desde la raíz del proyecto." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Configuración verificada" -ForegroundColor Green

Write-Host "🔧 Configurando variables de entorno para axiora.pro..." -ForegroundColor Blue

# Crear archivo .env.local para producción
$envContent = @"
# Production Configuration for axiora.pro
NEXT_PUBLIC_API_URL=https://importfredd-ecommerce.onrender.com
NEXT_PUBLIC_WEBAUTHN_RPID=axiora.pro
NEXT_PUBLIC_WEBAUTHN_RP_ORIGIN=https://axiora.pro

# Stripe Configuration (actualizar con tus claves reales)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
"@

$envContent | Out-File -FilePath "2/frontend/.env.local" -Encoding UTF8

Write-Host "✅ Variables de entorno configuradas" -ForegroundColor Green

Write-Host "📦 Instalando dependencias del frontend..." -ForegroundColor Blue
Set-Location "2/frontend"
npm install

Write-Host "✅ Dependencias instaladas" -ForegroundColor Green

Write-Host "🏗️ Construyendo aplicación..." -ForegroundColor Blue
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build completado exitosamente" -ForegroundColor Green
} else {
    Write-Host "❌ Error en el build" -ForegroundColor Red
    exit 1
}

Write-Host "🚀 Desplegando en Vercel..." -ForegroundColor Blue

# Verificar si vercel CLI está instalado
try {
    vercel --version | Out-Null
    Write-Host "✅ Vercel CLI encontrado" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Vercel CLI no está instalado. Instalando..." -ForegroundColor Yellow
    npm install -g vercel
}

# Desplegar
vercel --prod

Write-Host "🎉 ¡Despliegue completado!" -ForegroundColor Green
Write-Host "🌐 Tu aplicación estará disponible en: https://axiora.pro" -ForegroundColor Blue

Write-Host "📝 Recordatorios importantes:" -ForegroundColor Yellow
Write-Host "1. Configura las variables de entorno en Vercel Dashboard" -ForegroundColor White
Write-Host "2. Actualiza las variables de entorno del backend en Render" -ForegroundColor White
Write-Host "3. Verifica que el dominio esté correctamente configurado en Vercel" -ForegroundColor White
Write-Host "4. Prueba la funcionalidad de WebAuthn con el nuevo dominio" -ForegroundColor White

Write-Host "✨ ¡Axiora está listo para el mundo! ✨" -ForegroundColor Green 