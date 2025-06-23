package handlers

import (
	"fmt"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/tuusuario/ecommerce-backend/internal/db"
	"github.com/tuusuario/ecommerce-backend/internal/models"
)

// OrderHandler maneja todas las operaciones relacionadas con pedidos
type OrderHandler struct {
	DB *pgxpool.Pool
}

// NewOrderHandler crea una nueva instancia del handler de pedidos
func NewOrderHandler(db *pgxpool.Pool) *OrderHandler {
	return &OrderHandler{DB: db}
}

// CreateOrderRequest representa la solicitud para crear un pedido
type CreateOrderRequest struct {
	ShippingAddress models.Address `json:"shipping_address" binding:"required"`
	BillingAddress  models.Address `json:"billing_address" binding:"required"`
	Notes           string         `json:"notes"`
}

// CreateOrderFromCart crea un pedido desde el carrito del usuario
func (h *OrderHandler) CreateOrderFromCart(c *gin.Context) {
	log.Printf("Iniciando creación de pedido desde carrito")

	var req CreateOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("Error binding JSON: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos: " + err.Error()})
		return
	}

	log.Printf("Datos de solicitud recibidos correctamente")

	// Obtener el usuario autenticado
	userID := c.GetInt("user_id")
	if userID == 0 {
		log.Printf("Usuario no autenticado")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuario no autenticado"})
		return
	}

	log.Printf("Usuario autenticado: %d", userID)

	// Obtener el carrito del usuario
	cartID, err := db.FindOrCreateCartByUserID(h.DB, userID)
	if err != nil {
		log.Printf("Error obteniendo carrito: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error obteniendo carrito"})
		return
	}

	log.Printf("Carrito obtenido: %d", cartID)

	// Obtener los items del carrito
	cartItems, err := db.GetCartContents(h.DB, cartID)
	if err != nil {
		log.Printf("Error obteniendo items del carrito: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error obteniendo items del carrito"})
		return
	}

	log.Printf("Items del carrito obtenidos: %d items", len(cartItems))

	if len(cartItems) == 0 {
		log.Printf("Carrito vacío")
		c.JSON(http.StatusBadRequest, gin.H{"error": "El carrito está vacío"})
		return
	}

	// Calcular totales
	var subtotal float64
	var orderItems []models.OrderItem

	log.Printf("Calculando totales...")
	for _, item := range cartItems {
		log.Printf("Procesando item: ProductID=%d, Quantity=%d", item.ProductID, item.Quantity)

		// Obtener el producto para el precio actual
		product, err := db.GetProductByID(h.DB, item.ProductID)
		if err != nil {
			log.Printf("Error obteniendo producto %d: %v", item.ProductID, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error obteniendo producto"})
			return
		}

		log.Printf("Producto obtenido: %s, Precio: %.2f", product.Name, product.Price)

		itemSubtotal := product.Price * float64(item.Quantity)
		subtotal += itemSubtotal

		// Crear item de pedido
		orderItem := models.OrderItem{
			ProductID: item.ProductID,
			Quantity:  item.Quantity,
			Price:     product.Price,
			Subtotal:  itemSubtotal,
		}
		orderItems = append(orderItems, orderItem)
	}

	log.Printf("Subtotal calculado: %.2f", subtotal)

	// Calcular impuestos y envío (simplificado)
	tax := subtotal * 0.16 // 16% IVA
	shipping := 0.0        // Envío gratuito por ahora
	total := subtotal + tax + shipping

	log.Printf("Totales finales: Tax=%.2f, Shipping=%.2f, Total=%.2f", tax, shipping, total)

	// Generar número de pedido único
	orderNumber := fmt.Sprintf("ORD-%d-%d", time.Now().Unix(), userID)
	log.Printf("Número de pedido generado: %s", orderNumber)

	// Crear el pedido
	order := &models.Order{
		UserID:          userID,
		OrderNumber:     orderNumber,
		Status:          "pending",
		Subtotal:        subtotal,
		Tax:             tax,
		Shipping:        shipping,
		Total:           total,
		Currency:        "USD",
		PaymentStatus:   "pending",
		ShippingAddress: &req.ShippingAddress,
		BillingAddress:  &req.BillingAddress,
		Notes:           req.Notes,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}

	log.Printf("Creando pedido en base de datos...")
	// Guardar el pedido en la base de datos
	err = db.CreateOrder(h.DB, order)
	if err != nil {
		log.Printf("Error creando pedido: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error creando pedido: " + err.Error()})
		return
	}

	log.Printf("Pedido creado con ID: %d", order.ID)

	// Guardar los items del pedido
	log.Printf("Guardando items del pedido...")
	for i := range orderItems {
		orderItems[i].OrderID = order.ID
		log.Printf("Guardando item %d: ProductID=%d, Quantity=%d, Price=%.2f",
			i+1, orderItems[i].ProductID, orderItems[i].Quantity, orderItems[i].Price)

		err = db.SaveOrderItem(h.DB, &orderItems[i])
		if err != nil {
			log.Printf("Error guardando item de pedido %d: %v", i+1, err)
			// Continuar con los demás items
		} else {
			log.Printf("Item %d guardado correctamente", i+1)
		}
	}

	// Limpiar el carrito después de crear el pedido
	log.Printf("Limpiando carrito...")
	for _, item := range cartItems {
		err = db.RemoveItemFromCart(h.DB, item.ID)
		if err != nil {
			log.Printf("Error removiendo item del carrito: %v", err)
		}
	}

	log.Printf("Pedido creado exitosamente")
	c.JSON(http.StatusCreated, gin.H{
		"order": gin.H{
			"id":             order.ID,
			"order_number":   order.OrderNumber,
			"total":          order.Total,
			"currency":       order.Currency,
			"status":         order.Status,
			"payment_status": order.PaymentStatus,
			"created_at":     order.CreatedAt,
		},
		"message": "Pedido creado exitosamente",
	})
}

