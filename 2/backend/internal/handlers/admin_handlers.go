package handlers

import (
	"net/http"
	"strconv"
	"time"

	"log"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/tuusuario/ecommerce-backend/internal/db"
	"github.com/tuusuario/ecommerce-backend/internal/lib"
	"github.com/tuusuario/ecommerce-backend/internal/models"
)

type AdminHandler struct {
	DB *pgxpool.Pool
}

func NewAdminHandler(db *pgxpool.Pool) *AdminHandler {
	return &AdminHandler{DB: db}
}

// ===== PRODUCTOS =====

// CreateProduct crea un nuevo producto
func (h *AdminHandler) CreateProduct(c *gin.Context) {
	// Soportar multipart/form-data
	if c.ContentType() == "multipart/form-data" {
		name := c.PostForm("name")
		description := c.PostForm("description")
		price := c.PostForm("price")
		stock := c.PostForm("stock")
		categoryID := c.PostForm("category_id")
		sku := c.PostForm("sku")
		weightStr := c.PostForm("weight")
		dimensions := c.PostForm("dimensions") // dimensiones físicas

		// Validaciones básicas
		if name == "" || price == "" || stock == "" || categoryID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Nombre, precio, stock y categoría son requeridos"})
			return
		}

		// Parsear valores numéricos
		priceF, err := strconv.ParseFloat(price, 64)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Precio inválido"})
			return
		}
		stockI, err := strconv.Atoi(stock)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Stock inválido"})
			return
		}
		var categoryIDPtr *int
		if categoryID != "" {
			categoryIDI, err := strconv.Atoi(categoryID)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Categoría inválida"})
				return
			}
			categoryIDPtr = &categoryIDI
		}

		var weightPtr *float64
		if weightStr != "" {
			weightF, err := strconv.ParseFloat(weightStr, 64)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Peso inválido"})
				return
			}
			weightPtr = &weightF
		}

		// Manejar imagen
		var imageURL *string
		imageFile, err := c.FormFile("image")
		if err == nil && imageFile != nil {
			src, _ := imageFile.Open()
			defer src.Close()
			key := "images/" + strconv.FormatInt(time.Now().UnixNano(), 10) + "_" + imageFile.Filename
			url, err := lib.UploadFileToS3(src, imageFile, key)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Error subiendo imagen a S3: " + err.Error()})
				return
			}
			imageURL = &url
		}

		// Manejar modelo 3D
		var modelURL *string
		modelFile, err := c.FormFile("model3d")
		if err == nil && modelFile != nil {
			src, _ := modelFile.Open()
			defer src.Close()
			key := "models/" + strconv.FormatInt(time.Now().UnixNano(), 10) + "_" + modelFile.Filename
			url, err := lib.UploadFileToS3(src, modelFile, key)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Error subiendo modelo 3D a S3: " + err.Error()})
				return
			}
			modelURL = &url
		}

		var descriptionPtr *string
		if description != "" {
			descriptionPtr = &description
		}

		var skuPtr *string
		if sku != "" {
			skuPtr = &sku
		}

		product := models.Product{
			Name:        name,
			Description: descriptionPtr,
			Price:       priceF,
			Stock:       stockI,
			CategoryID:  categoryIDPtr,
			ImageURL:    imageURL,
			Dimensions:  &dimensions, // físicas
			ModelURL:    modelURL,    // archivo 3D
			SKU:         skuPtr,
			Weight:      weightPtr,
			IsActive:    true,
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		}

		createdProduct, err := db.CreateProduct(h.DB, &product)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error creando producto: " + err.Error()})
			return
		}

		c.JSON(http.StatusCreated, gin.H{
			"message": "Producto creado exitosamente",
			"product": createdProduct,
		})
		return
	}

	// Fallback para JSON
	var product models.Product
	if err := c.ShouldBindJSON(&product); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos: " + err.Error()})
		return
	}

	if product.Name == "" || product.Price <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Nombre y precio son requeridos"})
		return
	}

	product.CreatedAt = time.Now()
	product.UpdatedAt = time.Now()
	product.IsActive = true

	createdProduct, err := db.CreateProduct(h.DB, &product)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error creando producto: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Producto creado exitosamente",
		"product": createdProduct,
	})
}

