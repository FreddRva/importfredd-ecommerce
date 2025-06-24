# 🛍️ ImportFredd - E-commerce Premium

Un e-commerce moderno y completo construido con tecnologías de vanguardia, incluyendo autenticación WebAuthn (Passkeys), visores 3D, y pagos seguros con Stripe.

## ✨ Características Principales

### 🔐 Autenticación Avanzada
- **WebAuthn/Passkeys**: Autenticación sin contraseñas usando huellas dactilares, PIN o reconocimiento facial
- **JWT + Refresh Tokens**: Sesiones seguras y renovación automática
- **Verificación por email**: Sistema completo de verificación de cuentas
- **Recuperación de cuenta**: Proceso seguro para recuperar acceso

### 🛒 Funcionalidades de E-commerce
- **Catálogo de productos**: Grid/list view con filtros avanzados
- **Carrito de compras**: Gestión completa con persistencia
- **Sistema de favoritos**: Lista de deseos sincronizada
- **Proceso de checkout**: Flujo completo de compra
- **Pagos con Stripe**: Integración segura con múltiples métodos de pago
- **Gestión de pedidos**: Tracking y estados en tiempo real

### 🎨 Experiencia de Usuario
- **Visor 3D**: Modelos interactivos con Three.js
- **UI/UX Premium**: Diseño moderno con Tailwind CSS
- **Responsive**: Optimizado para móviles y desktop
- **Animaciones**: Transiciones fluidas y efectos visuales

### 👨‍💼 Panel de Administración
- **Dashboard completo**: Métricas y gestión centralizada
- **CRUD de productos**: Gestión completa con imágenes y modelos 3D
- **Gestión de usuarios**: Administración de cuentas
- **Gestión de pedidos**: Seguimiento y actualización de estados
- **Gestión de categorías**: Organización del catálogo

## 🛠️ Stack Tecnológico

### Backend
- **Go 1.24+**: Lenguaje de programación
- **Gin**: Framework web
- **PostgreSQL**: Base de datos principal
- **WebAuthn**: Autenticación sin contraseñas
- **Stripe**: Procesamiento de pagos
- **MailerSend**: Servicio de email

### Frontend
- **Next.js 15**: Framework React
- **TypeScript**: Tipado estático
- **Tailwind CSS**: Framework de estilos
- **Three.js**: Gráficos 3D
- **Lucide React**: Iconografía
- **Stripe Elements**: Componentes de pago

## 🚀 Instalación y Configuración

### Prerrequisitos
- Go 1.24+
- Node.js 18+
- PostgreSQL 14+
- Git

### 1. Clonar el repositorio
```bash
git clone <tu-repositorio>
cd EcommerceCompleto
```

### 2. Configurar Backend
```bash
cd 2/backend

# Instalar dependencias
go mod download

# Configurar variables de entorno
cp config.env.example config.env
# Editar config.env con tus credenciales

# Ejecutar migraciones
go run cmd/server/main.go
```

### 3. Configurar Frontend
```bash
cd 2/frontend

# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev
```

### 4. Configurar Base de Datos
```sql
-- Crear base de datos
CREATE DATABASE ecommerce;

-- Crear usuario (opcional)
CREATE USER appuser WITH PASSWORD 'apppassword';
GRANT ALL PRIVILEGES ON DATABASE ecommerce TO appuser;
```

## ⚙️ Variables de Entorno

