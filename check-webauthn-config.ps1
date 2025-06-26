# Script para verificar y configurar WebAuthn
Write-Host "🔐 Verificando configuración de WebAuthn..." -ForegroundColor Cyan

Write-Host "`n🌐 Dominios configurados:" -ForegroundColor Yellow
Write-Host "• axiora.pro (dominio principal)" -ForegroundColor White
Write-Host "• importfredd-axiora.vercel.app (dominio Vercel)" -ForegroundColor White
Write-Host "• localhost:3000 (desarrollo local)" -ForegroundColor White

Write-Host "`n⚠️ PROBLEMA IDENTIFICADO:" -ForegroundColor Red
Write-Host "El error 'The RP ID \"axiora.pro\" is invalid for this domain' indica que:" -ForegroundColor Yellow
Write-Host "• Estás accediendo desde: importfredd-axiora.vercel.app" -ForegroundColor White
Write-Host "• Pero el RP ID está configurado como: axiora.pro" -ForegroundColor White
Write-Host "• El RP ID debe coincidir exactamente con el dominio de acceso" -ForegroundColor White

Write-Host "`n🔧 SOLUCIÓN:" -ForegroundColor Green
Write-Host "1. Actualizar variables de entorno en Render (backend):" -ForegroundColor White
Write-Host "   WEBAUTHN_RPID=importfredd-axiora.vercel.app" -ForegroundColor Cyan
Write-Host "   WEBAUTHN_RP_ORIGIN=https://importfredd-axiora.vercel.app" -ForegroundColor Cyan

Write-Host "`n2. Actualizar variables de entorno en Vercel (frontend):" -ForegroundColor White
Write-Host "   NEXT_PUBLIC_WEBAUTHN_RPID=importfredd-axiora.vercel.app" -ForegroundColor Cyan
Write-Host "   NEXT_PUBLIC_WEBAUTHN_RP_ORIGIN=https://importfredd-axiora.vercel.app" -ForegroundColor Cyan

Write-Host "`n3. Redesplegar el backend después de cambiar las variables" -ForegroundColor White

Write-Host "`n📋 Variables de entorno para Render:" -ForegroundColor Cyan
Write-Host "DATABASE_URL=tu-url-de-postgres" -ForegroundColor White
Write-Host "JWT_SECRET=tu-jwt-secret" -ForegroundColor White
Write-Host "WEBAUTHN_RPID=importfredd-axiora.vercel.app" -ForegroundColor White
Write-Host "WEBAUTHN_RP_ORIGIN=https://importfredd-axiora.vercel.app" -ForegroundColor White
Write-Host "FRONTEND_URL=https://importfredd-axiora.vercel.app" -ForegroundColor White
Write-Host "RESEND_API_KEY=tu-api-key-de-resend" -ForegroundColor White
Write-Host "STRIPE_SECRET_KEY=tu-stripe-secret-key" -ForegroundColor White

Write-Host "`n📋 Variables de entorno para Vercel:" -ForegroundColor Cyan
Write-Host "NEXT_PUBLIC_API_URL=https://importfredd-ecommerce.onrender.com" -ForegroundColor White
Write-Host "NEXT_PUBLIC_WEBAUTHN_RPID=importfredd-axiora.vercel.app" -ForegroundColor White
Write-Host "NEXT_PUBLIC_WEBAUTHN_RP_ORIGIN=https://importfredd-axiora.vercel.app" -ForegroundColor White
Write-Host "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=tu-stripe-publishable-key" -ForegroundColor White

Write-Host "`n✅ Después de actualizar las variables, redesplega ambos servicios!" -ForegroundColor Green 