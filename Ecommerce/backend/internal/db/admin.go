package db

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/tuusuario/ecommerce-backend/internal/models"
)

// ===== PRODUCTOS =====

// CreateProduct crea un nuevo producto
func CreateProduct(db *pgxpool.Pool, product *models.Product) (*models.Product, error) {
	query := `
		INSERT INTO products (name, description, price, image_url, category_id, stock, sku, weight, dimensions, is_active, created_at, updated_at, model_url)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
		RETURNING id, name, description, price, image_url, category_id, stock, sku, weight, dimensions, is_active, created_at, updated_at, model_url
	`

	err := db.QueryRow(context.Background(), query,
		product.Name, product.Description, product.Price, product.ImageURL,
		product.CategoryID, product.Stock, product.SKU, product.Weight,
		product.Dimensions, product.IsActive, product.CreatedAt, product.UpdatedAt, product.ModelURL,
	).Scan(
		&product.ID, &product.Name, &product.Description, &product.Price,
		&product.ImageURL, &product.CategoryID, &product.Stock, &product.SKU,
		&product.Weight, &product.Dimensions, &product.IsActive,
		&product.CreatedAt, &product.UpdatedAt, &product.ModelURL,
	)

	if err != nil {
		return nil, fmt.Errorf("error creando producto: %v", err)
	}

	return product, nil
}

// UpdateProduct actualiza un producto existente
func UpdateProduct(db *pgxpool.Pool, product *models.Product) (*models.Product, error) {
	query := `
		UPDATE products 
		SET name = $1, description = $2, price = $3, image_url = $4, 
			category_id = $5, stock = $6, sku = $7, weight = $8, 
			dimensions = $9, is_active = $10, updated_at = $11, featured = $12, model_url = $13
		WHERE id = $14
		RETURNING id, name, description, price, image_url, category_id, stock, sku, weight, dimensions, is_active, created_at, updated_at, featured, model_url
	`

	err := db.QueryRow(context.Background(), query,
		product.Name, product.Description, product.Price, product.ImageURL,
		product.CategoryID, product.Stock, product.SKU, product.Weight,
		product.Dimensions, product.IsActive, product.UpdatedAt, product.Featured, product.ModelURL, product.ID,
	).Scan(
		&product.ID, &product.Name, &product.Description, &product.Price,
		&product.ImageURL, &product.CategoryID, &product.Stock, &product.SKU,
		&product.Weight, &product.Dimensions, &product.IsActive,
		&product.CreatedAt, &product.UpdatedAt, &product.Featured, &product.ModelURL,
	)

	if err != nil {
		return nil, fmt.Errorf("error actualizando producto: %v", err)
	}

	return product, nil
}

// DeleteProduct elimina un producto (soft delete)
func DeleteProduct(db *pgxpool.Pool, productID int) error {
	query := `UPDATE products SET is_active = false, updated_at = NOW() WHERE id = $1`

	_, err := db.Exec(context.Background(), query, productID)
	if err != nil {
		return fmt.Errorf("error eliminando producto: %v", err)
	}

	return nil
}

