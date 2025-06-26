package main

import (
	"context"
	"log"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/tuusuario/ecommerce-backend/internal/auth"
	"github.com/tuusuario/ecommerce-backend/internal/db"
	"github.com/tuusuario/ecommerce-backend/internal/email"
	"github.com/tuusuario/ecommerce-backend/internal/handlers"
)

func main() {
	// Cargar variables de entorno desde .env
	// Se especifica la ruta para asegurar que se encuentre sin importar desde dónde se ejecute
	if err := godotenv.Load(".env"); err != nil {
		log.Println("⚠️  No se encontró archivo .env, usando variables de entorno del sistema")
	}

	// Conexión a la base de datos
	if err := db.Connect(); err != nil {
		log.Fatalf("Error conectando a la base de datos: %v", err)
	}

	// Inicializar servicio de Email
	email.InitEmailService()

	// Inicializar Auth Handler (contiene WebAuthn)
	authHandler, err := auth.NewAuthHandler(db.Pool)
	if err != nil {
		log.Fatalf("Error inicializando AuthHandler: %v", err)
	}

	// Crear una instancia del handler con la conexión a la BD
	h := handlers.NewHandler(db.Pool)

	router := gin.Default()
	router.MaxMultipartMemory = 64 << 20 // 64 MB para permitir archivos grandes (modelos 3D)

	// Configurar CORS
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{
		"https://axiora.pro",                    // producción con dominio personalizado
		"https://importfredd-axiora.vercel.app", // dominio Vercel actual
		"http://localhost:3000",                 // desarrollo local
	}
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Accept", "Authorization"}
	config.AllowCredentials = true // Permitir cookies
	router.Use(cors.New(config))

	// --- Rutas Públicas ---
	// No requieren autenticación
	router.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "pong"})
	})
	router.GET("/health", func(c *gin.Context) {
		// Verificar conexión a la base de datos
		ctx := context.Background()
		if err := db.Pool.Ping(ctx); err != nil {
			c.JSON(503, gin.H{
				"status":    "unhealthy",
				"error":     "Database connection failed",
				"timestamp": time.Now().Format(time.RFC3339),
			})
			return
		}

		c.JSON(200, gin.H{
			"status":    "healthy",
			"database":  "connected",
			"timestamp": time.Now().Format(time.RFC3339),
		})
	})
	router.POST("/seed-data", h.SeedData)
	router.GET("/products", h.GetProducts)
	router.GET("/products/suggestions", h.GetProductSuggestions)
	router.GET("/products/:id", h.GetProduct)
	router.GET("/categories", h.GetCategories)
	router.GET("/categories-with-count", h.GetCategoriesWithProductCount)

	// --- Rutas de Autenticación ---
	authRoutes := router.Group("/auth")
	auth.AddAuthRoutes(authRoutes, authHandler)

	// --- Rutas Protegidas ---
	// Requieren un JWT válido
	api := router.Group("/api")
	api.Use(auth.JWTMiddleware())
	{
		// Perfil de usuario
		api.GET("/profile", h.GetUserProfile)
		api.PUT("/profile", h.UpdateUserProfile)

		// Carrito de compras
		cart := api.Group("/cart")
		{
			cart.GET("", h.GetCart)
			cart.POST("/items", h.AddToCart)
			cart.PUT("/items/:itemID", h.UpdateCartItem)
			cart.DELETE("/items/:itemID", h.RemoveCartItem)
		}

		// Pagos con Stripe
		paymentHandler := handlers.NewPaymentHandler(db.Pool)
		payments := api.Group("/payments")
		{
			payments.POST("/create-intent", paymentHandler.CreatePaymentIntent)
			payments.POST("/confirm", paymentHandler.ConfirmPayment)
			payments.GET("/status/:paymentIntentId", paymentHandler.GetPaymentStatus)
			payments.POST("/test-email", paymentHandler.TestEmailEndpoint)
		}

		// Pedidos
		orderHandler := handlers.NewOrderHandler(db.Pool)
		orders := api.Group("/orders")
		{
			orders.POST("/create", orderHandler.CreateOrderFromCart)
			orders.GET("", orderHandler.GetUserOrders)
			orders.GET("/:orderID", orderHandler.GetOrderDetails)
			orders.POST("/:orderID/cancel", orderHandler.CancelOrder)
		}

		// Webhook de Stripe (no requiere autenticación)
		router.POST("/webhooks/stripe", paymentHandler.StripeWebhook)

		// Logout (esencialmente invalida el token en el lado del cliente)
		api.POST("/logout", h.Logout)

		// Favoritos
		favoritesHandler := handlers.NewFavoritesHandler(db.Pool)
		favorites := api.Group("/favorites")
		{
			favorites.GET("", favoritesHandler.ListFavorites)
			favorites.POST("", favoritesHandler.AddFavorite)
			favorites.DELETE(":product_id", favoritesHandler.RemoveFavorite)
		}
	}

	// --- Rutas de Administración ---
	// Requieren autenticación y permisos de administrador
	adminHandler := handlers.NewAdminHandler(db.Pool)
	admin := router.Group("/admin")
	admin.Use(auth.JWTMiddleware())
	{
		// Dashboard y estadísticas
		admin.GET("/stats", adminHandler.GetDashboardStats)

		// Gestión de productos
		products := admin.Group("/products")
		{
			products.GET("", adminHandler.GetAllProducts)
			products.GET("/:id", adminHandler.GetProductByID)
			products.POST("", adminHandler.CreateProduct)
			products.PUT("/:id", adminHandler.UpdateProduct)
			products.DELETE("/:id", adminHandler.DeleteProduct)
		}

		// Gestión de categorías
		categories := admin.Group("/categories")
		{
			categories.GET("", adminHandler.GetAllCategories)
			categories.POST("", adminHandler.CreateCategory)
			categories.PUT("/:id", adminHandler.UpdateCategory)
			categories.DELETE("/:id", adminHandler.DeleteCategory)
		}

		// Gestión de pedidos
		orders := admin.Group("/orders")
		{
			orders.GET("", adminHandler.GetAllOrders)
			orders.GET(":id", adminHandler.GetOrderByID)
			orders.PUT(":id", adminHandler.UpdateOrder)
		}

		// Rutas para gestión de usuarios
		admin.GET("/users", adminHandler.GetAllUsers)
		admin.PUT("/users/:id", adminHandler.UpdateUserStatus)
		admin.DELETE("/users/:id", adminHandler.DeleteUser)
	}

	// Servir archivos estáticos de /uploads
	router.Static("/uploads", "./uploads")

	// Iniciar servidor
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("Server running on http://localhost:%s", port)
	router.Run(":" + port)
}
