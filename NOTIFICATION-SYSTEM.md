# 🔔 Sistema de Notificaciones - Axiora E-commerce

## 📋 Resumen Ejecutivo

Se ha implementado un **Sistema Completo de Notificaciones** para el e-commerce Axiora que incluye:

- ✅ **Notificaciones en tiempo real** para usuarios y administradores
- ✅ **Múltiples canales**: In-app, Email, Push (preparado)
- ✅ **Tipos especializados**: Pedidos, Pagos, Stock, Seguridad, Admin
- ✅ **Preferencias personalizables** por usuario
- ✅ **UI/UX moderna** con campana de notificaciones
- ✅ **Backend robusto** con base de datos optimizada

---

## 🏗️ Arquitectura del Sistema

### Backend (Go)
```
📁 internal/
├── 📁 models/
│   └── models.go (Notification, NotificationPreference)
├── 📁 db/
│   └── admin.go (funciones de BD para notificaciones)
├── 📁 email/
│   └── notification_service.go (servicio principal)
├── 📁 handlers/
│   └── notification_handlers.go (API endpoints)
└── 📁 cmd/server/
    └── main.go (rutas integradas)
```

### Frontend (Next.js)
```
📁 src/
├── 📁 context/
│   └── NotificationContext.tsx (estado global)
├── 📁 components/
│   └── NotificationBell.tsx (UI principal)
└── 📁 app/
    └── layout.tsx (provider integrado)
```

---

## 🗄️ Base de Datos

### Tabla: `notifications`
```sql
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    type VARCHAR(50) NOT NULL, -- order, payment, stock, security, admin
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data TEXT, -- JSON con datos adicionales
    is_read BOOLEAN DEFAULT FALSE,
    is_admin BOOLEAN DEFAULT FALSE,
    priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, urgent
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP, -- opcional
    read_at TIMESTAMP
);
```

### Tabla: `notification_preferences`
```sql
CREATE TABLE notification_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    type VARCHAR(50) NOT NULL, -- order, payment, marketing, security
    email_enabled BOOLEAN DEFAULT TRUE,
    push_enabled BOOLEAN DEFAULT TRUE,
    in_app_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, type)
);
```

---

## 🔧 API Endpoints

### Usuarios
```
GET    /api/notifications              # Obtener notificaciones
GET    /api/notifications/unread-count # Contar no leídas
PUT    /api/notifications/:id/read     # Marcar como leída
PUT    /api/notifications/mark-all-read # Marcar todas como leídas
DELETE /api/notifications/:id          # Eliminar notificación
GET    /api/notifications/preferences  # Obtener preferencias
PUT    /api/notifications/preferences  # Actualizar preferencias
```

### Administradores
```
GET    /admin/notifications            # Notificaciones admin
GET    /admin/notifications/unread-count # Contar admin no leídas
```

---

## 🎯 Tipos de Notificaciones

### 1. **Pedidos** (`order`)
- **Cuándo**: Creación, actualización de estado, envío, entrega
- **Destinatarios**: Cliente
- **Ejemplo**: "Tu pedido #ORD-123 ha sido enviado"

### 2. **Pagos** (`payment`)
- **Cuándo**: Confirmación, fallo, reembolso
- **Destinatarios**: Cliente
- **Ejemplo**: "Tu pago de $99.99 ha sido confirmado"

### 3. **Stock** (`stock`)
- **Cuándo**: Producto disponible nuevamente
- **Destinatarios**: Clientes con producto en favoritos
- **Ejemplo**: "¡Zapatillas Nike Air Max están disponibles!"

### 4. **Seguridad** (`security`)
- **Cuándo**: Login desde nueva ubicación, cambio de contraseña
- **Destinatarios**: Usuario afectado
- **Ejemplo**: "Se detectó actividad inusual en tu cuenta"

### 5. **Administrador** (`admin`)
- **Cuándo**: Nuevos usuarios, pedidos, alertas del sistema
- **Destinatarios**: Todos los administradores
- **Ejemplo**: "Nuevo pedido #123 de usuario@email.com por $150"

---

## 🎨 Interfaz de Usuario

### Componente: NotificationBell
- **Campana con badge** mostrando número de no leídas
- **Dropdown responsive** con lista de notificaciones
- **Acciones**: Marcar como leída, eliminar, ver todas
- **Indicadores visuales**: Prioridad, tipo, tiempo
- **Navegación automática** a páginas relacionadas

### Características UI/UX:
- ✅ **Responsive** para móvil y desktop
- ✅ **Animaciones suaves** y transiciones
- ✅ **Indicadores de prioridad** con colores
- ✅ **Iconos por tipo** de notificación
- ✅ **Tiempo relativo** (hace 5 min, hace 2h)
- ✅ **Overlay para cerrar** al hacer clic fuera