// GetAllProductsAdmin obtiene todos los productos con paginación y filtros
func GetAllProductsAdmin(db *pgxpool.Pool, page, limit int, search string, categoryID int) ([]models.Product, int, error) {
	offset := (page - 1) * limit

	// Construir la consulta base
	baseQuery := `
		SELECT p.id, p.name, p.description, p.price, p.image_url, p.category_id, 
			   p.stock, p.sku, p.weight, p.dimensions, p.is_active, p.created_at, p.updated_at,
			   p.model_url, c.name as category_name
		FROM products p
		LEFT JOIN categories c ON p.category_id = c.id
		WHERE 1=1
	`

	// Construir la consulta de conteo
	countQuery := `SELECT COUNT(*) FROM products p WHERE 1=1`

	var args []interface{}
	argCount := 1

	// Agregar filtros
	if search != "" {
		baseQuery += fmt.Sprintf(" AND (p.name ILIKE $%d OR p.description ILIKE $%d OR p.sku ILIKE $%d)", argCount, argCount, argCount)
		countQuery += fmt.Sprintf(" AND (p.name ILIKE $%d OR p.description ILIKE $%d OR p.sku ILIKE $%d)", argCount, argCount, argCount)
		args = append(args, "%"+search+"%")
		argCount++
	}

	if categoryID > 0 {
		baseQuery += fmt.Sprintf(" AND p.category_id = $%d", argCount)
		countQuery += fmt.Sprintf(" AND p.category_id = $%d", argCount)
		args = append(args, categoryID)
		argCount++
	}

	// Agregar ordenamiento y paginación
	baseQuery += " ORDER BY p.created_at DESC LIMIT $" + fmt.Sprint(argCount) + " OFFSET $" + fmt.Sprint(argCount+1)
	argsWithPagination := append(args, limit, offset)

	// Ejecutar consulta de conteo
	var total int
	err := db.QueryRow(context.Background(), countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("error contando productos: %v", err)
	}

	// Ejecutar consulta principal
	rows, err := db.Query(context.Background(), baseQuery, argsWithPagination...)
	if err != nil {
		return nil, 0, fmt.Errorf("error obteniendo productos: %v", err)
	}
	defer rows.Close()

	var products []models.Product
	for rows.Next() {
		var product models.Product
		err := rows.Scan(
			&product.ID, &product.Name, &product.Description, &product.Price,
			&product.ImageURL, &product.CategoryID, &product.Stock, &product.SKU,
			&product.Weight, &product.Dimensions, &product.IsActive,
			&product.CreatedAt, &product.UpdatedAt, &product.ModelURL, &product.CategoryName,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("error escaneando producto: %v", err)
		}
		products = append(products, product)
	}

	return products, total, nil
}

// GetPublicProducts obtiene productos para la vista pública (activos) con filtros y paginación
func GetPublicProducts(db *pgxpool.Pool, page, limit int, categoryID int, sortBy, order, search string, featuredOnly bool) ([]models.Product, int, error) {
	offset := (page - 1) * limit

	baseQuery := `
		SELECT p.id, p.name, p.description, p.price, p.image_url, p.category_id, 
			   p.stock, p.sku, p.weight, p.dimensions, p.model_url, p.is_active, p.created_at, p.updated_at,
			   COALESCE(c.name, 'Sin categoría') as category_name
		FROM products p
		LEFT JOIN categories c ON p.category_id = c.id
		WHERE p.is_active = true
	`
	countQuery := `SELECT COUNT(*) FROM products p WHERE p.is_active = true`

	var args []interface{}
	argCount := 1

	if search != "" {
		baseQuery += fmt.Sprintf(" AND (p.name ILIKE $%d OR p.description ILIKE $%d)", argCount, argCount)
		countQuery += fmt.Sprintf(" AND (p.name ILIKE $%d OR p.description ILIKE $%d)", argCount, argCount)
		args = append(args, "%"+search+"%")
		argCount++
	}

	if categoryID > 0 {
		baseQuery += fmt.Sprintf(" AND p.category_id = $%d", argCount)
		countQuery += fmt.Sprintf(" AND p.category_id = $%d", argCount)
		args = append(args, categoryID)
		argCount++
	}

	if featuredOnly {
		baseQuery += " AND p.featured = true"
		countQuery += " AND p.featured = true"
	}

	validSorts := map[string]string{
		"created_at": "p.created_at",
		"price":      "p.price",
		"name":       "p.name",
	}
	sortColumn, ok := validSorts[sortBy]
	if !ok {
		sortColumn = "p.created_at"
	}
	if order != "asc" && order != "desc" {
		order = "desc"
	}

	baseQuery += fmt.Sprintf(" ORDER BY %s %s LIMIT $%d OFFSET $%d", sortColumn, order, argCount, argCount+1)
	argsWithPagination := append(args, limit, offset)

	var total int
	err := db.QueryRow(context.Background(), countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("error contando productos: %v", err)
	}

	rows, err := db.Query(context.Background(), baseQuery, argsWithPagination...)
	if err != nil {
		return nil, 0, fmt.Errorf("error obteniendo productos: %v", err)
	}
	defer rows.Close()

	var products []models.Product
	for rows.Next() {
		var product models.Product
		err := rows.Scan(
			&product.ID, &product.Name, &product.Description, &product.Price,
			&product.ImageURL, &product.CategoryID, &product.Stock, &product.SKU,
			&product.Weight, &product.Dimensions, &product.ModelURL, &product.IsActive,
			&product.CreatedAt, &product.UpdatedAt, &product.CategoryName,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("error escaneando producto: %v", err)
		}
		products = append(products, product)
	}

	return products, total, nil
}

