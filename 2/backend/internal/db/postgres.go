package db

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/go-webauthn/webauthn/protocol"
	"github.com/go-webauthn/webauthn/webauthn"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/tuusuario/ecommerce-backend/internal/models"
)

var Pool *pgxpool.Pool

func Connect() error {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		// Cadena de conexión por defecto para desarrollo
		dbURL = "postgres://appuser:apppassword@localhost:5432/ecommerce"
	}

	pool, err := pgxpool.New(context.Background(), dbURL)
	if err != nil {
		return fmt.Errorf("unable to connect to database: %w", err)
	}

	// Probar conexión
	err = pool.Ping(context.Background())
	if err != nil {
		return fmt.Errorf("unable to ping database: %w", err)
	}

	Pool = pool
	fmt.Println("Conectado a PostgreSQL con éxito")

	// Crear tablas si no existen
	if err := createTables(); err != nil {
		return fmt.Errorf("error creating tables: %w", err)
	}

	return nil
}

func createTables() error {
	// Crear tabla de usuarios si no existe
	usersTable := `
	CREATE TABLE IF NOT EXISTS users (
		id SERIAL PRIMARY KEY,
		email VARCHAR(255) UNIQUE NOT NULL,
		nombre VARCHAR(100),
		apellido VARCHAR(100),
		telefono VARCHAR(20),
		avatar TEXT,
		preferencias TEXT,
		password_hash VARCHAR(255),
		created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
		updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
	);
	`

	_, err := Pool.Exec(context.Background(), usersTable)
	if err != nil {
		return fmt.Errorf("error creating users table: %w", err)
	}

	// Agregar columnas nuevas si no existen (para migración)
	if err := addNewColumnsIfNotExist(); err != nil {
		return fmt.Errorf("error adding new columns: %w", err)
	}

	// Añadir la columna is_active a la tabla de usuarios si no existe
	isUserActiveColumn := `
	DO $$
	BEGIN
		IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='is_active') THEN
			ALTER TABLE users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;
		END IF;
	END
	$$;
	`
	_, err = Pool.Exec(context.Background(), isUserActiveColumn)
	if err != nil {
		return fmt.Errorf("error adding is_active column to users table: %w", err)
	}

	// Crear tabla de credenciales WebAuthn (sin eliminar si ya existe)
	credentialsTable := `
	CREATE TABLE IF NOT EXISTS credentials (
		id SERIAL PRIMARY KEY,
		user_id INTEGER NOT NULL,
		credential_id BYTEA NOT NULL,
		public_key BYTEA NOT NULL,
		sign_count INTEGER NOT NULL DEFAULT 0,
		transports TEXT[],
		aaguid BYTEA NOT NULL,
		created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
		updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
		UNIQUE(credential_id),
		FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
	);
	`

	_, err = Pool.Exec(context.Background(), credentialsTable)
	if err != nil {
		return fmt.Errorf("error creating credentials table: %w", err)
	}

	// Crear tabla de refresh tokens
	refreshTokensTable := `
	CREATE TABLE IF NOT EXISTS refresh_tokens (
		id SERIAL PRIMARY KEY,
		user_id INTEGER NOT NULL,
		token VARCHAR(255) NOT NULL UNIQUE,
		expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
		created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
		device_info TEXT,
		ip_address INET,
		FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
	);
	`

	_, err = Pool.Exec(context.Background(), refreshTokensTable)
	if err != nil {
		return fmt.Errorf("error creating refresh_tokens table: %w", err)
	}

	// Crear tabla de sesiones de usuario
	sessionsTable := `
	CREATE TABLE IF NOT EXISTS user_sessions (
		id SERIAL PRIMARY KEY,
		user_id INTEGER NOT NULL,
		session_token VARCHAR(255) NOT NULL,
		device_info TEXT,
		ip_address INET,
		user_agent TEXT,
		is_active BOOLEAN DEFAULT TRUE,
		FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
	);
	`

	_, err = Pool.Exec(context.Background(), sessionsTable)
	if err != nil {
		return fmt.Errorf("error creating user_sessions table: %w", err)
	}

	// Crear tabla de productos
	productTable := `
	CREATE TABLE IF NOT EXISTS products (
		id SERIAL PRIMARY KEY,
		name VARCHAR(100) NOT NULL,
		description TEXT,
		price DECIMAL(10, 2) NOT NULL,
		category_id INTEGER,
		image_url VARCHAR(255),
		created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
	);
	`

	_, err = Pool.Exec(context.Background(), productTable)
	if err != nil {
		return fmt.Errorf("error creating products table: %w", err)
	}

	// Crear tabla de categorías
	categoryTable := `
	CREATE TABLE IF NOT EXISTS categories (
		id SERIAL PRIMARY KEY,
		name VARCHAR(100) NOT NULL UNIQUE
	);
	`

	_, err = Pool.Exec(context.Background(), categoryTable)
	if err != nil {
		return fmt.Errorf("error creating categories table: %w", err)
	}

	// Crear tabla de carritos
	cartTable := `
	CREATE TABLE IF NOT EXISTS carts (
		id SERIAL PRIMARY KEY,
		user_id INTEGER NOT NULL UNIQUE,
		created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
		updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
		FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
	);
	`

	_, err = Pool.Exec(context.Background(), cartTable)
	if err != nil {
		return fmt.Errorf("error creating carts table: %w", err)
	}

	// Crear tabla de ítems del carrito
	cartItemTable := `
	CREATE TABLE IF NOT EXISTS cart_items (
		id SERIAL PRIMARY KEY,
		cart_id INTEGER NOT NULL,
		product_id INTEGER NOT NULL,
		quantity INTEGER NOT NULL CHECK (quantity > 0),
		created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
		updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
		FOREIGN KEY(cart_id) REFERENCES carts(id) ON DELETE CASCADE,
		FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE,
		UNIQUE (cart_id, product_id)
	);
	`

	_, err = Pool.Exec(context.Background(), cartItemTable)
	if err != nil {
		return fmt.Errorf("error creating cart_items table: %w", err)
	}

	// Crear tabla de pedidos
	ordersTable := `
	CREATE TABLE IF NOT EXISTS orders (
		id SERIAL PRIMARY KEY,
		user_id INTEGER NOT NULL,
		order_number VARCHAR(50) UNIQUE NOT NULL,
		status VARCHAR(20) NOT NULL DEFAULT 'pending',
		subtotal DECIMAL(10, 2) NOT NULL,
		tax DECIMAL(10, 2) NOT NULL DEFAULT 0,
		shipping DECIMAL(10, 2) NOT NULL DEFAULT 0,
		total DECIMAL(10, 2) NOT NULL,
		currency VARCHAR(3) NOT NULL DEFAULT 'USD',
		payment_status VARCHAR(20) NOT NULL DEFAULT 'pending',
		shipping_address JSONB,
		billing_address JSONB,
		notes TEXT,
		created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
		updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
		FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
	);
	`

	_, err = Pool.Exec(context.Background(), ordersTable)
	if err != nil {
		return fmt.Errorf("error creating orders table: %w", err)
	}

	// Crear tabla de items de pedido
	orderItemsTable := `
	CREATE TABLE IF NOT EXISTS order_items (
		id SERIAL PRIMARY KEY,
		order_id INTEGER NOT NULL,
		product_id INTEGER NOT NULL,
		quantity INTEGER NOT NULL CHECK (quantity > 0),
		price DECIMAL(10, 2) NOT NULL,
		subtotal DECIMAL(10, 2) NOT NULL,
		FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE,
		FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
	);
	`

	_, err = Pool.Exec(context.Background(), orderItemsTable)
	if err != nil {
		return fmt.Errorf("error creating order_items table: %w", err)
	}

	// Crear tabla de pagos
	paymentsTable := `
	CREATE TABLE IF NOT EXISTS payments (
		id SERIAL PRIMARY KEY,
		order_id INTEGER NOT NULL,
		payment_method VARCHAR(50) NOT NULL,
		amount DECIMAL(10, 2) NOT NULL,
		currency VARCHAR(3) NOT NULL DEFAULT 'USD',
		status VARCHAR(20) NOT NULL DEFAULT 'pending',
		transaction_id VARCHAR(255),
		stripe_payment_intent_id VARCHAR(255),
		stripe_customer_id VARCHAR(255),
		error_message TEXT,
		created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
		updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
		FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
	);
	`

	_, err = Pool.Exec(context.Background(), paymentsTable)
	if err != nil {
		return fmt.Errorf("error creating payments table: %w", err)
	}

	// Crear índices para mejorar el rendimiento
	indexes := []string{
		"CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);",
		"CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);",
		"CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);",
		"CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);",
		"CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);",
		"CREATE INDEX IF NOT EXISTS idx_payments_stripe_intent_id ON payments(stripe_payment_intent_id);",
	}

	for _, index := range indexes {
		_, err = Pool.Exec(context.Background(), index)
		if err != nil {
			return fmt.Errorf("error creating index: %w", err)
		}
	}

	fmt.Println("Tablas creadas/verificadas exitosamente")
	return nil
}

