# 🚀 Guía de Despliegue - Axiora.pro

## Configuración del Dominio Personalizado

### 1. Configurar Vercel

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Navega a **Settings** > **Domains**
3. Agrega tu dominio: `axiora.pro`
4. Sigue las instrucciones de Vercel para configurar los registros DNS

### 2. Variables de Entorno en Vercel

En el dashboard de Vercel, ve a **Settings** > **Environment Variables** y agrega:

```env
NEXT_PUBLIC_API_URL=https://importfredd-ecommerce.onrender.com
NEXT_PUBLIC_WEBAUTHN_RPID=axiora.pro
NEXT_PUBLIC_WEBAUTHN_RP_ORIGIN=https://axiora.pro
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 3. Configurar Backend (Render)

Si tu backend está en Render, actualiza las variables de entorno:

```env
WEBAUTHN_RPID=axiora.pro
WEBAUTHN_RP_ORIGIN=https://axiora.pro
```

## Despliegue Automático

### Opción 1: Script de PowerShell (Windows)

```powershell
.\deploy-axiora.ps1
```

### Opción 2: Script Bash (Linux/Mac)

```bash
./deploy-axiora.sh
```

### Opción 3: Despliegue Manual

1. **Configurar variables de entorno localmente:**
   ```bash
   cd 2/frontend
   ```

   Crea el archivo `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=https://importfredd-ecommerce.onrender.com
   NEXT_PUBLIC_WEBAUTHN_RPID=axiora.pro
   NEXT_PUBLIC_WEBAUTHN_RP_ORIGIN=https://axiora.pro
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Construir la aplicación:**
   ```bash
   npm run build
   ```

4. **Desplegar en Vercel:**
   ```bash
   vercel --prod
   ```

## Verificación Post-Despliegue

### 1. Verificar Dominio
- ✅ https://axiora.pro carga correctamente
- ✅ Redirección HTTPS funciona
- ✅ Certificado SSL está activo

### 2. Verificar Funcionalidades
- ✅ Página principal carga
- ✅ Navegación funciona
- ✅ Productos se cargan desde el backend
- ✅ WebAuthn funciona con el nuevo dominio

### 3. Verificar Backend
- ✅ API responde desde https://importfredd-ecommerce.onrender.com
- ✅ CORS permite axiora.pro
- ✅ WebAuthn configurado para axiora.pro

## Troubleshooting

### Error: "Invalid RPID"
- Verifica que `WEBAUTHN_RPID=axiora.pro` esté configurado en el backend
- Asegúrate de que el dominio esté correctamente configurado en Vercel

### Error: CORS
- Verifica que `https://axiora.pro` esté en la lista de orígenes permitidos del backend
- Reinicia el backend después de cambiar la configuración

### Error: Build Fallido
- Verifica que todas las variables de entorno estén configuradas
- Revisa los logs de build en Vercel

## URLs Importantes

- **Frontend:** https://axiora.pro
- **Backend:** https://importfredd-ecommerce.onrender.com
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Render Dashboard:** https://dashboard.render.com

## Soporte

Si encuentras problemas:
1. Revisa los logs en Vercel Dashboard
2. Verifica la configuración de variables de entorno
3. Asegúrate de que el backend esté funcionando
4. Prueba la funcionalidad de WebAuthn en un navegador compatible

---

**¡Axiora está listo para conquistar el mundo! 🌟** 