// GetProductSuggestions busca nombres de productos para autocompletar
func GetProductSuggestions(db *pgxpool.Pool, query string) ([]string, error) {
	sqlQuery := `
		SELECT name 
		FROM products 
		WHERE name ILIKE $1 AND is_active = true
		LIMIT 5
	`
	rows, err := db.Query(context.Background(), sqlQuery, "%"+query+"%")
	if err != nil {
		return nil, fmt.Errorf("error obteniendo sugerencias de productos: %v", err)
	}
	defer rows.Close()

	var suggestions []string
	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err != nil {
			return nil, fmt.Errorf("error escaneando sugerencia de producto: %v", err)
		}
		suggestions = append(suggestions, name)
	}

	return suggestions, nil
}

// ===== CATEGORÍAS =====

// CreateCategory crea una nueva categoría
func CreateCategory(db *pgxpool.Pool, category *models.Category) (*models.Category, error) {
	query := `
		INSERT INTO categories (name, description, image_url, parent_id, is_active, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, name, description, image_url, parent_id, is_active, created_at, updated_at
	`

	err := db.QueryRow(context.Background(), query,
		category.Name, category.Description, category.ImageURL,
		category.ParentID, category.IsActive, category.CreatedAt, category.UpdatedAt,
	).Scan(
		&category.ID, &category.Name, &category.Description, &category.ImageURL,
		&category.ParentID, &category.IsActive, &category.CreatedAt, &category.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("error creando categoría: %v", err)
	}

	return category, nil
}

// UpdateCategory actualiza una categoría existente
func UpdateCategory(db *pgxpool.Pool, category *models.Category) (*models.Category, error) {
	query := `
		UPDATE categories 
		SET name = $1, description = $2, image_url = $3, parent_id = $4, 
			is_active = $5, updated_at = $6
		WHERE id = $7
		RETURNING id, name, description, image_url, parent_id, is_active, created_at, updated_at
	`

	err := db.QueryRow(context.Background(), query,
		category.Name, category.Description, category.ImageURL,
		category.ParentID, category.IsActive, category.UpdatedAt, category.ID,
	).Scan(
		&category.ID, &category.Name, &category.Description, &category.ImageURL,
		&category.ParentID, &category.IsActive, &category.CreatedAt, &category.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("error actualizando categoría: %v", err)
	}

	return category, nil
}

// DeleteCategory elimina una categoría (soft delete)
func DeleteCategory(db *pgxpool.Pool, categoryID int) error {
	query := `UPDATE categories SET is_active = false, updated_at = NOW() WHERE id = $1`
	_, err := db.Exec(context.Background(), query, categoryID)
	if err != nil {
		return fmt.Errorf("error eliminando categoría: %v", err)
	}
	return nil
}