// Función para agregar nuevas columnas si no existen (migración)
func addNewColumnsIfNotExist() error {
	// Migración de tabla users
	userColumns := []struct {
		name       string
		definition string
	}{
		{"nombre", "VARCHAR(100)"},
		{"apellido", "VARCHAR(100)"},
		{"telefono", "VARCHAR(20)"},
		{"avatar", "TEXT"},
		{"preferencias", "TEXT"},
		{"updated_at", "TIMESTAMP WITH TIME ZONE DEFAULT NOW()"},
		{"is_admin", "BOOLEAN DEFAULT FALSE"},
	}

	for _, col := range userColumns {
		// Verificar si la columna existe
		var exists bool
		checkQuery := `
			SELECT EXISTS (
				SELECT 1 FROM information_schema.columns 
				WHERE table_name = 'users' AND column_name = $1
			);
		`
		err := Pool.QueryRow(context.Background(), checkQuery, col.name).Scan(&exists)
		if err != nil {
			return fmt.Errorf("error checking column %s: %w", col.name, err)
		}

		// Si no existe, agregarla
		if !exists {
			addQuery := fmt.Sprintf("ALTER TABLE users ADD COLUMN %s %s", col.name, col.definition)
			_, err = Pool.Exec(context.Background(), addQuery)
			if err != nil {
				return fmt.Errorf("error adding column %s: %w", col.name, err)
			}
			fmt.Printf("Columna %s agregada a la tabla users\n", col.name)
		}
	}

	// Migración de tabla orders
	orderColumns := []struct {
		name       string
		definition string
	}{
		{"order_number", "VARCHAR(50) UNIQUE"},
		{"payment_status", "VARCHAR(20) NOT NULL DEFAULT 'pending'"},
		{"currency", "VARCHAR(3) NOT NULL DEFAULT 'USD'"},
		{"subtotal", "DECIMAL(10, 2) NOT NULL DEFAULT 0"},
		{"tax", "DECIMAL(10, 2) NOT NULL DEFAULT 0"},
		{"shipping", "DECIMAL(10, 2) NOT NULL DEFAULT 0"},
		{"total", "DECIMAL(10, 2) NOT NULL DEFAULT 0"},
		{"shipping_address", "JSONB"},
		{"billing_address", "JSONB"},
		{"notes", "TEXT"},
	}

	for _, col := range orderColumns {
		// Verificar si la columna existe
		var exists bool
		checkQuery := `
			SELECT EXISTS (
				SELECT 1 FROM information_schema.columns 
				WHERE table_name = 'orders' AND column_name = $1
			);
		`
		err := Pool.QueryRow(context.Background(), checkQuery, col.name).Scan(&exists)
		if err != nil {
			return fmt.Errorf("error checking column %s: %w", col.name, err)
		}

		// Si no existe, agregarla
		if !exists {
			addQuery := fmt.Sprintf("ALTER TABLE orders ADD COLUMN %s %s", col.name, col.definition)
			_, err = Pool.Exec(context.Background(), addQuery)
			if err != nil {
				return fmt.Errorf("error adding column %s: %w", col.name, err)
			}
			fmt.Printf("Columna %s agregada a la tabla orders\n", col.name)
		}
	}

	// Migración de tabla products
	productColumns := []struct {
		name       string
		definition string
	}{
		{"image_url", "VARCHAR(255)"},
		{"stock", "INTEGER DEFAULT 0"},
		{"sku", "VARCHAR(100)"},
		{"weight", "DECIMAL(10, 2)"},
		{"dimensions", "VARCHAR(100)"},
		{"is_active", "BOOLEAN DEFAULT TRUE"},
		{"updated_at", "TIMESTAMPTZ NOT NULL DEFAULT NOW()"},
	}

	for _, col := range productColumns {
		// Verificar si la columna existe
		var exists bool
		checkQuery := `
			SELECT EXISTS (
				SELECT 1 FROM information_schema.columns 
				WHERE table_name = 'products' AND column_name = $1
			);
		`
		err := Pool.QueryRow(context.Background(), checkQuery, col.name).Scan(&exists)
		if err != nil {
			return fmt.Errorf("error checking column %s: %w", col.name, err)
		}

		// Si no existe, agregarla
		if !exists {
			addQuery := fmt.Sprintf("ALTER TABLE products ADD COLUMN %s %s", col.name, col.definition)
			_, err = Pool.Exec(context.Background(), addQuery)
			if err != nil {
				return fmt.Errorf("error adding column %s: %w", col.name, err)
			}
			fmt.Printf("Columna %s agregada a la tabla products\n", col.name)
		}
	}

	return nil
}

