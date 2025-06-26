#!/bin/bash

echo "🚀 Desplegando Axiora en axiora.pro..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 Verificando configuración...${NC}"

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: No se encontró package.json. Ejecuta este script desde la raíz del proyecto.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Configuración verificada${NC}"

echo -e "${BLUE}🔧 Configurando variables de entorno para axiora.pro...${NC}"

# Crear archivo .env.local para producción
cat > 2/frontend/.env.local << EOF
# Production Configuration for axiora.pro
NEXT_PUBLIC_API_URL=https://importfredd-ecommerce.onrender.com
NEXT_PUBLIC_WEBAUTHN_RPID=axiora.pro
NEXT_PUBLIC_WEBAUTHN_RP_ORIGIN=https://axiora.pro

# Stripe Configuration (actualizar con tus claves reales)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
EOF

echo -e "${GREEN}✅ Variables de entorno configuradas${NC}"

echo -e "${BLUE}📦 Instalando dependencias del frontend...${NC}"
cd 2/frontend
npm install

echo -e "${GREEN}✅ Dependencias instaladas${NC}"

echo -e "${BLUE}🏗️ Construyendo aplicación...${NC}"
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build completado exitosamente${NC}"
else
    echo -e "${RED}❌ Error en el build${NC}"
    exit 1
fi

echo -e "${BLUE}🚀 Desplegando en Vercel...${NC}"

# Verificar si vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠️ Vercel CLI no está instalado. Instalando...${NC}"
    npm install -g vercel
fi

# Desplegar
vercel --prod

echo -e "${GREEN}🎉 ¡Despliegue completado!${NC}"
echo -e "${BLUE}🌐 Tu aplicación estará disponible en: https://axiora.pro${NC}"

echo -e "${YELLOW}📝 Recordatorios importantes:${NC}"
echo -e "1. Configura las variables de entorno en Vercel Dashboard"
echo -e "2. Actualiza las variables de entorno del backend en Render"
echo -e "3. Verifica que el dominio esté correctamente configurado en Vercel"
echo -e "4. Prueba la funcionalidad de WebAuthn con el nuevo dominio"

echo -e "${GREEN}✨ ¡Axiora está listo para el mundo! ✨${NC}" 