// GetAllCategories obtiene todas las categorías
func GetAllCategories(db *pgxpool.Pool) ([]models.Category, error) {
	query := `
		SELECT id, name, description, image_url, parent_id, is_active, created_at, updated_at 
		FROM categories 
		ORDER BY name ASC
	`
	rows, err := db.Query(context.Background(), query)
	if err != nil {
		return nil, fmt.Errorf("error obteniendo categorías: %v", err)
	}
	defer rows.Close()

	var categories []models.Category
	for rows.Next() {
		var category models.Category
		err := rows.Scan(
			&category.ID, &category.Name, &category.Description, &category.ImageURL,
			&category.ParentID, &category.IsActive, &category.CreatedAt, &category.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("error escaneando categoría: %v", err)
		}
		categories = append(categories, category)
	}

	return categories, nil
}

// ===== ESTADÍSTICAS =====

// DashboardStats representa las estadísticas del dashboard
type DashboardStats struct {
	TotalProducts   int     `json:"total_products"`
	ActiveProducts  int     `json:"active_products"`
	TotalCategories int     `json:"total_categories"`
	TotalOrders     int     `json:"total_orders"`
	TotalRevenue    float64 `json:"total_revenue"`
	PendingOrders   int     `json:"pending_orders"`
	CompletedOrders int     `json:"completed_orders"`
}

// GetDashboardStats obtiene estadísticas del dashboard
func GetDashboardStats(db *pgxpool.Pool) (*DashboardStats, error) {
	stats := &DashboardStats{}
	var err error

	// Total Products
	err = db.QueryRow(context.Background(), "SELECT COUNT(*) FROM products").Scan(&stats.TotalProducts)
	if err != nil {
		return nil, fmt.Errorf("error en TotalProducts: %w", err)
	}

	// Active Products
	err = db.QueryRow(context.Background(), "SELECT COUNT(*) FROM products WHERE is_active = true").Scan(&stats.ActiveProducts)
	if err != nil {
		return nil, fmt.Errorf("error en ActiveProducts: %w", err)
	}

	// Total Categories
	err = db.QueryRow(context.Background(), "SELECT COUNT(*) FROM categories").Scan(&stats.TotalCategories)
	if err != nil {
		return nil, fmt.Errorf("error en TotalCategories: %w", err)
	}

	// Total Orders
	err = db.QueryRow(context.Background(), "SELECT COUNT(*) FROM orders").Scan(&stats.TotalOrders)
	if err != nil {
		return nil, fmt.Errorf("error en TotalOrders: %w", err)
	}

	// Total Revenue
	err = db.QueryRow(context.Background(), "SELECT COALESCE(SUM(total), 0) FROM orders WHERE status = 'delivered'").Scan(&stats.TotalRevenue)
	if err != nil {
		return nil, fmt.Errorf("error en TotalRevenue: %w", err)
	}

	// Pending Orders
	err = db.QueryRow(context.Background(), "SELECT COUNT(*) FROM orders WHERE status = 'pending'").Scan(&stats.PendingOrders)
	if err != nil {
		return nil, fmt.Errorf("error en PendingOrders: %w", err)
	}

	// Completed Orders
	err = db.QueryRow(context.Background(), "SELECT COUNT(*) FROM orders WHERE status = 'delivered'").Scan(&stats.CompletedOrders)
	if err != nil {
		return nil, fmt.Errorf("error en CompletedOrders: %w", err)
	}

	return stats, nil
}

// UpdateUserAsAdmin establece a un usuario como administrador.
func UpdateUserAsAdmin(db *pgxpool.Pool, email string) error {
	query := `
		UPDATE users 
		SET is_admin = true, updated_at = NOW()
		WHERE email = $1
	`
	_, err := db.Exec(context.Background(), query, email)
	return err
}

// ===== USUARIOS (Admin) =====