// Guardar refresh token en la base de datos
func SaveRefreshToken(refreshToken *models.RefreshToken) error {
	query := `
		INSERT INTO refresh_tokens (user_id, token, expires_at, device_info, ip_address)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, created_at
	`

	err := Pool.QueryRow(context.Background(), query,
		refreshToken.UserID,
		refreshToken.Token,
		refreshToken.ExpiresAt,
		refreshToken.DeviceInfo,
		refreshToken.IPAddress,
	).Scan(&refreshToken.ID, &refreshToken.CreatedAt)

	if err != nil {
		return fmt.Errorf("error saving refresh token: %w", err)
	}

	return nil
}

// Obtener refresh token por token
func GetRefreshToken(token string) (*models.RefreshToken, error) {
	query := `
		SELECT id, user_id, token, expires_at, created_at, device_info, ip_address
		FROM refresh_tokens
		WHERE token = $1
	`

	var rt models.RefreshToken
	err := Pool.QueryRow(context.Background(), query, token).Scan(
		&rt.ID,
		&rt.UserID,
		&rt.Token,
		&rt.ExpiresAt,
		&rt.CreatedAt,
		&rt.DeviceInfo,
		&rt.IPAddress,
	)

	if err != nil {
		return nil, fmt.Errorf("error getting refresh token: %w", err)
	}

	return &rt, nil
}

// Revocar refresh token
func RevokeRefreshToken(token string) error {
	query := `UPDATE refresh_tokens SET is_revoked = TRUE WHERE token = $1`

	_, err := Pool.Exec(context.Background(), query, token)
	if err != nil {
		return fmt.Errorf("error revoking refresh token: %w", err)
	}

	return nil
}

