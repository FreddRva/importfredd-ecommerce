# 🚀 Despliegue con GitHub → Vercel → axiora.pro

## Configuración para Despliegue Automático

### 1. Configurar Vercel Dashboard

1. **Conectar GitHub:**
   - Ve a [Vercel Dashboard](https://vercel.com/dashboard)
   - Conecta tu repositorio de GitHub
   - Configura el despliegue automático

2. **Configurar Variables de Entorno:**
   - Ve a **Settings** > **Environment Variables**
   - Agrega las siguientes variables:

```env
NEXT_PUBLIC_API_URL=https://importfredd-ecommerce.onrender.com
NEXT_PUBLIC_WEBAUTHN_RPID=axiora.pro
NEXT_PUBLIC_WEBAUTHN_RP_ORIGIN=https://axiora.pro
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

3. **Configurar Dominio:**
   - Ve a **Settings** > **Domains**
   - Agrega: `axiora.pro`
   - Sigue las instrucciones de DNS

### 2. Configurar Backend (Render)

Actualiza las variables de entorno en tu backend de Render:

```env
WEBAUTHN_RPID=axiora.pro
WEBAUTHN_RP_ORIGIN=https://axiora.pro
```

### 3. Flujo de Despliegue

```bash
# 1. Hacer cambios en tu código
git add .

# 2. Commit con mensaje descriptivo
git commit -m "feat: configure axiora.pro domain and WebAuthn"

# 3. Push a GitHub
git push origin main

# 4. Vercel detectará automáticamente los cambios y desplegará
```

## Verificación del Despliegue

### 1. Verificar en Vercel Dashboard
- ✅ Build completado exitosamente
- ✅ Variables de entorno configuradas
- ✅ Dominio axiora.pro conectado

### 2. Verificar Funcionalidades
- ✅ https://axiora.pro carga correctamente
- ✅ WebAuthn funciona con el nuevo dominio
- ✅ API se conecta desde el backend
- ✅ CORS permite axiora.pro

## Troubleshooting

### Error: "Build Failed"
- Verifica que todas las variables de entorno estén configuradas en Vercel
- Revisa los logs de build en Vercel Dashboard
- Asegúrate de que el código compile localmente

### Error: "Invalid RPID"
- Verifica que `NEXT_PUBLIC_WEBAUTHN_RPID=axiora.pro` esté en Vercel
- Asegúrate de que el backend tenga `WEBAUTHN_RPID=axiora.pro`

### Error: CORS
- Verifica que `https://axiora.pro` esté en la lista de orígenes del backend
- Reinicia el backend después de cambiar la configuración

## Comandos Útiles

### Verificar Estado Local
```bash
# Construir localmente para verificar
cd 2/frontend
npm run build

# Verificar variables de entorno
echo $NEXT_PUBLIC_API_URL
echo $NEXT_PUBLIC_WEBAUTHN_RPID
```

### Forzar Re-despliegue
```bash
# Hacer un commit vacío para forzar re-despliegue
git commit --allow-empty -m "chore: force redeploy"
git push origin main
```

## URLs Importantes

- **Frontend:** https://axiora.pro
- **Backend:** https://importfredd-ecommerce.onrender.com
- **Vercel Dashboard:** https://vercel.com/dashboard
- **GitHub Repository:** Tu repositorio

## Estado del Despliegue

- ✅ Configuración de Vercel lista
- ✅ Variables de entorno definidas
- ✅ Dominio axiora.pro configurado
- ✅ Backend actualizado para CORS
- ✅ WebAuthn configurado para axiora.pro

---

**¡Listo para hacer commit y push! 🚀** 