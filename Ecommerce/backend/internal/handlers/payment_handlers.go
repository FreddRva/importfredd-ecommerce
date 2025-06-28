package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/stripe/stripe-go/v74"
	"github.com/stripe/stripe-go/v74/customer"
	"github.com/stripe/stripe-go/v74/paymentintent"
	"github.com/tuusuario/ecommerce-backend/internal/db"
	"github.com/tuusuario/ecommerce-backend/internal/email"
	"github.com/tuusuario/ecommerce-backend/internal/models"
)

// PaymentHandler maneja todas las operaciones relacionadas con pagos
type PaymentHandler struct {
	DB              *pgxpool.Pool
	EmailService    *email.EmailService
	NotificationSvc *email.NotificationService
}

// NewPaymentHandler crea una nueva instancia del handler de pagos
func NewPaymentHandler(db *pgxpool.Pool) *PaymentHandler {
	// Configurar Stripe con la clave secreta
	stripe.Key = os.Getenv("STRIPE_SECRET_KEY")
	if stripe.Key == "" {
		log.Println("⚠️  STRIPE_SECRET_KEY no configurada. Usando clave de prueba.")
		stripe.Key = "sk_test_..." // Clave de prueba - cambiar en producción
	} else {
		log.Println("✅ STRIPE_SECRET_KEY configurada correctamente")
	}

	// Inicializar servicio de email
	emailService := email.NewEmailService()

	notificationSvc := email.NewNotificationService(db, email.DefaultEmailService)

	return &PaymentHandler{
		DB:              db,
		EmailService:    emailService,
		NotificationSvc: notificationSvc,
	}
}

// CreatePaymentIntentRequest representa la solicitud para crear un PaymentIntent
type CreatePaymentIntentRequest struct {
	Amount        int64  `json:"amount" binding:"required,min=1"`         // Monto en centavos
	Currency      string `json:"currency" binding:"required"`             // Moneda (usd, eur, etc.)
	OrderID       int    `json:"order_id" binding:"required"`             // ID del pedido
	Description   string `json:"description"`                             // Descripción del pago
	CustomerEmail string `json:"customer_email" binding:"required,email"` // Email del cliente
}

// CreatePaymentIntent crea un PaymentIntent de Stripe
func (h *PaymentHandler) CreatePaymentIntent(c *gin.Context) {
	var req CreatePaymentIntentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("Error binding JSON: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos: " + err.Error()})
		return
	}

	log.Printf("Creando PaymentIntent para pedido %d, monto: %d %s", req.OrderID, req.Amount, req.Currency)

	// Obtener el usuario autenticado
	userID := c.GetInt("user_id")
	if userID == 0 {
		log.Printf("Usuario no autenticado")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuario no autenticado"})
		return
	}

	log.Printf("Usuario autenticado: %d", userID)

	// Verificar que el pedido existe y pertenece al usuario
	order, err := db.GetOrderByID(h.DB, req.OrderID)
	if err != nil {
		log.Printf("Error obteniendo pedido %d: %v", req.OrderID, err)
		c.JSON(http.StatusNotFound, gin.H{"error": "Pedido no encontrado"})
		return
	}

	if order.UserID != userID {
		log.Printf("Pedido %d no pertenece al usuario %d", req.OrderID, userID)
		c.JSON(http.StatusForbidden, gin.H{"error": "No tienes permisos para este pedido"})
		return
	}

	// Verificar que el pedido no tenga un pago exitoso
	if order.PaymentStatus == "paid" {
		log.Printf("Pedido %d ya está pagado", req.OrderID)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Este pedido ya ha sido pagado"})
		return
	}

	log.Printf("Creando cliente de Stripe para email: %s", req.CustomerEmail)

	// Crear o obtener el cliente de Stripe
	stripeCustomer, err := h.getOrCreateStripeCustomer(req.CustomerEmail, userID)
	if err != nil {
		log.Printf("Error creando cliente de Stripe: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error creando cliente: " + err.Error()})
		return
	}

	log.Printf("Cliente de Stripe creado/obtenido: %s", stripeCustomer.ID)

	// Crear el PaymentIntent
	params := &stripe.PaymentIntentParams{
		Amount:      stripe.Int64(req.Amount),
		Currency:    stripe.String(req.Currency),
		Customer:    stripe.String(stripeCustomer.ID),
		Description: stripe.String(req.Description),
		AutomaticPaymentMethods: &stripe.PaymentIntentAutomaticPaymentMethodsParams{
			Enabled: stripe.Bool(true),
		},
	}

	// Agregar metadata como parámetros separados
	params.AddMetadata("order_id", strconv.Itoa(req.OrderID))
	params.AddMetadata("user_id", strconv.Itoa(userID))

	log.Printf("Creando PaymentIntent con Stripe...")
	pi, err := paymentintent.New(params)
	if err != nil {
		log.Printf("Error creando PaymentIntent: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error procesando pago"})
		return
	}

	log.Printf("PaymentIntent creado exitosamente: %s", pi.ID)

	// Guardar el PaymentIntent en la base de datos
	payment := &models.Payment{
		OrderID:               req.OrderID,
		PaymentMethod:         "stripe",
		Amount:                float64(req.Amount) / 100, // Convertir de centavos
		Currency:              req.Currency,
		Status:                "pending",
		StripePaymentIntentID: pi.ID,
		StripeCustomerID:      stripeCustomer.ID,
		CreatedAt:             time.Now(),
		UpdatedAt:             time.Now(),
	}

	err = db.SavePayment(h.DB, payment)
	if err != nil {
		log.Printf("Error guardando pago: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error guardando pago"})
		return
	}

	// Actualizar el estado del pedido
	err = db.UpdateOrderPaymentStatus(h.DB, req.OrderID, "pending")
	if err != nil {
		log.Printf("Error actualizando estado del pedido: %v", err)
	}

	c.JSON(http.StatusOK, gin.H{
		"client_secret":     pi.ClientSecret,
		"payment_intent_id": pi.ID,
		"amount":            req.Amount,
		"currency":          req.Currency,
		"status":            "pending",
	})
}