// Revocar todos los refresh tokens de un usuario
func RevokeAllUserRefreshTokens(userID int) error {
	query := `UPDATE refresh_tokens SET is_revoked = TRUE WHERE user_id = $1`

	_, err := Pool.Exec(context.Background(), query, userID)
	if err != nil {
		return fmt.Errorf("error revoking user refresh tokens: %w", err)
	}

	return nil
}

// Limpiar refresh tokens expirados
func CleanExpiredRefreshTokens() error {
	query := `DELETE FROM refresh_tokens WHERE expires_at < NOW()`

	_, err := Pool.Exec(context.Background(), query)
	if err != nil {
		return fmt.Errorf("error cleaning expired refresh tokens: %w", err)
	}

	return nil
}

// Guardar sesión de usuario
func SaveUserSession(session *models.UserSession) error {
	query := `
		INSERT INTO user_sessions (user_id, session_token, device_info, ip_address, user_agent)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id
	`

	err := Pool.QueryRow(context.Background(), query,
		session.UserID,
		session.SessionToken,
		session.DeviceInfo,
		session.IPAddress,
		session.UserAgent,
	).Scan(&session.ID)

	if err != nil {
		return fmt.Errorf("error saving user session: %w", err)
	}

	return nil
}

// Obtener sesiones activas de un usuario
func GetUserActiveSessions(userID int) ([]models.UserSession, error) {
	query := `
		SELECT id, user_id, session_token, device_info, ip_address, user_agent, is_active
		FROM user_sessions
		WHERE user_id = $1 AND is_active = TRUE
		ORDER BY id DESC
	`

	rows, err := Pool.Query(context.Background(), query, userID)
	if err != nil {
		return nil, fmt.Errorf("error getting user sessions: %w", err)
	}
	defer rows.Close()

	var sessions []models.UserSession
	for rows.Next() {
		var session models.UserSession
		err := rows.Scan(
			&session.ID,
			&session.UserID,
			&session.SessionToken,
			&session.DeviceInfo,
			&session.IPAddress,
			&session.UserAgent,
			&session.IsActive,
		)
		if err != nil {
			return nil, fmt.Errorf("error scanning session: %w", err)
		}
		sessions = append(sessions, session)
	}

	return sessions, nil
}

// Cerrar sesión específica
func CloseUserSession(sessionToken string, userID int) error {
	query := `
		UPDATE user_sessions
		SET is_active = FALSE
		WHERE session_token = $1 AND user_id = $2
	`
	cmdTag, err := Pool.Exec(context.Background(), query, sessionToken, userID)
	if err != nil {
		return fmt.Errorf("error al cerrar sesión: %w", err)
	}
	if cmdTag.RowsAffected() == 0 {
		return fmt.Errorf("sesión no encontrada o no pertenece al usuario")
	}
	return nil
}

// Obtener usuario por ID
func GetUserByID(db *pgxpool.Pool, userID int) (*models.User, error) {
	var user models.User
	query := "SELECT id, email, is_admin, is_active FROM users WHERE id = $1"
	err := db.QueryRow(context.Background(), query, userID).Scan(&user.ID, &user.Email, &user.IsAdmin, &user.IsActive)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("user not found")
		}
		return nil, err
	}
	return &user, nil
}

// Obtener credenciales de un usuario
func GetUserCredentials(db *pgxpool.Pool, userID int) ([]webauthn.Credential, error) {
	rows, err := db.Query(context.Background(),
		`SELECT credential_id, public_key, sign_count, transports, aaguid FROM credentials WHERE user_id = $1`, userID)
	if err != nil {
		return nil, fmt.Errorf("error cargando credenciales para usuario %d: %w", userID, err)
	}
	defer rows.Close()

	var creds []webauthn.Credential
	for rows.Next() {
		var cred models.Credential
		err := rows.Scan(&cred.CredentialID, &cred.PublicKey, &cred.SignCount, &cred.Transports, &cred.AAGUID)
		if err != nil {
			return nil, fmt.Errorf("error leyendo credencial: %w", err)
		}
		creds = append(creds, cred.ToWebauthn())
	}

	return creds, nil
}

// Actualizar perfil de usuario
func UpdateUserProfile(db *pgxpool.Pool, userID int, updates map[string]interface{}) error {
	var setClauses []string
	var args []interface{}
	argCount := 1

	for key, value := range updates {
		setClauses = append(setClauses, fmt.Sprintf("%s = $%d", key, argCount))
		args = append(args, value)
		argCount++
	}

	if len(setClauses) == 0 {
		return fmt.Errorf("no fields to update")
	}

	args = append(args, userID)
	query := fmt.Sprintf("UPDATE users SET %s, updated_at = NOW() WHERE id = $%d", strings.Join(setClauses, ", "), argCount)

	_, err := db.Exec(context.Background(), query, args...)
	if err != nil {
		return fmt.Errorf("error updating user profile: %v", err)
	}

	return nil
}

// ---- Funciones del Carrito ----