// GetUserOrders obtiene todos los pedidos del usuario autenticado
func (h *OrderHandler) GetUserOrders(c *gin.Context) {
	// Obtener el usuario autenticado
	userID := c.GetInt("user_id")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuario no autenticado"})
		return
	}

	// Obtener los pedidos del usuario
	orders, err := db.GetUserOrders(h.DB, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error obteniendo pedidos"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"orders": orders,
	})
}

// GetOrderDetails obtiene los detalles completos de un pedido
func (h *OrderHandler) GetOrderDetails(c *gin.Context) {
	// Obtener el usuario autenticado
	userID := c.GetInt("user_id")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuario no autenticado"})
		return
	}

	// Obtener el ID del pedido de la URL
	orderIDStr := c.Param("orderID")
	orderID, err := strconv.Atoi(orderIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de pedido inválido"})
		return
	}

	// Obtener el pedido
	order, err := db.GetOrderByID(h.DB, orderID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pedido no encontrado"})
		return
	}

	// Verificar que el pedido pertenece al usuario
	if order.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "No tienes permisos para ver este pedido"})
		return
	}

	// Obtener los items del pedido
	orderItems, err := db.GetOrderItems(h.DB, orderID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error obteniendo items del pedido"})
		return
	}

	// Obtener los pagos del pedido
	payments, err := db.GetOrderPayments(h.DB, orderID)
	if err != nil {
		log.Printf("Error obteniendo pagos del pedido: %v", err)
		// No fallar si no hay pagos
	}

	// Asignar items y pagos al pedido
	order.Items = orderItems
	if len(payments) > 0 {
		order.Payment = &payments[0] // Tomar el pago más reciente
	}

	c.JSON(http.StatusOK, gin.H{
		"order": order,
	})
}

// CancelOrder cancela un pedido (solo si está pendiente)
func (h *OrderHandler) CancelOrder(c *gin.Context) {
	// Obtener el usuario autenticado
	userID := c.GetInt("user_id")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuario no autenticado"})
		return
	}

	// Obtener el ID del pedido de la URL
	orderIDStr := c.Param("orderID")
	orderID, err := strconv.Atoi(orderIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de pedido inválido"})
		return
	}

	// Obtener el pedido
	order, err := db.GetOrderByID(h.DB, orderID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pedido no encontrado"})
		return
	}

	// Verificar que el pedido pertenece al usuario
	if order.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "No tienes permisos para cancelar este pedido"})
		return
	}

	// Verificar que el pedido se puede cancelar
	if order.Status != "pending" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Solo se pueden cancelar pedidos pendientes"})
		return
	}

	// Cancelar el pedido
	err = db.UpdateOrderStatus(h.DB, orderID, "cancelled")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error cancelando pedido"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":  "Pedido cancelado exitosamente",
		"order_id": orderID,
	})
}
