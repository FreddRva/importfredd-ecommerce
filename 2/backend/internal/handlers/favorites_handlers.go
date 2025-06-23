package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

type FavoritesHandler struct {
	DB *pgxpool.Pool
}

func NewFavoritesHandler(db *pgxpool.Pool) *FavoritesHandler {
	return &FavoritesHandler{DB: db}
}

// Añadir producto a favoritos
func (h *FavoritesHandler) AddFavorite(c *gin.Context) {
	userID := c.GetInt("user_id")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuario no autenticado"})
		return
	}
	var req struct {
		ProductID int `json:"product_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	_, err := h.DB.Exec(context.Background(), "INSERT INTO favorites (user_id, product_id, created_at) VALUES ($1, $2, $3) ON CONFLICT (user_id, product_id) DO NOTHING", userID, req.ProductID, time.Now())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al añadir a favoritos"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Producto añadido a favoritos"})
}

// Quitar producto de favoritos
func (h *FavoritesHandler) RemoveFavorite(c *gin.Context) {
	userID := c.GetInt("user_id")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuario no autenticado"})
		return
	}
	productID := c.Param("product_id")
	_, err := h.DB.Exec(context.Background(), "DELETE FROM favorites WHERE user_id = $1 AND product_id = $2", userID, productID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al quitar de favoritos"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Producto quitado de favoritos"})
}

// Listar favoritos del usuario
func (h *FavoritesHandler) ListFavorites(c *gin.Context) {
	userID := c.GetInt("user_id")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuario no autenticado"})
		return
	}
	rows, err := h.DB.Query(context.Background(), `SELECT product_id FROM favorites WHERE user_id = $1`, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener favoritos"})
		return
	}
	defer rows.Close()
	var productIDs []int
	for rows.Next() {
		var pid int
		if err := rows.Scan(&pid); err == nil {
			productIDs = append(productIDs, pid)
		}
	}
	c.JSON(http.StatusOK, gin.H{"favorites": productIDs})
}