// FindOrCreateCartByUserID busca un carrito para el usuario. Si no existe, lo crea.
func FindOrCreateCartByUserID(db *pgxpool.Pool, userID int) (int, error) {
	var cartID int
	// Intenta encontrar un carrito existente
	err := db.QueryRow(context.Background(), "SELECT id FROM carts WHERE user_id = $1", userID).Scan(&cartID)
	if err == nil {
		return cartID, nil // Carrito encontrado
	}

	if err != pgx.ErrNoRows {
		return 0, fmt.Errorf("error finding cart: %w", err)
	}

	// Si no se encuentra, crea uno nuevo
	err = db.QueryRow(context.Background(), "INSERT INTO carts (user_id) VALUES ($1) RETURNING id", userID).Scan(&cartID)
	if err != nil {
		return 0, fmt.Errorf("error creating cart: %w", err)
	}

	return cartID, nil
}

// GetCartContents obtiene todos los items de un carrito con sus detalles de producto.
func GetCartContents(db *pgxpool.Pool, cartID int) ([]models.CartItem, error) {
	query := `
		SELECT ci.id, ci.product_id, ci.quantity, ci.created_at, ci.updated_at,
			   p.name, p.price, p.image_url
		FROM cart_items ci
		JOIN products p ON ci.product_id = p.id
		WHERE ci.cart_id = $1
		ORDER BY ci.created_at DESC
	`
	rows, err := db.Query(context.Background(), query, cartID)
	if err != nil {
		return nil, fmt.Errorf("error getting cart contents: %w", err)
	}
	defer rows.Close()

	var items []models.CartItem
	for rows.Next() {
		var item models.CartItem
		var product models.Product
		err := rows.Scan(
			&item.ID, &item.ProductID, &item.Quantity,
			&item.CreatedAt, &item.UpdatedAt,
			&product.Name, &product.Price, &product.ImageURL,
		)
		if err != nil {
			return nil, fmt.Errorf("error scanning cart item: %w", err)
		}
		item.Product = &product
		items = append(items, item)
	}
	return items, nil
}

// AddItemToCart agrega un producto al carrito o actualiza su cantidad si ya existe.
func AddItemToCart(db *pgxpool.Pool, cartID, productID, quantity int) error {
	// ON CONFLICT se encarga de actualizar la cantidad si el producto ya está en el carrito
	query := `
		INSERT INTO cart_items (cart_id, product_id, quantity)
		VALUES ($1, $2, $3)
		ON CONFLICT (cart_id, product_id) DO UPDATE
		SET quantity = cart_items.quantity + $3, updated_at = NOW()
	`
	_, err := db.Exec(context.Background(), query, cartID, productID, quantity)
	return err
}

// UpdateCartItemQuantity actualiza la cantidad de un item específico en el carrito.
func UpdateCartItemQuantity(db *pgxpool.Pool, cartItemID int, quantity int) error {
	if quantity > 0 {
		query := `
			UPDATE cart_items
			SET quantity = $1, updated_at = NOW()
			WHERE id = $2
		`
		_, err := db.Exec(context.Background(), query, quantity, cartItemID)
		return err
	}
	// Si la cantidad es 0, eliminamos el ítem
	return RemoveItemFromCart(db, cartItemID)
}

// RemoveItemFromCart elimina un item del carrito por su ID.
func RemoveItemFromCart(db *pgxpool.Pool, cartItemID int) error {
	_, err := db.Exec(context.Background(), "DELETE FROM cart_items WHERE id = $1", cartItemID)
	return err
}

