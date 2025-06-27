package handlers

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/tuusuario/ecommerce-backend/internal/db"
	"github.com/tuusuario/ecommerce-backend/internal/models"
)

type Handler struct {
	DB *pgxpool.Pool
}

func NewHandler(db *pgxpool.Pool) *Handler {
	return &Handler{DB: db}
}

// ---------------------------
// PRODUCTOS
// ---------------------------

// Crear producto
func (h *Handler) CreateProduct(c *gin.Context) {
	var p models.Product
	if err := c.ShouldBindJSON(&p); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	query := `
        INSERT INTO products (name, description, price, category_id)
        VALUES ($1, $2, $3, $4) RETURNING id, created_at
    `
	err := h.DB.QueryRow(context.Background(), query,
		p.Name, p.Description, p.Price, p.CategoryID,
	).Scan(&p.ID, &p.CreatedAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al insertar producto"})
		return
	}

	c.JSON(http.StatusCreated, p)
}

// Obtener productos
func (h *Handler) GetProducts(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "12")) // Default a 12 para que se vea bien en grillas de 3 o 4
	categoryID, _ := strconv.Atoi(c.DefaultQuery("category_id", "0"))
	sortBy := c.DefaultQuery("sort_by", "created_at")
	order := c.DefaultQuery("order", "desc")
	search := c.DefaultQuery("search", "")

	// Filtrar por productos destacados
	featuredParam := c.Query("featured")
	var featuredOnly bool
	if featuredParam == "true" {
		featuredOnly = true
	}

	products, total, err := db.GetPublicProducts(h.DB, page, limit, categoryID, sortBy, order, search, featuredOnly)
	if err != nil {
		log.Printf("Error al obtener productos: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener productos"})
		return
	}

	if products == nil {
		products = []models.Product{}
	}
	c.JSON(http.StatusOK, gin.H{
		"products": products,
		"total":    total,
		"page":     page,
		"limit":    limit,
	})
}

// GetProduct obtiene un producto por su ID.
func (h *Handler) GetProduct(c *gin.Context) {
	productID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de producto inválido"})
		return
	}

	product, err := db.GetProductByID(h.DB, productID)
	if err != nil {
		if err.Error() == "no rows in result set" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Producto no encontrado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error obteniendo producto: " + err.Error()})
		return
	}

	// Asegurarse de que el producto esté activo
	if !product.IsActive {
		c.JSON(http.StatusNotFound, gin.H{"error": "Producto no encontrado"}) // Mismo error para no dar pistas
		return
	}

	c.JSON(http.StatusOK, product)
}

// ---------------------------
// USUARIOS
// ---------------------------

// Crear usuario
func (h *Handler) CreateUser(c *gin.Context) {
	var u models.User
	if err := c.ShouldBindJSON(&u); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	query := `INSERT INTO users (email) VALUES ($1) RETURNING id, created_at`
	err := h.DB.QueryRow(context.Background(), query, u.Email).Scan(&u.ID, &u.CreatedAt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al crear usuario"})
		return
	}

	c.JSON(http.StatusCreated, u)
}

// Obtener usuarios
func (h *Handler) GetUsers(c *gin.Context) {
	rows, err := h.DB.Query(context.Background(),
		`SELECT id, email, created_at FROM users`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener usuarios"})
		return
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var u models.User
		err := rows.Scan(&u.ID, &u.Email, &u.CreatedAt)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error leyendo usuarios"})
			return
		}
		users = append(users, u)
	}

	c.JSON(http.StatusOK, users)
}

// ---------------------------
// CATEGORÍAS
// ---------------------------

// Crear categoría
func (h *Handler) CreateCategory(c *gin.Context) {
	var cat models.Category
	if err := c.ShouldBindJSON(&cat); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	query := `INSERT INTO categories (name) VALUES ($1) RETURNING id, created_at`
	err := h.DB.QueryRow(context.Background(), query, cat.Name).Scan(&cat.ID, &cat.CreatedAt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al crear categoría"})
		return
	}

	c.JSON(http.StatusCreated, cat)
}