// UpdateProduct actualiza un producto existente
func (h *AdminHandler) UpdateProduct(c *gin.Context) {
	productID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de producto inválido"})
		return
	}

	// Obtener el producto existente para no perder las URLs si no se suben nuevas
	existingProduct, err := db.GetProductByID(h.DB, productID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Producto no encontrado"})
		return
	}

	// Usar PostForm para soportar multipart/form-data
	name := c.PostForm("name")
	description := c.PostForm("description")
	priceStr := c.PostForm("price")
	stockStr := c.PostForm("stock")
	categoryIDStr := c.PostForm("category_id")
	sku := c.PostForm("sku")
	weightStr := c.PostForm("weight")
	// Leer el campo 'featured'
	featuredStr := c.PostForm("featured")
	featured := existingProduct.Featured // valor por defecto
	if featuredStr != "" {
		if featuredStr == "true" || featuredStr == "1" {
			featured = true
		} else if featuredStr == "false" || featuredStr == "0" {
			featured = false
		}
	}
	// Log para depuración
	log.Printf("[UpdateProduct] featuredStr='%s', featured=%v", featuredStr, featured)

	// Validaciones
	if name == "" || priceStr == "" || stockStr == "" || categoryIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Nombre, precio, stock y categoría son requeridos"})
		return
	}

	price, err := strconv.ParseFloat(priceStr, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Precio inválido"})
		return
	}
	stock, err := strconv.Atoi(stockStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Stock inválido"})
		return
	}
	var categoryIDPtr *int
	if categoryIDStr != "" {
		categoryID, err := strconv.Atoi(categoryIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Categoría inválida"})
			return
		}
		categoryIDPtr = &categoryID
	}

	weightPtr := existingProduct.Weight // Mantener el peso existente por defecto
	if weightStr != "" {
		weightF, err := strconv.ParseFloat(weightStr, 64)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Peso inválido"})
			return
		}
		weightPtr = &weightF
	}

	isActive, err := strconv.ParseBool(c.PostForm("is_active"))
	if err != nil {
		isActive = existingProduct.IsActive
	}

	imageURL := existingProduct.ImageURL // Mantener la imagen existente por defecto

	// Manejar nueva imagen si se proporciona
	imageFile, err := c.FormFile("image")
	if err == nil && imageFile != nil {
		src, _ := imageFile.Open()
		defer src.Close()
		key := "images/" + strconv.FormatInt(time.Now().UnixNano(), 10) + "_" + imageFile.Filename
		url, err := lib.UploadFileToS3(src, imageFile, key)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error subiendo imagen a S3: " + err.Error()})
			return
		}
		newImageURL := "/" + url
		imageURL = &newImageURL // Actualizar a la nueva URL
	}

	modelURL := existingProduct.ModelURL // Mantener el modelo existente por defecto

	// Manejar nuevo modelo 3D si se proporciona
	modelFile, err := c.FormFile("model3d")
	if err == nil && modelFile != nil {
		src, _ := modelFile.Open()
		defer src.Close()
		key := "models/" + strconv.FormatInt(time.Now().UnixNano(), 10) + "_" + modelFile.Filename
		url, err := lib.UploadFileToS3(src, modelFile, key)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error subiendo modelo 3D a S3: " + err.Error()})
			return
		}
		modelURL = &url // ✅ Usar la URL directamente sin agregar "/"
	}

	var descriptionPtr *string
	if description != "" {
		descriptionPtr = &description
	} else {
		descriptionPtr = existingProduct.Description
	}

	var skuPtr *string
	if sku != "" {
		skuPtr = &sku
	} else {
		skuPtr = existingProduct.SKU
	}

	product := models.Product{
		ID:          productID,
		Name:        name,
		Description: descriptionPtr,
		Price:       price,
		Stock:       stock,
		CategoryID:  categoryIDPtr,
		ImageURL:    imageURL,
		Dimensions:  existingProduct.Dimensions,
		ModelURL:    modelURL,
		SKU:         skuPtr,
		Weight:      weightPtr,
		IsActive:    isActive,
		UpdatedAt:   time.Now(),
		CreatedAt:   existingProduct.CreatedAt,
		Featured:    featured,
	}

	updatedProduct, err := db.UpdateProduct(h.DB, &product)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error actualizando producto: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Producto actualizado exitosamente",
		"product": updatedProduct,
	})
}

// DeleteProduct elimina un producto (soft delete)
func (h *AdminHandler) DeleteProduct(c *gin.Context) {
	productID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de producto inválido"})
		return
	}

	err = db.DeleteProduct(h.DB, productID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error eliminando producto: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Producto eliminado exitosamente"})
}

// GetAllProducts obtiene todos los productos (con paginación)
func (h *AdminHandler) GetAllProducts(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	search := c.Query("search")
	categoryID, _ := strconv.Atoi(c.Query("category_id"))

	products, total, err := db.GetAllProductsAdmin(h.DB, page, limit, search, categoryID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error obteniendo productos: " + err.Error()})
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

// GetProductByID obtiene un producto específico
func (h *AdminHandler) GetProductByID(c *gin.Context) {
	productID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de producto inválido"})
		return
	}

	product, err := db.GetProductByID(h.DB, productID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Producto no encontrado"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"product": product})
}

// ===== CATEGORÍAS =====

// CreateCategory crea una nueva categoría
func (h *AdminHandler) CreateCategory(c *gin.Context) {
	var category models.Category
	if err := c.ShouldBindJSON(&category); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos: " + err.Error()})
		return
	}

	if category.Name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "El nombre de la categoría es requerido"})
		return
	}

	category.CreatedAt = time.Now()
	category.UpdatedAt = time.Now()
	category.IsActive = true

	createdCategory, err := db.CreateCategory(h.DB, &category)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error creando categoría: " + err.Error()})
		return
	}
	c.JSON(http.StatusCreated, createdCategory)
}