// GetProductByID obtiene un producto por su ID
func GetProductByID(db *pgxpool.Pool, productID int) (*models.Product, error) {
	var p models.Product
	query := `
        SELECT id, name, description, price, category_id, created_at, image_url, dimensions, stock, is_active
        FROM products
        WHERE id = $1
    `
	err := db.QueryRow(context.Background(), query, productID).Scan(
		&p.ID, &p.Name, &p.Description, &p.Price, &p.CategoryID, &p.CreatedAt,
		&p.ImageURL, &p.Dimensions, &p.Stock, &p.IsActive,
	)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

// ===== FUNCIONES PARA PEDIDOS =====

// CreateOrder crea un nuevo pedido
func CreateOrder(db *pgxpool.Pool, order *models.Order) error {
	// Convertir direcciones a JSON
	shippingAddrJSON, err := json.Marshal(order.ShippingAddress)
	if err != nil {
		return fmt.Errorf("error marshalling shipping address: %w", err)
	}

	billingAddrJSON, err := json.Marshal(order.BillingAddress)
	if err != nil {
		return fmt.Errorf("error marshalling billing address: %w", err)
	}

	query := `
		INSERT INTO orders (user_id, order_number, status, subtotal, tax, shipping, total, currency, payment_status, shipping_address, billing_address, notes)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
		RETURNING id, created_at
	`

	err = db.QueryRow(context.Background(), query,
		order.UserID,
		order.OrderNumber,
		order.Status,
		order.Subtotal,
		order.Tax,
		order.Shipping,
		order.Total,
		order.Currency,
		order.PaymentStatus,
		shippingAddrJSON,
		billingAddrJSON,
		order.Notes,
	).Scan(&order.ID, &order.CreatedAt)

	if err != nil {
		return fmt.Errorf("error creando pedido: %w", err)
	}

	return nil
}

// GetOrderByID obtiene un pedido por su ID
func GetOrderByID(db *pgxpool.Pool, orderID int) (*models.Order, error) {
	query := `
		SELECT id, user_id, order_number, status, subtotal, tax, shipping, total, currency, payment_status, shipping_address, billing_address, notes, created_at, updated_at
		FROM orders
		WHERE id = $1
	`

	var order models.Order
	var shippingAddrJSON, billingAddrJSON []byte

	err := db.QueryRow(context.Background(), query, orderID).Scan(
		&order.ID,
		&order.UserID,
		&order.OrderNumber,
		&order.Status,
		&order.Subtotal,
		&order.Tax,
		&order.Shipping,
		&order.Total,
		&order.Currency,
		&order.PaymentStatus,
		&shippingAddrJSON,
		&billingAddrJSON,
		&order.Notes,
		&order.CreatedAt,
		&order.UpdatedAt,
	)

	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("pedido no encontrado")
		}
		return nil, fmt.Errorf("error obteniendo pedido: %w", err)
	}

	// Deserializar direcciones JSON
	if len(shippingAddrJSON) > 0 {
		var shippingAddr models.Address
		if err := json.Unmarshal(shippingAddrJSON, &shippingAddr); err == nil {
			order.ShippingAddress = &shippingAddr
		}
	}

	if len(billingAddrJSON) > 0 {
		var billingAddr models.Address
		if err := json.Unmarshal(billingAddrJSON, &billingAddr); err == nil {
			order.BillingAddress = &billingAddr
		}
	}

	return &order, nil
}

// GetUserOrders obtiene todos los pedidos de un usuario
func GetUserOrders(db *pgxpool.Pool, userID int) ([]models.Order, error) {
	query := `
		SELECT id, user_id, order_number, status, subtotal, tax, shipping, total, currency, payment_status, shipping_address, billing_address, notes, created_at, updated_at
		FROM orders
		WHERE user_id = $1
		ORDER BY created_at DESC
	`

	rows, err := db.Query(context.Background(), query, userID)
	if err != nil {
		return nil, fmt.Errorf("error obteniendo pedidos: %w", err)
	}
	defer rows.Close()

	var orders []models.Order
	for rows.Next() {
		var order models.Order
		var shippingAddrJSON, billingAddrJSON []byte

		err := rows.Scan(
			&order.ID,
			&order.UserID,
			&order.OrderNumber,
			&order.Status,
			&order.Subtotal,
			&order.Tax,
			&order.Shipping,
			&order.Total,
			&order.Currency,
			&order.PaymentStatus,
			&shippingAddrJSON,
			&billingAddrJSON,
			&order.Notes,
			&order.CreatedAt,
			&order.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("error escaneando pedido: %w", err)
		}

		// Deserializar direcciones JSON
		if len(shippingAddrJSON) > 0 {
			var shippingAddr models.Address
			if err := json.Unmarshal(shippingAddrJSON, &shippingAddr); err == nil {
				order.ShippingAddress = &shippingAddr
			}
		}

		if len(billingAddrJSON) > 0 {
			var billingAddr models.Address
			if err := json.Unmarshal(billingAddrJSON, &billingAddr); err == nil {
				order.BillingAddress = &billingAddr
			}
		}

		orders = append(orders, order)
	}

	return orders, nil
}

// UpdateOrderPaymentStatus actualiza el estado de pago de un pedido
func UpdateOrderPaymentStatus(db *pgxpool.Pool, orderID int, paymentStatus string) error {
	query := `
		UPDATE orders
		SET payment_status = $1, updated_at = NOW()
		WHERE id = $2
	`

	result, err := db.Exec(context.Background(), query, paymentStatus, orderID)
	if err != nil {
		return fmt.Errorf("error actualizando estado de pago: %w", err)
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf("pedido no encontrado")
	}

	return nil
}

// UpdateOrderStatus actualiza el estado general de un pedido
func UpdateOrderStatus(db *pgxpool.Pool, orderID int, status string) error {
	query := `
		UPDATE orders
		SET status = $1, updated_at = NOW()
		WHERE id = $2
	`

	result, err := db.Exec(context.Background(), query, status, orderID)
	if err != nil {
		return fmt.Errorf("error actualizando estado del pedido: %w", err)
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf("pedido no encontrado")
	}

	return nil
}

// ===== FUNCIONES PARA PAGOS =====

// SavePayment guarda un nuevo pago
func SavePayment(db *pgxpool.Pool, payment *models.Payment) error {
	query := `
		INSERT INTO payments (order_id, payment_method, amount, currency, status, stripe_payment_intent_id, stripe_customer_id, transaction_id, error_message, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		RETURNING id
	`

	err := db.QueryRow(context.Background(), query,
		payment.OrderID,
		payment.PaymentMethod,
		payment.Amount,
		payment.Currency,
		payment.Status,
		payment.StripePaymentIntentID,
		payment.StripeCustomerID,
		payment.TransactionID,
		payment.ErrorMessage,
		payment.CreatedAt,
		payment.UpdatedAt,
	).Scan(&payment.ID)

	if err != nil {
		return fmt.Errorf("error guardando pago: %w", err)
	}

	return nil
}