// Obtener categorías
func (h *Handler) GetCategories(c *gin.Context) {
	rows, err := h.DB.Query(context.Background(),
		`SELECT id, name, created_at FROM categories`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener categorías"})
		return
	}
	defer rows.Close()

	var cats []models.Category
	for rows.Next() {
		var cat models.Category // ⚠️ NO uses `c` aquí
		err := rows.Scan(&cat.ID, &cat.Name, &cat.CreatedAt)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error leyendo categorías"})
			return
		}
		cats = append(cats, cat)
	}

	c.JSON(http.StatusOK, cats)
}

// Obtener categorías con conteo de productos activos
func (h *Handler) GetCategoriesWithProductCount(c *gin.Context) {
	rows, err := h.DB.Query(c, `
		SELECT c.id, c.name, COUNT(p.id) as product_count
		FROM categories c
		LEFT JOIN products p ON p.category_id = c.id AND p.is_active = true
		GROUP BY c.id, c.name
		ORDER BY c.name ASC
	`)
	if err != nil {
		c.JSON(500, gin.H{"error": "Error obteniendo categorías"})
		return
	}
	defer rows.Close()

	var categories []map[string]interface{}
	for rows.Next() {
		var id int
		var name string
		var count int
		if err := rows.Scan(&id, &name, &count); err != nil {
			continue
		}
		categories = append(categories, map[string]interface{}{
			"id":    id,
			"name":  name,
			"count": count,
		})
	}
	c.JSON(200, gin.H{"categories": categories})
}

// ---------------------------
// PERFIL DE USUARIO
// ---------------------------

// Obtener perfil del usuario actual
func (h *Handler) GetUserProfile(c *gin.Context) {
	userID := c.GetInt("user_id")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuario no autenticado"})
		return
	}

	user, err := db.GetUserByID(h.DB, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener perfil del usuario"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"mensaje":      "Perfil obtenido exitosamente",
		"user_id":      user.ID,
		"email":        user.Email,
		"nombre":       user.Nombre,
		"apellido":     user.Apellido,
		"telefono":     user.Telefono,
		"avatar":       user.Avatar,
		"preferencias": user.Preferencias,
		"created_at":   user.CreatedAt,
		"updated_at":   user.UpdatedAt,
	})
}

// Actualizar perfil del usuario
func (h *Handler) UpdateUserProfile(c *gin.Context) {
	userID := c.GetInt("user_id")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuario no autenticado"})
		return
	}

	var updateData struct {
		Nombre       *string `json:"nombre"`
		Apellido     *string `json:"apellido"`
		Telefono     *string `json:"telefono"`
		Avatar       *string `json:"avatar"`
		Preferencias *string `json:"preferencias"`
	}

	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos: " + err.Error()})
		return
	}

	// Crear mapa de actualizaciones
	updates := make(map[string]interface{})
	if updateData.Nombre != nil {
		updates["nombre"] = *updateData.Nombre
	}
	if updateData.Apellido != nil {
		updates["apellido"] = *updateData.Apellido
	}
	if updateData.Telefono != nil {
		updates["telefono"] = *updateData.Telefono
	}
	if updateData.Avatar != nil {
		updates["avatar"] = *updateData.Avatar
	}
	if updateData.Preferencias != nil {
		updates["preferencias"] = *updateData.Preferencias
	}

	// Actualizar en la base de datos
	err := db.UpdateUserProfile(h.DB, userID, updates)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al actualizar perfil: " + err.Error()})
		return
	}

	// Obtener usuario actualizado
	user, err := db.GetUserByID(h.DB, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener perfil actualizado"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"mensaje":      "Perfil actualizado exitosamente",
		"user_id":      user.ID,
		"email":        user.Email,
		"nombre":       user.Nombre,
		"apellido":     user.Apellido,
		"telefono":     user.Telefono,
		"avatar":       user.Avatar,
		"preferencias": user.Preferencias,
		"updated_at":   user.UpdatedAt,
	})
}

// ---- Cart Handlers ----