---

## ⚙️ Configuración y Preferencias

### Preferencias por Usuario
Cada usuario puede configurar:
- **Email**: Recibir notificaciones por correo
- **Push**: Notificaciones push (preparado para futuro)
- **In-app**: Notificaciones en la aplicación

### Tipos Configurables:
- Pedidos y envíos
- Confirmaciones de pago
- Marketing y promociones
- Alertas de seguridad

---

## 🚀 Integración con Eventos

### Pedidos
```go
// En OrderHandler.CreateOrderFromCart()
if err := h.NotificationSvc.CreateOrderNotification(ctx, userID, order.ID, "pending", order.OrderNumber); err != nil {
    log.Printf("Error enviando notificación: %v", err)
}

// Notificación a administradores
if err := h.NotificationSvc.CreateNewOrderAdminNotification(ctx, order.ID, user.Email, userName, amount); err != nil {
    log.Printf("Error enviando notificación admin: %v", err)
}
```

### Registro de Usuarios
```go
// En AuthHandler.FinishRegistration()
if err := h.notificationSvc.CreateNewUserAdminNotification(c.Request.Context(), user.Email); err != nil {
    log.Printf("Error enviando notificación de nuevo usuario: %v", err)
}
```

---

## 📊 Monitoreo y Analytics

### Métricas Disponibles:
- **Notificaciones enviadas** por tipo
- **Tasa de lectura** de notificaciones
- **Preferencias** más populares
- **Tiempo de respuesta** de usuarios
- **Notificaciones admin** por evento

### Logs y Debug:
- Logs detallados en desarrollo
- Errores capturados sin afectar funcionalidad
- Métricas de rendimiento

---

## 🔒 Seguridad

### Medidas Implementadas:
- ✅ **Autenticación requerida** para todas las rutas
- ✅ **Validación de propiedad** (usuario solo ve sus notificaciones)
- ✅ **Rate limiting** en endpoints críticos
- ✅ **Sanitización de datos** de entrada
- ✅ **Logs de auditoría** para acciones admin

### Permisos:
- **Usuarios**: Ver, marcar como leída, eliminar sus notificaciones
- **Admins**: Ver todas las notificaciones admin + sus notificaciones personales

---

## 🧪 Testing

### Casos de Prueba Cubiertos:
- ✅ Creación de notificaciones
- ✅ Envío de emails
- ✅ Marcado como leído
- ✅ Eliminación de notificaciones
- ✅ Preferencias de usuario
- ✅ Notificaciones admin
- ✅ UI responsive

### Comandos de Prueba:
```bash
# Ejecutar esquema de BD
psql -d axiora_db -f notifications_schema.sql

# Probar endpoints
curl -H "Authorization: Bearer TOKEN" http://localhost:8080/api/notifications
```

---

## 📈 Roadmap Futuro

### Fase 2: Notificaciones Push
- [ ] Integración con Service Workers
- [ ] Notificaciones push del navegador
- [ ] Configuración de permisos

### Fase 3: Notificaciones Avanzadas
- [ ] Notificaciones programadas
- [ ] Plantillas personalizables
- [ ] Integración con webhooks externos

### Fase 4: Analytics Avanzados
- [ ] Dashboard de métricas
- [ ] A/B testing de notificaciones
- [ ] Optimización automática

---

## 🛠️ Instalación y Configuración

### 1. Base de Datos
```bash
# Ejecutar el esquema
psql -d axiora_db -f backend/notifications_schema.sql
```

### 2. Variables de Entorno
```env
# Backend (.env)
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=noreply@axiora.pro

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### 3. Dependencias
```bash
# Backend
go mod tidy

# Frontend
npm install
```

---

## 📞 Soporte y Mantenimiento

### Monitoreo Recomendado:
- **Logs de errores** en envío de emails
- **Métricas de rendimiento** de la BD
- **Uso de memoria** del contexto de notificaciones
- **Tiempo de respuesta** de la API

### Mantenimiento:
- **Limpieza automática** de notificaciones antiguas (configurar job)
- **Backup regular** de preferencias de usuario
- **Monitoreo de rate limits**

---

## 🎉 Conclusión

El **Sistema de Notificaciones** está completamente implementado y listo para producción. Proporciona:

- **Experiencia de usuario mejorada** con notificaciones relevantes
- **Gestión eficiente** para administradores
- **Escalabilidad** para futuras funcionalidades
- **Seguridad robusta** y monitoreo completo

El sistema está diseñado para crecer con el negocio y puede adaptarse fácilmente a nuevas necesidades de notificación. 