// GetPaymentByStripeIntentID obtiene un pago por su Stripe Payment Intent ID
func GetPaymentByStripeIntentID(db *pgxpool.Pool, stripePaymentIntentID string) (*models.Payment, error) {
	query := `
		SELECT id, order_id, payment_method, amount, currency, status, stripe_payment_intent_id, stripe_customer_id, transaction_id, error_message, created_at, updated_at
		FROM payments
		WHERE stripe_payment_intent_id = $1
	`

	var payment models.Payment
	err := db.QueryRow(context.Background(), query, stripePaymentIntentID).Scan(
		&payment.ID,
		&payment.OrderID,
		&payment.PaymentMethod,
		&payment.Amount,
		&payment.Currency,
		&payment.Status,
		&payment.StripePaymentIntentID,
		&payment.StripeCustomerID,
		&payment.TransactionID,
		&payment.ErrorMessage,
		&payment.CreatedAt,
		&payment.UpdatedAt,
	)

	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("pago no encontrado")
		}
		return nil, fmt.Errorf("error obteniendo pago: %w", err)
	}

	return &payment, nil
}

// UpdatePayment actualiza un pago existente
func UpdatePayment(db *pgxpool.Pool, payment *models.Payment) error {
	query := `
		UPDATE payments
		SET status = $1, transaction_id = $2, error_message = $3, updated_at = $4
		WHERE id = $5
	`

	result, err := db.Exec(context.Background(), query,
		payment.Status,
		payment.TransactionID,
		payment.ErrorMessage,
		payment.UpdatedAt,
		payment.ID,
	)

	if err != nil {
		return fmt.Errorf("error actualizando pago: %w", err)
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf("pago no encontrado")
	}

	return nil
}

// GetOrderPayments obtiene todos los pagos de un pedido
func GetOrderPayments(db *pgxpool.Pool, orderID int) ([]models.Payment, error) {
	query := `
		SELECT id, order_id, payment_method, amount, currency, status, stripe_payment_intent_id, stripe_customer_id, transaction_id, error_message, created_at, updated_at
		FROM payments
		WHERE order_id = $1
		ORDER BY created_at DESC
	`

	rows, err := db.Query(context.Background(), query, orderID)
	if err != nil {
		return nil, fmt.Errorf("error obteniendo pagos: %w", err)
	}
	defer rows.Close()

	var payments []models.Payment
	for rows.Next() {
		var payment models.Payment
		err := rows.Scan(
			&payment.ID,
			&payment.OrderID,
			&payment.PaymentMethod,
			&payment.Amount,
			&payment.Currency,
			&payment.Status,
			&payment.StripePaymentIntentID,
			&payment.StripeCustomerID,
			&payment.TransactionID,
			&payment.ErrorMessage,
			&payment.CreatedAt,
			&payment.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("error escaneando pago: %w", err)
		}
		payments = append(payments, payment)
	}

	return payments, nil
}

// ===== FUNCIONES PARA ITEMS DE PEDIDO =====

// SaveOrderItem guarda un item de pedido
func SaveOrderItem(db *pgxpool.Pool, orderItem *models.OrderItem) error {
	query := `
		INSERT INTO order_items (order_id, product_id, quantity, price, subtotal)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id
	`

	err := db.QueryRow(context.Background(), query,
		orderItem.OrderID,
		orderItem.ProductID,
		orderItem.Quantity,
		orderItem.Price,
		orderItem.Subtotal,
	).Scan(&orderItem.ID)

	if err != nil {
		return fmt.Errorf("error guardando item de pedido: %w", err)
	}

	return nil
}

// GetOrderItems obtiene todos los items de una orden específica
func GetOrderItems(db *pgxpool.Pool, orderID int) ([]models.OrderItem, error) {
	query := `
		SELECT id, order_id, product_id, quantity, price
		FROM order_items
		WHERE order_id = $1
	`
	rows, err := db.Query(context.Background(), query, orderID)
	if err != nil {
		return nil, fmt.Errorf("error obteniendo items de la orden: %w", err)
	}
	defer rows.Close()

	var orderItems []models.OrderItem
	for rows.Next() {
		var item models.OrderItem
		err := rows.Scan(&item.ID, &item.OrderID, &item.ProductID, &item.Quantity, &item.Price)
		if err != nil {
			return nil, fmt.Errorf("error escaneando item de la orden: %w", err)
		}
		orderItems = append(orderItems, item)
	}
	return orderItems, nil
}

func GetUserByEmail(db *pgxpool.Pool, email string) (*models.User, error) {
	var user models.User
	query := "SELECT id, email, password_hash, is_admin, is_active FROM users WHERE email = $1"
	err := db.QueryRow(context.Background(), query, email).Scan(&user.ID, &user.Email, &user.PasswordHash, &user.IsAdmin, &user.IsActive)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("user not found with email: %s", email)
		}
		return nil, fmt.Errorf("error getting user by email: %w", err)
	}
	return &user, nil
}