func (h *Handler) GetCart(c *gin.Context) {
	log.Printf("GetCart llamado - verificando user_id")
	userID, exists := c.Get("user_id")
	if !exists {
		log.Printf("user_id no encontrado en contexto")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	log.Printf("user_id encontrado: %v", userID)
	cartID, err := db.FindOrCreateCartByUserID(h.DB, userID.(int))
	if err != nil {
		log.Printf("Error creando/obteniendo carrito: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get or create cart"})
		return
	}

	log.Printf("Carrito obtenido/creado con ID: %d", cartID)
	items, err := db.GetCartContents(h.DB, cartID)
	if err != nil {
		log.Printf("Error obteniendo contenido del carrito: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get cart items"})
		return
	}

	// Transformar los datos para que coincidan con lo que espera el frontend
	var transformedItems []gin.H
	for _, item := range items {
		transformedItem := gin.H{
			"id":         item.ID,
			"product_id": item.ProductID,
			"quantity":   item.Quantity,
			"created_at": item.CreatedAt,
			"updated_at": item.UpdatedAt,
		}

		// Agregar datos del producto si existe
		if item.Product != nil {
			transformedItem["product_name"] = item.Product.Name
			transformedItem["price"] = item.Product.Price
			transformedItem["image_url"] = item.Product.ImageURL
		} else {
			// Valores por defecto si no hay datos del producto
			transformedItem["product_name"] = "Producto desconocido"
			transformedItem["price"] = 0.0
			transformedItem["image_url"] = ""
		}

		transformedItems = append(transformedItems, transformedItem)
	}

	log.Printf("Carrito devuelto con %d items", len(transformedItems))
	c.JSON(http.StatusOK, transformedItems)
}

type AddToCartRequest struct {
	ProductID int `json:"product_id" binding:"required"`
	Quantity  int `json:"quantity" binding:"required,min=1"`
}

func (h *Handler) AddToCart(c *gin.Context) {
	var req AddToCartRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	cartID, err := db.FindOrCreateCartByUserID(h.DB, userID.(int))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to find or create cart"})
		return
	}

	err = db.AddItemToCart(h.DB, cartID, req.ProductID, req.Quantity)
	if err != nil {
		if strings.Contains(err.Error(), "stock") {
			c.JSON(http.StatusBadRequest, gin.H{"error": "No hay suficiente stock disponible"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add item to cart"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Item added to cart successfully"})
}

type UpdateCartItemRequest struct {
	Quantity int `json:"quantity" binding:"required,min=0"`
}

func (h *Handler) UpdateCartItem(c *gin.Context) {
	cartItemIDStr := c.Param("itemID")
	cartItemID, err := strconv.Atoi(cartItemIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid item ID"})
		return
	}

	var req UpdateCartItemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := db.UpdateCartItemQuantity(h.DB, cartItemID, req.Quantity); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update cart item"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Cart item updated successfully"})
}

func (h *Handler) RemoveCartItem(c *gin.Context) {
	cartItemIDStr := c.Param("itemID")
	cartItemID, err := strconv.Atoi(cartItemIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid item ID"})
		return
	}

	if err := db.RemoveItemFromCart(h.DB, cartItemID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove item from cart"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Item removed from cart successfully"})
}

