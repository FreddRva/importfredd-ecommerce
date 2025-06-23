package db

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/tuusuario/ecommerce-backend/internal/models"
)

// ===== PRODUCTOS =====

// CreateProduct crea un nuevo producto
func CreateProduct(db *pgxpool.Pool, product *models.Product) (*models.Product, error) {
	query := `
		INSERT INTO products (name, description, price, image_url, category_id, stock, sku, weight, dimensions, is_active, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
		RETURNING id, name, description, price, image_url, category_id, stock, sku, weight, dimensions, is_active, created_at, updated_at
	`

	err := db.QueryRow(context.Background(), query,
		product.Name, product.Description, product.Price, product.ImageURL,
		product.CategoryID, product.Stock, product.SKU, product.Weight,
		product.Dimensions, product.IsActive, product.CreatedAt, product.UpdatedAt,
	).Scan(
		&product.ID, &product.Name, &product.Description, &product.Price,
		&product.ImageURL, &product.CategoryID, &product.Stock, &product.SKU,
		&product.Weight, &product.Dimensions, &product.IsActive,
		&product.CreatedAt, &product.UpdatedAt,
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
			dimensions = $9, is_active = $10, updated_at = $11
		WHERE id = $12
		RETURNING id, name, description, price, image_url, category_id, stock, sku, weight, dimensions, is_active, created_at, updated_at
	`

	err := db.QueryRow(context.Background(), query,
		product.Name, product.Description, product.Price, product.ImageURL,
		product.CategoryID, product.Stock, product.SKU, product.Weight,
		product.Dimensions, product.IsActive, product.UpdatedAt, product.ID,
	).Scan(
		&product.ID, &product.Name, &product.Description, &product.Price,
		&product.ImageURL, &product.CategoryID, &product.Stock, &product.SKU,
		&product.Weight, &product.Dimensions, &product.IsActive,
		&product.CreatedAt, &product.UpdatedAt,
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
			   c.name as category_name
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
			&product.CreatedAt, &product.UpdatedAt, &product.CategoryName,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("error escaneando producto: %v", err)
		}

		products = append(products, product)
	}

	return products, total, nil
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

// GetAllCategories obtiene todas las categorías activas
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
	err = db.QueryRow(context.Background(), "SELECT COALESCE(SUM(total), 0) FROM orders WHERE status = 'completed'").Scan(&stats.TotalRevenue)
	if err != nil {
		return nil, fmt.Errorf("error en TotalRevenue: %w", err)
	}

	// Pending Orders
	err = db.QueryRow(context.Background(), "SELECT COUNT(*) FROM orders WHERE status = 'pending'").Scan(&stats.PendingOrders)
	if err != nil {
		return nil, fmt.Errorf("error en PendingOrders: %w", err)
	}

	// Completed Orders
	err = db.QueryRow(context.Background(), "SELECT COUNT(*) FROM orders WHERE status = 'completed'").Scan(&stats.CompletedOrders)
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
		SELECT id, email, COALESCE(nombre, ''), COALESCE(apellido, ''), is_admin, is_active, created_at
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
			&user.ID, &user.Email, &user.Nombre, &user.Apellido,
			&user.IsAdmin, &user.IsActive, &user.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("error escaneando usuario: %w", err)
		}
		users = append(users, user)
	}

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

// DeleteUser "elimina" un usuario (soft delete).
func DeleteUser(db *pgxpool.Pool, userID int) error {
	query := `
		UPDATE users
		SET is_active = false, updated_at = NOW()
		WHERE id = $1
	`
	cmd, err := db.Exec(context.Background(), query, userID)
	if err != nil {
		return fmt.Errorf("error eliminando usuario: %w", err)
	}
	if cmd.RowsAffected() == 0 {
		return fmt.Errorf("usuario no encontrado para eliminar")
	}
	return nil
}
