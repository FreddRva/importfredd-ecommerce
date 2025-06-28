package email

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strings"
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

	// Determinar asunto según tipo
	var subject string

	switch notification.Type {
	case "order":
		subject = "Actualización de tu pedido"
	case "payment":
		subject = "Confirmación de pago"
	case "stock":
		subject = "Producto disponible"
	case "security":
		subject = "Alerta de seguridad"
	case "admin":
		subject = "Notificación administrativa"
	default:
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

	// Generar HTML del email
	htmlContent := generateNotificationEmailHTML(notification, templateData)

	// Enviar email
	if err := ns.emailSvc.SendEmail(user.Email, subject, htmlContent); err != nil {
		log.Printf("Error enviando notificación por email: %v", err)
	}
}

// generateNotificationEmailHTML genera el HTML del email de notificación
func generateNotificationEmailHTML(notification *models.Notification, data map[string]interface{}) string {
	priorityColor := "blue"
	switch notification.Priority {
	case "urgent":
		priorityColor = "red"
	case "high":
		priorityColor = "orange"
	case "medium":
		priorityColor = "blue"
	case "low":
		priorityColor = "green"
	}

	actionButton := ""
	if actionURL, ok := data["ActionURL"].(*string); ok && actionURL != nil {
		actionButton = fmt.Sprintf(`
			<div style="text-align: center; margin: 20px 0;">
				<a href="%s" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
					Ver Detalles
				</a>
			</div>
		`, *actionURL)
	}

	return fmt.Sprintf(`
		<!DOCTYPE html>
		<html>
		<head>
			<meta charset="utf-8">
			<title>%s</title>
			<style>
				body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
				.container { max-width: 600px; margin: 0 auto; background: #f9f9f9; }
				.header { background: %s; color: white; padding: 20px; text-align: center; }
				.content { padding: 20px; background: white; margin: 20px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
				.priority { display: inline-block; padding: 4px 8px; background: %s; color: white; border-radius: 3px; font-size: 12px; margin-bottom: 10px; }
				.footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
			</style>
		</head>
		<body>
			<div class="container">
				<div class="header">
					<h1>%s</h1>
				</div>
				<div class="content">
					<div class="priority">%s</div>
					<h2>Hola,</h2>
					<p>%s</p>
					%s
					<p><strong>Fecha:</strong> %s</p>
				</div>
				<div class="footer">
					<p>Este es un email automático, por favor no respondas a este mensaje.</p>
					<p>Si tienes preguntas, contacta con nuestro soporte.</p>
				</div>
			</div>
		</body>
		</html>
	`, notification.Title, priorityColor, priorityColor, notification.Title,
		strings.Title(notification.Priority), notification.Message, actionButton,
		data["CreatedAt"].(string))
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

// CreateOrderTrackingNotification crea una notificación específica de tracking
func (ns *NotificationService) CreateOrderTrackingNotification(ctx context.Context, userID int, orderID int, status, orderNumber, tracking string) error {
	var title, message string
	var priority string

	switch status {
	case "shipped":
		title = "¡Tu Pedido Está En Camino!"
		message = fmt.Sprintf("Tu pedido #%s ha sido enviado y está en camino. Número de seguimiento: %s", orderNumber, tracking)
		priority = "high"
	default:
		title = "Información de Seguimiento Actualizada"
		message = fmt.Sprintf("Se ha actualizado la información de seguimiento de tu pedido #%s. Número de seguimiento: %s", orderNumber, tracking)
		priority = "medium"
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

// CreatePaymentFailedNotification crea una notificación de pago fallido
func (ns *NotificationService) CreatePaymentFailedNotification(ctx context.Context, userID int, orderID int, amount, currency, errorMessage string) error {
	title := "Problema con el Pago"
	message := fmt.Sprintf("Hubo un problema con tu pago de %s %s. Error: %s. Por favor, verifica tu método de pago e intenta nuevamente.", currency, amount, errorMessage)

	data := NotificationData{
		OrderID:   &orderID,
		Amount:    &amount,
		ActionURL: stringPtr(fmt.Sprintf("/mi-cuenta?tab=orders")),
	}

	return ns.CreateNotification(ctx, userID, "payment", title, message, data, "urgent", false)
}

// CreatePaymentFailedAdminNotification notifica a los admins sobre un pago fallido
func (ns *NotificationService) CreatePaymentFailedAdminNotification(ctx context.Context, orderID int, userEmail, amount, errorMessage string) error {
	event := "Pago Fallido"
	details := fmt.Sprintf("Pago fallido para pedido #%d de %s por %s. Error: %s", orderID, userEmail, amount, errorMessage)

	data := NotificationData{
		OrderID:   &orderID,
		UserEmail: &userEmail,
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
		if err := ns.CreateNotification(ctx, admin.ID, "admin", event, details, data, "urgent", true); err != nil {
			log.Printf("Error creando notificación admin de pago fallido para usuario %d: %v", admin.ID, err)
		}
	}

	return nil
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

// CreateLowStockAdminNotification notifica a los admins sobre stock bajo
func (ns *NotificationService) CreateLowStockAdminNotification(ctx context.Context, productID int, productName string, currentStock int) error {
	event := "Stock Bajo"
	details := fmt.Sprintf("El producto '%s' tiene stock bajo: %d unidades restantes", productName, currentStock)

	data := NotificationData{
		ProductID:   &productID,
		ProductName: &productName,
		ActionURL:   stringPtr(fmt.Sprintf("/admin/products")),
	}

	// Obtener todos los usuarios admin
	admins, err := db.GetAdminUsers(ns.db)
	if err != nil {
		return fmt.Errorf("error obteniendo usuarios admin: %w", err)
	}

	// Crear notificación para cada admin
	for _, admin := range admins {
		if err := ns.CreateNotification(ctx, admin.ID, "admin", event, details, data, "high", true); err != nil {
			log.Printf("Error creando notificación de stock bajo para admin %d: %v", admin.ID, err)
		}
	}

	return nil
}

// CreateOutOfStockAdminNotification notifica a los admins sobre producto agotado
func (ns *NotificationService) CreateOutOfStockAdminNotification(ctx context.Context, productID int, productName string) error {
	event := "Producto Agotado"
	details := fmt.Sprintf("El producto '%s' se ha agotado completamente", productName)

	data := NotificationData{
		ProductID:   &productID,
		ProductName: &productName,
		ActionURL:   stringPtr(fmt.Sprintf("/admin/products")),
	}

	// Obtener todos los usuarios admin
	admins, err := db.GetAdminUsers(ns.db)
	if err != nil {
		return fmt.Errorf("error obteniendo usuarios admin: %w", err)
	}

	// Crear notificación para cada admin
	for _, admin := range admins {
		if err := ns.CreateNotification(ctx, admin.ID, "admin", event, details, data, "urgent", true); err != nil {
			log.Printf("Error creando notificación de producto agotado para admin %d: %v", admin.ID, err)
		}
	}

	return nil
}

// CreateSecurityNotification crea una notificación de seguridad
func (ns *NotificationService) CreateSecurityNotification(ctx context.Context, userID int, event string) error {
	var title, message string

	// Detectar si es un login normal vs actividad sospechosa
	if strings.Contains(event, "Nuevo inicio de sesión") {
		title = "Inicio de Sesión Exitoso"
		message = fmt.Sprintf("Se ha iniciado sesión en tu cuenta desde: %s. Si no fuiste tú, contacta con soporte.", strings.TrimPrefix(event, "Nuevo inicio de sesión desde "))
	} else {
		title = "Alerta de Seguridad"
		message = fmt.Sprintf("Se detectó actividad inusual en tu cuenta: %s. Si no fuiste tú, cambia tu contraseña inmediatamente.", event)
	}

	data := NotificationData{
		ActionURL: stringPtr("/mi-cuenta?tab=security"),
	}

	return ns.CreateNotification(ctx, userID, "security", title, message, data, "medium", false)
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