// CreateUser crea un nuevo usuario o actualiza el token de uno no verificado.
func CreateUser(db *pgxpool.Pool, email, hashedCode string, expiresAt time.Time) (*models.User, error) {
	var user models.User
	query := `
		INSERT INTO users (email, verification_token, verification_token_expires_at, is_verified, is_active)
		VALUES ($1, $2, $3, FALSE, FALSE)
		ON CONFLICT (email) DO UPDATE SET
			verification_token = EXCLUDED.verification_token,
			verification_token_expires_at = EXCLUDED.verification_token_expires_at
		WHERE
			users.is_verified = FALSE
		RETURNING id, email, is_verified, is_admin, is_active
	`
	err := db.QueryRow(context.Background(), query, email, hashedCode, expiresAt).Scan(&user.ID, &user.Email, &user.IsVerified, &user.IsAdmin, &user.IsActive)
	if err != nil {
		if err == pgx.ErrNoRows {
			// Esto significa que el usuario ya existe y está verificado.
			return nil, fmt.Errorf("user already exists and is verified")
		}
		return nil, fmt.Errorf("error creating or updating user for verification: %w", err)
	}
	return &user, nil
}

// GetUserByEmailWithPassword obtiene un usuario por email con todos los datos necesarios para autenticación.
func GetUserByEmailWithPassword(db *pgxpool.Pool, email string) (*models.User, error) {
	var user models.User
	query := `
		SELECT id, email, password_hash, is_admin, is_active, is_verified, verification_token, verification_token_expires_at
		FROM users 
		WHERE email = $1`
	err := db.QueryRow(context.Background(), query, email).Scan(
		&user.ID, &user.Email, &user.PasswordHash, &user.IsAdmin, &user.IsActive, &user.IsVerified, &user.VerificationToken, &user.VerificationTokenExpiresAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("user not found")
		}
		return nil, fmt.Errorf("error getting user by email with password: %w", err)
	}
	return &user, nil
}

func MarkUserAsVerified(db *pgxpool.Pool, userID int) error {
	query := `UPDATE users SET is_verified = true, is_active = true, verification_token = NULL, verification_token_expires_at = NULL, updated_at = NOW() WHERE id = $1`
	_, err := db.Exec(context.Background(), query, userID)
	if err != nil {
		return fmt.Errorf("error marking user as verified: %w", err)
	}
	return nil
}

func SaveCredential(db *pgxpool.Pool, userID int, cred webauthn.Credential) error {
	transports := []string{}
	for _, t := range cred.Transport {
		transports = append(transports, string(t))
	}

	query := `
		INSERT INTO credentials (user_id, credential_id, public_key, sign_count, transports, aaguid)
		VALUES ($1, $2, $3, $4, $5, $6)
	`
	_, err := db.Exec(context.Background(), query, userID, cred.ID, cred.PublicKey, cred.Authenticator.SignCount, transports, cred.Authenticator.AAGUID)
	if err != nil {
		return fmt.Errorf("error saving credential: %w", err)
	}
	return nil
}

// GetCredentialsByUser obtiene todas las credenciales para un usuario dado.
func GetCredentialsByUser(db *pgxpool.Pool, userID int) ([]webauthn.Credential, error) {
	rows, err := db.Query(context.Background(), "SELECT credential_id, public_key, sign_count, transports, aaguid FROM credentials WHERE user_id = $1", userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var credentials []webauthn.Credential
	for rows.Next() {
		var cred webauthn.Credential
		var transports []string
		var aaguid []byte
		if err := rows.Scan(&cred.ID, &cred.PublicKey, &cred.Authenticator.SignCount, &transports, &aaguid); err != nil {
			return nil, fmt.Errorf("error scanning credential: %w", err)
		}
		cred.Authenticator.AAGUID = aaguid

		for _, t := range transports {
			cred.Transport = append(cred.Transport, protocol.AuthenticatorTransport(t))
		}

		credentials = append(credentials, cred)
	}
	return credentials, nil
}

// GetCredentialByID obtiene una credencial por su ID.
func GetCredentialByID(db *pgxpool.Pool, credentialID []byte) (*webauthn.Credential, int, error) {
	var cred webauthn.Credential
	var userID int
	var transportBytes []byte
	var aaguid []byte

	query := "SELECT user_id, public_key, sign_count, transports, aaguid FROM credentials WHERE credential_id = $1"
	err := db.QueryRow(context.Background(), query, credentialID).Scan(&userID, &cred.PublicKey, &cred.Authenticator.SignCount, &transportBytes, &aaguid)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, 0, fmt.Errorf("credential not found")
		}
		return nil, 0, err
	}
	cred.ID = credentialID
	cred.Authenticator.AAGUID = aaguid

	var transports []string
	if err := json.Unmarshal(transportBytes, &transports); err != nil {
		return nil, 0, fmt.Errorf("error unmarshalling transports for credential %s: %w", string(credentialID), err)
	}
	for _, t := range transports {
		cred.Transport = append(cred.Transport, protocol.AuthenticatorTransport(t))
	}

	return &cred, userID, nil
}
