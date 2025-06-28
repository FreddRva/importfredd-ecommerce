package email

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/tuusuario/ecommerce-backend/internal/db"
	"github.com/tuusuario/ecommerce-backend/internal/models"
)

// NotificationService maneja el envío de notificaciones
type NotificationService struct {
	db       *pgxpool.Pool
	emailSvc *EmailService
}

// NewNotificationService crea una nueva instancia del servicio de notificaciones
func NewNotificationService(db *pgxpool.Pool, emailSvc *EmailService) *NotificationService {
	return &NotificationService{
		db:       db,
		emailSvc: emailSvc,
	}
}

// NotificationData contiene datos adicionales para las notificaciones
type NotificationData struct {
	OrderID     *int    `json:"order_id,omitempty"`
	ProductID   *int    `json:"product_id,omitempty"`
	Amount      *string `json:"amount,omitempty"`
	UserEmail   *string `json:"user_email,omitempty"`
	UserName    *string `json:"user_name,omitempty"`
	ProductName *string `json:"product_name,omitempty"`
	ActionURL   *string `json:"action_url,omitempty"`
}

// CreateNotification crea y envía una notificación
func (ns *NotificationService) CreateNotification(ctx context.Context, userID int, notificationType, title, message string, data NotificationData, priority string, isAdmin bool) error {
	// Serializar datos adicionales
	dataJSON, err := json.Marshal(data)
	if err != nil {
		return fmt.Errorf("error serializando datos de notificación: %w", err)
	}

	// Crear notificación en base de datos
	notification := &models.Notification{
		UserID:    userID,
		Type:      notificationType,
		Title:     title,
		Message:   message,
		Data:      string(dataJSON),
		IsRead:    false,
		IsAdmin:   isAdmin,
		Priority:  priority,
		CreatedAt: time.Now(),
	}

	if err := db.CreateNotification(ns.db, notification); err != nil {
		return fmt.Errorf("error creando notificación en BD: %w", err)
	}

	// Obtener preferencias del usuario
	preferences, err := db.GetNotificationPreferences(ns.db, userID)
	if err != nil {
		log.Printf("Error obteniendo preferencias de notificación: %v", err)
		// Continuar sin preferencias (usar defaults)
	}

	// Verificar si el usuario quiere notificaciones por email
	emailEnabled := true // default
	for _, pref := range preferences {
		if pref.Type == notificationType {
			emailEnabled = pref.EmailEnabled
			break
		}
	}

	// Enviar email si está habilitado
	if emailEnabled {
		go ns.sendNotificationEmail(userID, notification, data)
	}

	return nil
}

// sendNotificationEmail envía una notificación por email
func (ns *NotificationService) sendNotificationEmail(userID int, notification *models.Notification, data NotificationData) {
	// Obtener información del usuario
	user, err := db.GetUserByID(ns.db, userID)
	if err != nil {
		log.Printf("Error obteniendo usuario para notificación: %v", err)
		return
	}

	// Determinar template según tipo
	var template string
	var subject string

	switch notification.Type {
	case "order":
		template = "order_notification.html"
		subject = "Actualización de tu pedido"
	case "payment":
		template = "payment_notification.html"
		subject = "Confirmación de pago"
	case "stock":
		template = "stock_notification.html"
		subject = "Producto disponible"
	case "security":
		template = "security_notification.html"
		subject = "Alerta de seguridad"
	case "admin":
		template = "admin_notification.html"
		subject = "Notificación administrativa"
	default:
		template = "general_notification.html"
		subject = notification.Title
	}

	// Preparar datos del template
	templateData := map[string]interface{}{
		"UserName":    user.Email,
		"Title":       notification.Title,
		"Message":     notification.Message,
		"Priority":    notification.Priority,
		"CreatedAt":   notification.CreatedAt.Format("02/01/2006 15:04"),
		"ActionURL":   data.ActionURL,
		"OrderID":     data.OrderID,
		"ProductName": data.ProductName,
		"Amount":      data.Amount,
	}

	// Enviar email
	if err := ns.emailSvc.SendEmail(user.Email, subject, template, templateData); err != nil {
		log.Printf("Error enviando notificación por email: %v", err)
	}
}

// CreateOrderNotification crea una notificación de pedido
func (ns *NotificationService) CreateOrderNotification(ctx context.Context, userID int, orderID int, status, orderNumber string) error {
	var title, message string
	var priority string

	switch status {
	case "pending":
		title = "Pedido Confirmado"
		message = fmt.Sprintf("Tu pedido #%s ha sido confirmado y está siendo procesado.", orderNumber)
		priority = "medium"
	case "shipped":
		title = "Pedido Enviado"
		message = fmt.Sprintf("Tu pedido #%s ha sido enviado. ¡Pronto llegará a tu puerta!", orderNumber)
		priority = "high"
	case "delivered":
		title = "Pedido Entregado"
		message = fmt.Sprintf("¡Tu pedido #%s ha sido entregado! Esperamos que disfrutes tu compra.", orderNumber)
		priority = "medium"
	case "cancelled":
		title = "Pedido Cancelado"
		message = fmt.Sprintf("Tu pedido #%s ha sido cancelado. Si tienes preguntas, contacta con soporte.", orderNumber)
		priority = "high"
	}

	data := NotificationData{
		OrderID:   &orderID,
		ActionURL: stringPtr(fmt.Sprintf("/mi-cuenta?tab=orders")),
	}

	return ns.CreateNotification(ctx, userID, "order", title, message, data, priority, false)
}