// GetAllUsers obtiene todos los usuarios para el panel de administración.
func GetAllUsers(db *pgxpool.Pool) ([]models.User, error) {
	query := `
		SELECT id, email, nombre, apellido, telefono, avatar, is_admin, is_verified, is_active, created_at, updated_at
		FROM users
		ORDER BY created_at DESC
	`
	rows, err := db.Query(context.Background(), query)
	if err != nil {
		return nil, fmt.Errorf("error obteniendo usuarios: %w", err)
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var user models.User
		err := rows.Scan(
			&user.ID,
			&user.Email,
			&user.Nombre,
			&user.Apellido,
			&user.Telefono,
			&user.Avatar,
			&user.IsAdmin,
			&user.IsVerified,
			&user.IsActive,
			&user.CreatedAt,
			&user.UpdatedAt,
		)
		if err != nil {
			// Este log es importante para ver si falla el escaneo de una fila específica
			fmt.Printf("Error escaneando fila de usuario: %v\n", err)
			continue
		}
		users = append(users, user)
	}

	if rows.Err() != nil {
		return nil, fmt.Errorf("error iterando sobre los usuarios: %v", rows.Err())
	}

	fmt.Printf("GetAllUsers: Se encontraron y procesaron %d usuarios.\n", len(users))

	return users, nil
}

// UpdateUserStatus actualiza el estado (rol y activación) de un usuario.
func UpdateUserStatus(db *pgxpool.Pool, userID int, isAdmin bool, isActive bool) error {
	query := `
		UPDATE users
		SET is_admin = $1, is_active = $2, updated_at = NOW()
		WHERE id = $3
	`
	cmd, err := db.Exec(context.Background(), query, isAdmin, isActive, userID)
	if err != nil {
		return fmt.Errorf("error actualizando estado del usuario: %w", err)
	}
	if cmd.RowsAffected() == 0 {
		return fmt.Errorf("usuario no encontrado")
	}
	return nil
}

// DeleteUser elimina completamente un usuario y todos sus datos relacionados
func DeleteUser(db *pgxpool.Pool, userID int) error {
	// Iniciar transacción para asegurar consistencia
	tx, err := db.Begin(context.Background())
	if err != nil {
		return fmt.Errorf("error iniciando transacción: %w", err)
	}
	defer tx.Rollback(context.Background())

	// Eliminar en orden para evitar problemas de foreign key
	// 1. Eliminar credenciales WebAuthn
	_, err = tx.Exec(context.Background(), "DELETE FROM credentials WHERE user_id = $1", userID)
	if err != nil {
		return fmt.Errorf("error eliminando credenciales: %w", err)
	}

	// 2. Eliminar refresh tokens
	_, err = tx.Exec(context.Background(), "DELETE FROM refresh_tokens WHERE user_id = $1", userID)
	if err != nil {
		return fmt.Errorf("error eliminando refresh tokens: %w", err)
	}

	// 3. Eliminar sesiones de usuario
	_, err = tx.Exec(context.Background(), "DELETE FROM user_sessions WHERE user_id = $1", userID)
	if err != nil {
		return fmt.Errorf("error eliminando sesiones: %w", err)
	}

	// 4. Eliminar favoritos
	_, err = tx.Exec(context.Background(), "DELETE FROM favorites WHERE user_id = $1", userID)
	if err != nil {
		return fmt.Errorf("error eliminando favoritos: %w", err)
	}

	// 5. Eliminar direcciones
	_, err = tx.Exec(context.Background(), "DELETE FROM addresses WHERE user_id = $1", userID)
	if err != nil {
		return fmt.Errorf("error eliminando direcciones: %w", err)
	}

	// 6. Eliminar items del carrito y el carrito
	var cartID int
	err = tx.QueryRow(context.Background(), "SELECT id FROM carts WHERE user_id = $1", userID).Scan(&cartID)
	if err == nil {
		// Si el usuario tiene carrito, elimina los items
		_, err = tx.Exec(context.Background(), "DELETE FROM cart_items WHERE cart_id = $1", cartID)
		if err != nil {
			return fmt.Errorf("error eliminando items del carrito: %w", err)
		}
		// Elimina el carrito
		_, err = tx.Exec(context.Background(), "DELETE FROM carts WHERE id = $1", cartID)
		if err != nil {
			return fmt.Errorf("error eliminando carrito: %w", err)
		}
	} else if err.Error() != "no rows in result set" {
		// Si el error no es que no tiene carrito, reporta el error
		return fmt.Errorf("error buscando carrito: %w", err)
	}

	// 7. Eliminar pagos asociados a pedidos del usuario
	_, err = tx.Exec(context.Background(), `
		DELETE FROM payments 
		WHERE order_id IN (SELECT id FROM orders WHERE user_id = $1)
	`, userID)
	if err != nil {
		return fmt.Errorf("error eliminando pagos: %w", err)
	}

	// 8. Eliminar items de pedidos
	_, err = tx.Exec(context.Background(), `
		DELETE FROM order_items 
		WHERE order_id IN (SELECT id FROM orders WHERE user_id = $1)
	`, userID)
	if err != nil {
		return fmt.Errorf("error eliminando items de pedidos: %w", err)
	}

	// 9. Eliminar pedidos
	_, err = tx.Exec(context.Background(), "DELETE FROM orders WHERE user_id = $1", userID)
	if err != nil {
		return fmt.Errorf("error eliminando pedidos: %w", err)
	}

	// 10. Finalmente, eliminar el usuario
	cmd, err := tx.Exec(context.Background(), "DELETE FROM users WHERE id = $1", userID)
	if err != nil {
		return fmt.Errorf("error eliminando usuario: %w", err)
	}
	if cmd.RowsAffected() == 0 {
		return fmt.Errorf("usuario no encontrado")
	}

	// Confirmar transacción
	err = tx.Commit(context.Background())
	if err != nil {
		return fmt.Errorf("error confirmando transacción: %w", err)
	}

	return nil
}