// ConfirmPayment confirma un pago exitoso
func (h *PaymentHandler) ConfirmPayment(c *gin.Context) {
	var req struct {
		PaymentIntentID string `json:"payment_intent_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "Payment Intent ID requerido"})
		return
	}

	// Obtener el PaymentIntent de Stripe
	pi, err := paymentintent.Get(req.PaymentIntentID, nil)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "Payment Intent no encontrado"})
		return
	}

	// Obtener el pago de la base de datos
	payment, err := db.GetPaymentByStripeIntentID(h.DB, req.PaymentIntentID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "error": "Pago no encontrado"})
		return
	}

	// Verificar que el usuario autenticado es el propietario del pedido
	userID := c.GetInt("user_id")
	order, err := db.GetOrderByID(h.DB, payment.OrderID)
	if err != nil || order.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"success": false, "error": "No tienes permisos para este pago"})
		return
	}

	// Actualizar el estado del pago según el PaymentIntent
	var newStatus string
	switch pi.Status {
	case stripe.PaymentIntentStatusSucceeded:
		newStatus = "succeeded"
		// Actualizar el pedido como pagado
		err = db.UpdateOrderPaymentStatus(h.DB, payment.OrderID, "paid")
		if err != nil {
			log.Printf("Error actualizando estado del pedido: %v", err)
		}

		// Enviar emails de confirmación inmediatamente
		go h.sendConfirmationEmails(payment.OrderID)

	case stripe.PaymentIntentStatusCanceled:
		newStatus = "canceled"
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "El pago fue cancelado"})
		return
	case stripe.PaymentIntentStatusRequiresPaymentMethod:
		newStatus = "requires_payment_method"
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "El método de pago no es válido o fue rechazado"})
		return
	default:
		newStatus = "pending"
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "El pago está pendiente o en estado desconocido"})
		return
	}

	// Actualizar el pago en la base de datos
	payment.Status = newStatus
	payment.TransactionID = pi.ID
	payment.UpdatedAt = time.Now()

	err = db.UpdatePayment(h.DB, payment)
	if err != nil {
		log.Printf("Error actualizando pago: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Error actualizando pago"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":           true,
		"status":            newStatus,
		"payment_intent_id": pi.ID,
		"amount":            pi.Amount,
		"currency":          pi.Currency,
	})
}

// GetPaymentStatus obtiene el estado de un pago
func (h *PaymentHandler) GetPaymentStatus(c *gin.Context) {
	paymentIntentID := c.Param("paymentIntentId")
	if paymentIntentID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Payment Intent ID requerido"})
		return
	}

	// Obtener el pago de la base de datos
	payment, err := db.GetPaymentByStripeIntentID(h.DB, paymentIntentID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pago no encontrado"})
		return
	}

	// Verificar que el usuario autenticado es el propietario
	userID := c.GetInt("user_id")
	order, err := db.GetOrderByID(h.DB, payment.OrderID)
	if err != nil || order.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "No tienes permisos para ver este pago"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":     payment.Status,
		"amount":     payment.Amount,
		"currency":   payment.Currency,
		"created_at": payment.CreatedAt,
		"updated_at": payment.UpdatedAt,
	})
}

// getOrCreateStripeCustomer obtiene o crea un cliente de Stripe
func (h *PaymentHandler) getOrCreateStripeCustomer(email string, userID int) (*stripe.Customer, error) {
	// Buscar cliente existente por email
	params := &stripe.CustomerListParams{}
	params.Filters.AddFilter("email", "", email)

	i := customer.List(params)
	for i.Next() {
		customer := i.Customer()
		if customer.Email == email {
			return customer, nil
		}
	}

	// Crear nuevo cliente
	customerParams := &stripe.CustomerParams{
		Email: stripe.String(email),
	}
	customerParams.AddMetadata("user_id", strconv.Itoa(userID))

	return customer.New(customerParams)
}

// StripeWebhook maneja los webhooks de Stripe
func (h *PaymentHandler) StripeWebhook(c *gin.Context) {
	// En producción, verificar la firma del webhook
	// body, err := io.ReadAll(c.Request.Body)
	// if err != nil {
	//     c.JSON(http.StatusBadRequest, gin.H{"error": "Error leyendo body"})
	//     return
	// }
	//
	// event, err := webhook.ConstructEvent(body, c.GetHeader("Stripe-Signature"), os.Getenv("STRIPE_WEBHOOK_SECRET"))
	// if err != nil {
	//     c.JSON(http.StatusBadRequest, gin.H{"error": "Firma inválida"})
	//     return
	// }

	// Por ahora, procesar el evento directamente
	var event stripe.Event
	if err := c.ShouldBindJSON(&event); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Error parsing event"})
		return
	}

	switch event.Type {
	case "payment_intent.succeeded":
		var paymentIntent stripe.PaymentIntent
		err := json.Unmarshal(event.Data.Raw, &paymentIntent)
		if err != nil {
			log.Printf("Error parsing payment_intent.succeeded: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Error parsing event"})
			return
		}
		h.handlePaymentSucceeded(&paymentIntent)

	case "payment_intent.payment_failed":
		var paymentIntent stripe.PaymentIntent
		err := json.Unmarshal(event.Data.Raw, &paymentIntent)
		if err != nil {
			log.Printf("Error parsing payment_intent.payment_failed: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Error parsing event"})
			return
		}
		h.handlePaymentFailed(&paymentIntent)
	}

	c.JSON(http.StatusOK, gin.H{"status": "received"})
}

// handlePaymentSucceeded maneja un pago exitoso
func (h *PaymentHandler) handlePaymentSucceeded(pi *stripe.PaymentIntent) {
	// Obtener el pago de la base de datos
	payment, err := db.GetPaymentByStripeIntentID(h.DB, pi.ID)
	if err != nil {
		log.Printf("Error obteniendo pago para PaymentIntent %s: %v", pi.ID, err)
		return
	}

	// Actualizar el pago como exitoso
	payment.Status = "succeeded"
	payment.TransactionID = pi.ID
	payment.UpdatedAt = time.Now()

	err = db.UpdatePayment(h.DB, payment)
	if err != nil {
		log.Printf("Error actualizando pago: %v", err)
		return
	}

	// Actualizar el pedido como pagado
	err = db.UpdateOrderPaymentStatus(h.DB, payment.OrderID, "paid")
	if err != nil {
		log.Printf("Error actualizando estado del pedido: %v", err)
	}

	log.Printf("Pago exitoso para PaymentIntent %s, OrderID %d", pi.ID, payment.OrderID)

	// Enviar emails de confirmación
	go h.sendConfirmationEmails(payment.OrderID)
}

// sendConfirmationEmails envía los emails de confirmación
func (h *PaymentHandler) sendConfirmationEmails(orderID int) {
	// Obtener el pedido con items y usuario
	order, err := db.GetOrderByID(h.DB, orderID)
	if err != nil {
		log.Printf("Error obteniendo pedido %d para email: %v", orderID, err)
		return
	}

	// Obtener el usuario
	user, err := db.GetUserByID(h.DB, order.UserID)
	if err != nil {
		log.Printf("Error obteniendo usuario %d para email: %v", order.UserID, err)
		return
	}

	// Obtener el pago
	payments, err := db.GetOrderPayments(h.DB, orderID)
	if err != nil || len(payments) == 0 {
		log.Printf("Error obteniendo pagos para pedido %d: %v", orderID, err)
		return
	}

	// Enviar email de confirmación de pedido
	if h.EmailService != nil {
		err = h.EmailService.SendOrderConfirmation(user, order)
		if err != nil {
			log.Printf("Error enviando email de confirmación de pedido: %v", err)
		}

		// Enviar email de confirmación de pago
		err = h.EmailService.SendPaymentConfirmation(user, &payments[0])
		if err != nil {
			log.Printf("Error enviando email de confirmación de pago: %v", err)
		}
	}
}

// handlePaymentFailed maneja un pago fallido
func (h *PaymentHandler) handlePaymentFailed(pi *stripe.PaymentIntent) {
	// Obtener el pago de la base de datos
	payment, err := db.GetPaymentByStripeIntentID(h.DB, pi.ID)
	if err != nil {
		log.Printf("Error obteniendo pago para PaymentIntent %s: %v", pi.ID, err)
		return
	}

	// Obtener el pedido para tener información del usuario
	order, err := db.GetOrderByID(h.DB, payment.OrderID)
	if err != nil {
		log.Printf("Error obteniendo pedido %d para notificación: %v", payment.OrderID, err)
		return
	}

	// Actualizar el pago como fallido
	payment.Status = "failed"
	payment.ErrorMessage = "Pago rechazado por el banco"
	payment.UpdatedAt = time.Now()

	err = db.UpdatePayment(h.DB, payment)
	if err != nil {
		log.Printf("Error actualizando pago: %v", err)
		return
	}

	// Actualizar el estado del pedido como fallido
	err = db.UpdateOrderPaymentStatus(h.DB, payment.OrderID, "failed")
	if err != nil {
		log.Printf("Error actualizando estado del pedido: %v", err)
	}

	log.Printf("Pago fallido para PaymentIntent %s, OrderID %d", pi.ID, payment.OrderID)

	// Enviar notificación al usuario sobre el problema de pago
	amount := fmt.Sprintf("%.2f %s", payment.Amount, payment.Currency)
	if err := h.NotificationSvc.CreatePaymentFailedNotification(context.Background(), order.UserID, payment.OrderID, amount, payment.Currency, payment.ErrorMessage); err != nil {
		log.Printf("Error enviando notificación de pago fallido: %v", err)
	}

	// Enviar notificación a los admins sobre el pago fallido
	user, err := db.GetUserByID(h.DB, order.UserID)
	if err != nil {
		log.Printf("Error obteniendo usuario para notificación admin: %v", err)
	} else {
		if err := h.NotificationSvc.CreatePaymentFailedAdminNotification(context.Background(), payment.OrderID, user.Email, amount, payment.ErrorMessage); err != nil {
			log.Printf("Error enviando notificación admin de pago fallido: %v", err)
		}
	}
}

// TestEmailEndpoint endpoint de prueba para enviar emails
func (h *PaymentHandler) TestEmailEndpoint(c *gin.Context) {
	// Obtener el usuario autenticado
	userID := c.GetInt("user_id")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuario no autenticado"})
		return
	}

	// Obtener el usuario
	user, err := db.GetUserByID(h.DB, userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Usuario no encontrado"})
		return
	}

	// Crear datos de prueba
	testOrder := &models.Order{
		ID:            999,
		UserID:        userID,
		OrderNumber:   "TEST-123",
		Status:        "paid",
		Subtotal:      100.00,
		Tax:           16.00,
		Shipping:      0.00,
		Total:         116.00,
		Currency:      "USD",
		PaymentStatus: "paid",
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
		Items: []models.OrderItem{
			{
				ID:        1,
				OrderID:   999,
				ProductID: 1,
				Quantity:  1,
				Price:     100.00,
				Subtotal:  100.00,
				Product: &models.Product{
					ID:   1,
					Name: "Producto de Prueba",
				},
			},
		},
	}

	testPayment := &models.Payment{
		ID:            1,
		OrderID:       999,
		PaymentMethod: "stripe",
		Amount:        116.00,
		Currency:      "USD",
		Status:        "succeeded",
		TransactionID: "txn_test_123",
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	// Enviar emails de prueba
	if h.EmailService != nil {
		err = h.EmailService.SendOrderConfirmation(user, testOrder)
		if err != nil {
			log.Printf("Error enviando email de prueba de pedido: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error enviando email de pedido: " + err.Error()})
			return
		}

		err = h.EmailService.SendPaymentConfirmation(user, testPayment)
		if err != nil {
			log.Printf("Error enviando email de prueba de pago: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error enviando email de pago: " + err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message": "Emails de prueba enviados correctamente",
			"to":      user.Email,
		})
	} else {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Servicio de email no configurado"})
	}
}