### Backend (.env)
```env
# Database
DATABASE_URL=postgres://appuser:apppassword@localhost:5432/ecommerce

# JWT
JWT_SECRET=tu-secreto-muy-seguro-y-largo

# Server
PORT=8080

# WebAuthn
WEBAUTHN_RPID=localhost
WEBAUTHN_RP_ORIGIN=http://localhost:3000

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Email
EMAIL_FROM="Tu Tienda <noreply@localhost>"
MAILERSEND_API_KEY=tu-api-key
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## 📁 Estructura del Proyecto

```
EcommerceCompleto/
├── 2/
│   ├── backend/                 # API Go
│   │   ├── internal/
│   │   │   ├── auth/           # Autenticación WebAuthn
│   │   │   ├── handlers/       # Controladores HTTP
│   │   │   ├── models/         # Modelos de datos
│   │   │   ├── db/             # Capa de base de datos
│   │   │   └── email/          # Servicio de email
│   │   ├── uploads/            # Archivos subidos
│   │   └── cmd/server/         # Punto de entrada
│   └── frontend/               # Aplicación Next.js
│       ├── src/
│       │   ├── app/            # Páginas y rutas
│       │   ├── components/     # Componentes React
│       │   ├── context/        # Contextos de estado
│       │   ├── hooks/          # Hooks personalizados
│       │   └── lib/            # Utilidades y configuraciones
│       └── public/             # Archivos estáticos
```

## 🔧 Comandos Útiles

### Backend
```bash
# Ejecutar en desarrollo
go run cmd/server/main.go

# Construir para producción
go build -o bin/server cmd/server/main.go

# Ejecutar tests
go test ./...

# Limpiar módulos
go mod tidy
```

### Frontend
```bash
# Desarrollo
npm run dev

# Construir para producción
npm run build

# Ejecutar en producción
npm start

# Linting
npm run lint
```

## 🌐 Endpoints Principales

### Autenticación
- `POST /auth/request-verification-code` - Solicitar código de verificación
- `POST /auth/begin-registration` - Iniciar registro WebAuthn
- `POST /auth/finish-registration` - Completar registro
- `GET /auth/begin-login` - Iniciar login WebAuthn
- `POST /auth/finish-login` - Completar login

### Productos
- `GET /products` - Listar productos
- `GET /products/:id` - Obtener producto
- `POST /admin/products` - Crear producto (admin)
- `PUT /admin/products/:id` - Actualizar producto (admin)

### Carrito
- `GET /api/cart` - Obtener carrito
- `POST /api/cart/items` - Agregar al carrito
- `PUT /api/cart/items/:id` - Actualizar cantidad
- `DELETE /api/cart/items/:id` - Eliminar del carrito

### Pedidos
- `POST /api/orders/create` - Crear pedido
- `GET /api/orders` - Listar pedidos del usuario
- `GET /api/orders/:id` - Obtener detalles del pedido

### Pagos
- `POST /api/payments/create-intent` - Crear PaymentIntent
- `POST /api/payments/confirm` - Confirmar pago
- `POST /webhooks/stripe` - Webhook de Stripe

## 🔒 Seguridad

- **WebAuthn**: Autenticación sin contraseñas usando estándares FIDO2
- **JWT**: Tokens seguros con expiración
- **HTTPS**: Comunicación encriptada (en producción)
- **CORS**: Configuración de orígenes permitidos
- **Rate Limiting**: Protección contra spam
- **Validación**: Validación de datos en frontend y backend

## 🚀 Despliegue

### Backend (Heroku/DigitalOcean)
```bash
# Construir imagen Docker
docker build -t ecommerce-backend .

# Ejecutar contenedor
docker run -p 8080:8080 ecommerce-backend
```

### Frontend (Vercel/Netlify)
```bash
# Desplegar en Vercel
vercel --prod

# O construir y subir a hosting estático
npm run build
```

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

Si tienes preguntas o necesitas ayuda:
- Abre un issue en GitHub
- Contacta al equipo de desarrollo
- Revisa la documentación técnica

## 🎯 Roadmap

### Próximas Funcionalidades
- [ ] Sistema de reseñas y calificaciones
- [ ] Búsqueda avanzada con filtros
- [ ] Sistema de cupones y descuentos
- [ ] Múltiples métodos de pago
- [ ] Sistema de envíos con tracking
- [ ] Chat en vivo para soporte
- [ ] App móvil nativa
- [ ] Sistema de afiliados
- [ ] IA para recomendaciones

---

**Desarrollado con ❤️ por el equipo de ImportFredd** 