// ===== PEDIDOS (ORDERS) =====

// Listar todos los pedidos con paginación
func GetAllOrdersAdmin(db *pgxpool.Pool, page, limit int) ([]models.Order, int, error) {
	offset := (page - 1) * limit
	query := `SELECT id, user_id, order_number, status, subtotal, tax, shipping, total, currency, payment_status, shipping_address, billing_address, notes, tracking, created_at, updated_at FROM orders ORDER BY created_at DESC LIMIT $1 OFFSET $2`
	rows, err := db.Query(context.Background(), query, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var orders []models.Order
	for rows.Next() {
		var order models.Order
		var shippingAddrJSON, billingAddrJSON []byte
		var tracking sql.NullString
		err := rows.Scan(
			&order.ID, &order.UserID, &order.OrderNumber, &order.Status, &order.Subtotal, &order.Tax, &order.Shipping, &order.Total, &order.Currency, &order.PaymentStatus,
			&shippingAddrJSON, &billingAddrJSON, &order.Notes, &tracking, &order.CreatedAt, &order.UpdatedAt,
		)
		if err != nil {
			return nil, 0, err
		}
		if tracking.Valid {
			order.Tracking = tracking.String
		}
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

	var total int
	err = db.QueryRow(context.Background(), "SELECT COUNT(*) FROM orders").Scan(&total)
	if err != nil {
		return nil, 0, err
	}
	return orders, total, nil
}

// Obtener detalles completos de un pedido (incluye items y pagos)
func GetOrderByIDAdmin(db *pgxpool.Pool, orderID int) (*models.Order, error) {
	order, err := GetOrderByID(db, orderID)
	if err != nil {
		return nil, err
	}
	items, err := GetOrderItems(db, orderID)
	if err == nil {
		order.Items = items
	}
	payments, err := GetOrderPayments(db, orderID)
	if err == nil && len(payments) > 0 {
		order.Payment = &payments[0]
	}
	return order, nil
}

// Actualizar el número de tracking de un pedido
func UpdateOrderTracking(db *pgxpool.Pool, orderID int, tracking string) error {
	query := `UPDATE orders SET tracking = $1, updated_at = NOW() WHERE id = $2`
	res, err := db.Exec(context.Background(), query, tracking, orderID)
	if err != nil {
		return err
	}
	if res.RowsAffected() == 0 {
		return fmt.Errorf("pedido no encontrado")
	}
	return nil
}

// MIGRACIÓN: agregar columna tracking si no existe
type columnCheck struct{ Exists bool }

func ensureTrackingColumn(db *pgxpool.Pool) error {
	var exists bool
	err := db.QueryRow(context.Background(), `SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='tracking')`).Scan(&exists)
	if err != nil {
		return err
	}
	if !exists {
		_, err = db.Exec(context.Background(), `ALTER TABLE orders ADD COLUMN tracking VARCHAR(100)`)
		return err
	}
	return nil
}

// CreateAddress inserta una nueva dirección para un usuario
func CreateAddress(ctx context.Context, address *models.Address) error {
	query := `INSERT INTO addresses (user_id, type, first_name, last_name, company, address1, address2, city, state, postal_code, country, phone, is_default, lat, lng, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW()) RETURNING id, created_at, updated_at`
	return Pool.QueryRow(ctx, query,
		address.UserID,
		address.Type,
		address.FirstName,
		address.LastName,
		address.Company,
		address.Address1,
		address.Address2,
		address.City,
		address.State,
		address.PostalCode,
		address.Country,
		address.Phone,
		address.IsDefault,
		address.Lat,
		address.Lng,
	).Scan(&address.ID, &address.CreatedAt, &address.UpdatedAt)
}

// ===== NOTIFICACIONES =====

// CreateNotification crea una nueva notificación
func CreateNotification(db *pgxpool.Pool, notification *models.Notification) error {
	query := `
		INSERT INTO notifications (user_id, type, title, message, data, is_read, is_admin, priority, created_at, expires_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING id, created_at`

	return db.QueryRow(context.Background(), query,
		notification.UserID,
		notification.Type,
		notification.Title,
		notification.Message,
		notification.Data,
		notification.IsRead,
		notification.IsAdmin,
		notification.Priority,
		time.Now(),
		notification.ExpiresAt,
	).Scan(&notification.ID, &notification.CreatedAt)
}

// GetNotificationsByUser obtiene las notificaciones de un usuario
func GetNotificationsByUser(db *pgxpool.Pool, userID int, limit, offset int) ([]models.Notification, error) {
	query := `
		SELECT id, user_id, type, title, message, data, is_read, is_admin, priority, created_at, expires_at, read_at
		FROM notifications 
		WHERE user_id = $1 
		ORDER BY created_at DESC 
		LIMIT $2 OFFSET $3`

	rows, err := db.Query(context.Background(), query, userID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var notifications []models.Notification
	for rows.Next() {
		var n models.Notification
		err := rows.Scan(
			&n.ID, &n.UserID, &n.Type, &n.Title, &n.Message, &n.Data,
			&n.IsRead, &n.IsAdmin, &n.Priority, &n.CreatedAt, &n.ExpiresAt, &n.ReadAt,
		)
		if err != nil {
			return nil, err
		}
		notifications = append(notifications, n)
	}

	return notifications, nil
}

// GetAdminNotifications obtiene las notificaciones de administrador
func GetAdminNotifications(db *pgxpool.Pool, limit, offset int) ([]models.Notification, error) {
	query := `
		SELECT id, user_id, type, title, message, data, is_read, is_admin, priority, created_at, expires_at, read_at
		FROM notifications 
		WHERE is_admin = true 
		ORDER BY created_at DESC 
		LIMIT $1 OFFSET $2`

	rows, err := db.Query(context.Background(), query, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var notifications []models.Notification
	for rows.Next() {
		var n models.Notification
		err := rows.Scan(
			&n.ID, &n.UserID, &n.Type, &n.Title, &n.Message, &n.Data,
			&n.IsRead, &n.IsAdmin, &n.Priority, &n.CreatedAt, &n.ExpiresAt, &n.ReadAt,
		)
		if err != nil {
			return nil, err
		}
		notifications = append(notifications, n)
	}

	return notifications, nil
}

// MarkNotificationAsRead marca una notificación como leída
func MarkNotificationAsRead(db *pgxpool.Pool, notificationID int) error {
	query := `
		UPDATE notifications 
		SET is_read = true, read_at = $1 
		WHERE id = $2`

	_, err := db.Exec(context.Background(), query, time.Now(), notificationID)
	return err
}

// MarkAllNotificationsAsRead marca todas las notificaciones de un usuario como leídas
func MarkAllNotificationsAsRead(db *pgxpool.Pool, userID int) error {
	query := `
		UPDATE notifications 
		SET is_read = true, read_at = $1 
		WHERE user_id = $2 AND is_read = false`

	_, err := db.Exec(context.Background(), query, time.Now(), userID)
	return err
}

// GetUnreadNotificationCount obtiene el número de notificaciones no leídas
func GetUnreadNotificationCount(db *pgxpool.Pool, userID int) (int, error) {
	query := `
		SELECT COUNT(*) 
		FROM notifications 
		WHERE user_id = $1 AND is_read = false`

	var count int
	err := db.QueryRow(context.Background(), query, userID).Scan(&count)
	return count, err
}

// GetAdminUnreadNotificationCount obtiene el número de notificaciones admin no leídas
func GetAdminUnreadNotificationCount(db *pgxpool.Pool) (int, error) {
	query := `
		SELECT COUNT(*) 
		FROM notifications 
		WHERE is_admin = true AND is_read = false`

	var count int
	err := db.QueryRow(context.Background(), query).Scan(&count)
	return count, err
}

// DeleteNotification elimina una notificación
func DeleteNotification(db *pgxpool.Pool, notificationID int) error {
	query := `DELETE FROM notifications WHERE id = $1`
	_, err := db.Exec(context.Background(), query, notificationID)
	return err
}

// ===== PREFERENCIAS DE NOTIFICACIÓN =====

// GetNotificationPreferences obtiene las preferencias de notificación de un usuario
func GetNotificationPreferences(db *pgxpool.Pool, userID int) ([]models.NotificationPreference, error) {
	query := `
		SELECT user_id, type, email_enabled, push_enabled, in_app_enabled, created_at, updated_at
		FROM notification_preferences 
		WHERE user_id = $1`

	rows, err := db.Query(context.Background(), query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var preferences []models.NotificationPreference
	for rows.Next() {
		var p models.NotificationPreference
		err := rows.Scan(
			&p.UserID, &p.Type, &p.EmailEnabled, &p.PushEnabled, &p.InAppEnabled,
			&p.CreatedAt, &p.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		preferences = append(preferences, p)
	}

	return preferences, nil
}

// UpdateNotificationPreference actualiza una preferencia de notificación
func UpdateNotificationPreference(db *pgxpool.Pool, userID int, notificationType string, emailEnabled, pushEnabled, inAppEnabled bool) error {
	query := `
		INSERT INTO notification_preferences (user_id, type, email_enabled, push_enabled, in_app_enabled, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $6)
		ON CONFLICT (user_id, type) 
		DO UPDATE SET 
			email_enabled = $3, 
			push_enabled = $4, 
			in_app_enabled = $5, 
			updated_at = $6`

	_, err := db.Exec(context.Background(), query, userID, notificationType, emailEnabled, pushEnabled, inAppEnabled, time.Now())
	return err
}

// GetAdminUsers obtiene todos los usuarios administradores
func GetAdminUsers(db *pgxpool.Pool) ([]models.User, error) {
	query := `
		SELECT id, email, nombre, apellido, is_admin, created_at, updated_at
		FROM users 
		WHERE is_admin = true`

	rows, err := db.Query(context.Background(), query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var user models.User
		err := rows.Scan(
			&user.ID, &user.Email, &user.Nombre, &user.Apellido,
			&user.IsAdmin, &user.CreatedAt, &user.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		users = append(users, user)
	}

	return users, nil
}