// SeedData crea datos de prueba
func (h *Handler) SeedData(c *gin.Context) {
	// Crear categorías
	categories := []string{"Electrónicos", "Ropa", "Hogar", "Deportes", "Libros"}
	var categoryPlaceholders []string
	var categoryValues []interface{}
	for i, catName := range categories {
		categoryPlaceholders = append(categoryPlaceholders, fmt.Sprintf("($%d)", i+1))
		categoryValues = append(categoryValues, catName)
	}
	catQuery := "INSERT INTO categories (name) VALUES " + strings.Join(categoryPlaceholders, ", ") + " ON CONFLICT (name) DO NOTHING"
	_, err := h.DB.Exec(context.Background(), catQuery, categoryValues...)
	if err != nil {
		log.Printf("Error creando categorías: %v", err)
	}

	// Crear productos con todos los campos obligatorios
	now := time.Now()
	products := []struct {
		name        string
		description string
		price       float64
		imageURL    string
		categoryID  int
		stock       int
		sku         string
		weight      float64
		dimensions  string
		isActive    bool
		featured    bool
	}{
		{"iPhone 15 Pro", "El último iPhone con cámara profesional", 999.99, "/uploads/iphone.jpg", 1, 10, "SKU-IPH15", 0.5, "146x71x7.7mm", true, true},
		{"MacBook Air M2", "Portátil ultra ligero con chip M2", 1299.99, "/uploads/macbook.jpg", 1, 8, "SKU-MBAIR2", 1.2, "304x212x16mm", true, true},
		{"Camiseta Básica", "Camiseta de algodón 100%", 19.99, "/uploads/camiseta.jpg", 2, 30, "SKU-CAMISB", 0.2, "M", true, false},
		{"Jeans Clásicos", "Jeans de alta calidad", 49.99, "/uploads/jeans.jpg", 2, 20, "SKU-JEANS", 0.6, "L", true, false},
		{"Sofá Moderno", "Sofá elegante para tu sala", 599.99, "/uploads/sofa.jpg", 3, 5, "SKU-SOFA", 15.0, "200x90x100cm", true, false},
		{"Lámpara LED", "Iluminación moderna y eficiente", 89.99, "/uploads/lampara.jpg", 3, 15, "SKU-LAMPLED", 0.8, "40x20x20cm", true, false},
		{"Balón de Fútbol", "Balón oficial de competición", 29.99, "/uploads/balon.jpg", 4, 25, "SKU-BALON", 0.4, "22cm", true, false},
		{"Raqueta de Tenis", "Raqueta profesional", 159.99, "/uploads/raqueta.jpg", 4, 12, "SKU-RAQTEN", 0.3, "68x27cm", true, false},
		{"El Señor de los Anillos", "Trilogía completa en tapa dura", 39.99, "/uploads/lotr.jpg", 5, 18, "SKU-LOTR", 1.5, "24x16x8cm", true, false},
		{"Clean Code", "Guía para escribir código limpio", 24.99, "/uploads/cleancode.jpg", 5, 22, "SKU-CCODE", 0.7, "23x15x3cm", true, false},
		{"Zapatilla Skater B9S", "Edición limitada y numerada Tweed", 129.99, "/uploads/zapatilla.jpg", 2, 14, "SKU-ZSKB9S", 0.9, "42", true, true},
	}

	var productPlaceholders []string
	var productValues []interface{}
	i := 1
	for _, p := range products {
		productPlaceholders = append(productPlaceholders, fmt.Sprintf("($%d, $%d, $%d, $%d, $%d, $%d, $%d, $%d, $%d, $%d, $%d, $%d, $%d)", i, i+1, i+2, i+3, i+4, i+5, i+6, i+7, i+8, i+9, i+10, i+11, i+12))
		productValues = append(productValues, p.name, p.description, p.price, p.imageURL, p.categoryID, p.stock, p.sku, p.weight, p.dimensions, p.isActive, now, now, p.featured)
		i += 13
	}
	prodQuery := "INSERT INTO products (name, description, price, image_url, category_id, stock, sku, weight, dimensions, is_active, created_at, updated_at, featured) VALUES " + strings.Join(productPlaceholders, ", ") + " ON CONFLICT (name) DO NOTHING"
	_, err = h.DB.Exec(context.Background(), prodQuery, productValues...)
	if err != nil {
		log.Printf("Error creando productos: %v", err)
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Datos de prueba creados exitosamente",
	})
}

func (h *Handler) GetProfile(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	user, err := db.GetUserByID(h.DB, userID.(int))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user profile"})
		return
	}

	c.JSON(http.StatusOK, user)
}

func (h *Handler) UpdateProfile(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Filtrar campos no permitidos
	allowedFields := map[string]bool{
		"nombre":       true,
		"apellido":     true,
		"telefono":     true,
		"avatar":       true,
		"preferencias": true,
	}

	for key := range updates {
		if !allowedFields[key] {
			delete(updates, key)
		}
	}

	if len(updates) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No valid fields to update"})
		return
	}

	err := db.UpdateUserProfile(h.DB, userID.(int), updates)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Profile updated successfully"})
}

func (h *Handler) Logout(c *gin.Context) {
	// La lógica de logout (invalidar tokens) se maneja en el middleware o un handler específico de auth
	// Este endpoint es más para que el cliente confirme que el logout se ha procesado
	c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
}

// GetProductSuggestions devuelve sugerencias de búsqueda de productos
func (h *Handler) GetProductSuggestions(c *gin.Context) {
	query := c.Query("q")
	if len(query) < 2 { // No buscar si la consulta es muy corta
		c.JSON(http.StatusOK, gin.H{"suggestions": []string{}})
		return
	}

	suggestions, err := db.GetProductSuggestions(h.DB, query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener sugerencias"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"suggestions": suggestions})
}

// ClearCartHandler limpia todos los productos del carrito del usuario autenticado
func (h *Handler) ClearCartHandler(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	err := db.ClearCart(h.DB, userID.(int))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error limpiando carrito"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Carrito limpiado exitosamente"})
}