// CreatePaymentNotification crea una notificación de pago
func (ns *NotificationService) CreatePaymentNotification(ctx context.Context, userID int, orderID int, amount, currency string, status string) error {
	title := "Confirmación de Pago"
	message := fmt.Sprintf("Tu pago de %s %s ha sido %s exitosamente.", currency, amount, status)

	data := NotificationData{
		OrderID:   &orderID,
		Amount:    &amount,
		ActionURL: stringPtr(fmt.Sprintf("/mi-cuenta?tab=orders")),
	}

	return ns.CreateNotification(ctx, userID, "payment", title, message, data, "high", false)
}

// CreateStockNotification crea una notificación de stock
func (ns *NotificationService) CreateStockNotification(ctx context.Context, userID int, productID int, productName string) error {
	title := "Producto Disponible"
	message := fmt.Sprintf("¡%s está disponible nuevamente! No te pierdas esta oportunidad.", productName)

	data := NotificationData{
		ProductID:   &productID,
		ProductName: &productName,
		ActionURL:   stringPtr(fmt.Sprintf("/productos/%d", productID)),
	}

	return ns.CreateNotification(ctx, userID, "stock", title, message, data, "medium", false)
}

// CreateSecurityNotification crea una notificación de seguridad
func (ns *NotificationService) CreateSecurityNotification(ctx context.Context, userID int, event string) error {
	title := "Alerta de Seguridad"
	message := fmt.Sprintf("Se detectó actividad inusual en tu cuenta: %s. Si no fuiste tú, cambia tu contraseña inmediatamente.", event)

	data := NotificationData{
		ActionURL: stringPtr("/mi-cuenta?tab=security"),
	}

	return ns.CreateNotification(ctx, userID, "security", title, message, data, "urgent", false)
}

// CreateAdminNotification crea una notificación para administradores
func (ns *NotificationService) CreateAdminNotification(ctx context.Context, event string, details string, priority string) error {
	// Obtener todos los usuarios admin
	admins, err := db.GetAdminUsers(ns.db)
	if err != nil {
		return fmt.Errorf("error obteniendo usuarios admin: %w", err)
	}

	// Crear notificación para cada admin
	for _, admin := range admins {
		data := NotificationData{
			ActionURL: stringPtr("/admin"),
		}

		if err := ns.CreateNotification(ctx, admin.ID, "admin", event, details, data, priority, true); err != nil {
			log.Printf("Error creando notificación admin para usuario %d: %v", admin.ID, err)
		}
	}

	return nil
}

// CreateNewOrderAdminNotification notifica a los admins sobre un nuevo pedido
func (ns *NotificationService) CreateNewOrderAdminNotification(ctx context.Context, orderID int, userEmail, userName string, amount string) error {
	event := "Nuevo Pedido Recibido"
	details := fmt.Sprintf("Pedido #%d de %s (%s) por %s", orderID, userName, userEmail, amount)

	data := NotificationData{
		OrderID:   &orderID,
		UserEmail: &userEmail,
		UserName:  &userName,
		Amount:    &amount,
		ActionURL: stringPtr(fmt.Sprintf("/admin/orders")),
	}

	// Obtener todos los usuarios admin
	admins, err := db.GetAdminUsers(ns.db)
	if err != nil {
		return fmt.Errorf("error obteniendo usuarios admin: %w", err)
	}

	// Crear notificación para cada admin
	for _, admin := range admins {
		if err := ns.CreateNotification(ctx, admin.ID, "admin", event, details, data, "high", true); err != nil {
			log.Printf("Error creando notificación admin para usuario %d: %v", admin.ID, err)
		}
	}

	return nil
}

// CreateNewUserAdminNotification notifica a los admins sobre un nuevo usuario
func (ns *NotificationService) CreateNewUserAdminNotification(ctx context.Context, userEmail string) error {
	event := "Nuevo Usuario Registrado"
	details := fmt.Sprintf("Se ha registrado un nuevo usuario: %s", userEmail)

	data := NotificationData{
		UserEmail: &userEmail,
		ActionURL: stringPtr("/admin/users"),
	}

	// Obtener todos los usuarios admin
	admins, err := db.GetAdminUsers(ns.db)
	if err != nil {
		return fmt.Errorf("error obteniendo usuarios admin: %w", err)
	}

	// Crear notificación para cada admin
	for _, admin := range admins {
		if err := ns.CreateNotification(ctx, admin.ID, "admin", event, details, data, "medium", true); err != nil {
			log.Printf("Error creando notificación admin para usuario %d: %v", admin.ID, err)
		}
	}

	return nil
}

// Helper function para crear string pointers
func stringPtr(s string) *string {
	return &s
}