// UpdateCategory actualiza una categoría existente
func (h *AdminHandler) UpdateCategory(c *gin.Context) {
	categoryID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de categoría inválido"})
		return
	}

	var category models.Category
	if err := c.ShouldBindJSON(&category); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos: " + err.Error()})
		return
	}

	if category.Name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "El nombre de la categoría es requerido"})
		return
	}

	category.ID = categoryID
	category.UpdatedAt = time.Now()

	updatedCategory, err := db.UpdateCategory(h.DB, &category)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error actualizando categoría: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, updatedCategory)
}

// DeleteCategory elimina una categoría
func (h *AdminHandler) DeleteCategory(c *gin.Context) {
	categoryID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de categoría inválido"})
		return
	}

	// Aquí podrías agregar lógica para verificar si la categoría está en uso
	err = db.DeleteCategory(h.DB, categoryID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error eliminando categoría: " + err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Categoría eliminada exitosamente"})
}

// GetAllCategories obtiene todas las categorías
func (h *AdminHandler) GetAllCategories(c *gin.Context) {
	categories, err := db.GetAllCategories(h.DB)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error obteniendo categorías: " + err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"categories": categories})
}

// ===== DASHBOARD =====

func (h *AdminHandler) GetDashboardStats(c *gin.Context) {
	stats, err := db.GetDashboardStats(h.DB)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error obteniendo estadísticas: " + err.Error()})
		return
	}
	c.JSON(http.StatusOK, stats)
}

// ===== USUARIOS =====

func (h *AdminHandler) GetAllUsers(c *gin.Context) {
	users, err := db.GetAllUsers(h.DB)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error obteniendo usuarios"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"users": users})
}

func (h *AdminHandler) UpdateUserStatus(c *gin.Context) {
	userID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de usuario inválido"})
		return
	}

	var payload struct {
		IsActive *bool `json:"is_active"`
		IsAdmin  *bool `json:"is_admin"`
	}

	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos: " + err.Error()})
		return
	}

	user, err := db.GetUserByID(h.DB, userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Usuario no encontrado"})
		return
	}

	// Usa los valores actuales si no se proveen en el payload
	isActive := user.IsActive
	if payload.IsActive != nil {
		isActive = *payload.IsActive
	}
	isAdmin := user.IsAdmin
	if payload.IsAdmin != nil {
		isAdmin = *payload.IsAdmin
	}

	err = db.UpdateUserStatus(h.DB, userID, isAdmin, isActive)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error actualizando usuario: " + err.Error()})
		return
	}

	// Devuelve el usuario actualizado
	updatedUser, err := db.GetUserByID(h.DB, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error obteniendo usuario actualizado: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, updatedUser)
}

func (h *AdminHandler) DeleteUser(c *gin.Context) {
	userID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de usuario inválido"})
		return
	}

	// Se realiza un "soft delete" estableciendo is_active = false
	// Primero obtenemos el estado de 'is_admin' para no alterarlo.
	user, err := db.GetUserByID(h.DB, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener el usuario: " + err.Error()})
		return
	}

	err = db.UpdateUserStatus(h.DB, userID, user.IsAdmin, false) // Se mantiene su rol de admin, pero se desactiva
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error desactivando usuario: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Usuario desactivado exitosamente"})
}

// ===== PEDIDOS (ORDERS) =====

// Listar todos los pedidos (con paginación)
func (h *AdminHandler) GetAllOrders(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 20
	}

	orders, total, err := db.GetAllOrdersAdmin(h.DB, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error obteniendo pedidos: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"orders": orders,
		"total":  total,
		"page":   page,
		"limit":  limit,
	})
}

// Ver detalles de un pedido
func (h *AdminHandler) GetOrderByID(c *gin.Context) {
	orderID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de pedido inválido"})
		return
	}
	order, err := db.GetOrderByIDAdmin(h.DB, orderID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pedido no encontrado"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"order": order})
}

// Actualizar estado y número de tracking de un pedido
func (h *AdminHandler) UpdateOrder(c *gin.Context) {
	orderID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de pedido inválido"})
		return
	}
	var req struct {
		Status   string `json:"status"`
		Tracking string `json:"tracking"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos: " + err.Error()})
		return
	}
	if req.Status == "" && req.Tracking == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Debes enviar al menos un campo a actualizar (status o tracking)"})
		return
	}
	if req.Status != "" {
		err = db.UpdateOrderStatus(h.DB, orderID, req.Status)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error actualizando estado: " + err.Error()})
			return
		}
	}
	if req.Tracking != "" {
		err = db.UpdateOrderTracking(h.DB, orderID, req.Tracking)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error actualizando tracking: " + err.Error()})
			return
		}
	}
	order, _ := db.GetOrderByIDAdmin(h.DB, orderID)
	c.JSON(http.StatusOK, gin.H{"order": order, "message": "Pedido actualizado"})
}
