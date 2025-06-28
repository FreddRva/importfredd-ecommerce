package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/tuusuario/ecommerce-backend/internal/db"
)

// NotificationHandlers maneja las rutas de notificaciones
type NotificationHandlers struct {
	db *pgxpool.Pool
}

// NewNotificationHandlers crea una nueva instancia de NotificationHandlers
func NewNotificationHandlers(db *pgxpool.Pool) *NotificationHandlers {
	return &NotificationHandlers{db: db}
}

// GetNotifications obtiene las notificaciones del usuario
func (nh *NotificationHandlers) GetNotifications(c *gin.Context) {
	userID := c.GetInt("user_id")

	// Parámetros de paginación
	limit := 20 // default
	offset := 0

	if limitStr := c.Query("limit"); limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 100 {
			limit = l
		}
	}

	if offsetStr := c.Query("offset"); offsetStr != "" {
		if o, err := strconv.Atoi(offsetStr); err == nil && o >= 0 {
			offset = o
		}
	}

	notifications, err := db.GetNotificationsByUser(nh.db, userID, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error obteniendo notificaciones"})
		return
	}

	response := map[string]interface{}{
		"notifications": notifications,
		"pagination": map[string]interface{}{
			"limit":  limit,
			"offset": offset,
		},
	}

	c.JSON(http.StatusOK, response)
}

// GetAdminNotifications obtiene las notificaciones de administrador
func (nh *NotificationHandlers) GetAdminNotifications(c *gin.Context) {
	// Verificar que el usuario es admin
	userID := c.GetInt("user_id")
	user, err := db.GetUserByID(nh.db, userID)
	if err != nil || !user.IsAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "Acceso denegado"})
		return
	}

	// Parámetros de paginación
	limit := 20
	offset := 0

	if limitStr := c.Query("limit"); limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 100 {
			limit = l
		}
	}

	if offsetStr := c.Query("offset"); offsetStr != "" {
		if o, err := strconv.Atoi(offsetStr); err == nil && o >= 0 {
			offset = o
		}
	}

	notifications, err := db.GetAdminNotifications(nh.db, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error obteniendo notificaciones admin"})
		return
	}

	response := map[string]interface{}{
		"notifications": notifications,
		"pagination": map[string]interface{}{
			"limit":  limit,
			"offset": offset,
		},
	}

	c.JSON(http.StatusOK, response)
}

// MarkNotificationAsRead marca una notificación como leída
func (nh *NotificationHandlers) MarkNotificationAsRead(c *gin.Context) {
	userID := c.GetInt("user_id")
	notificationID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de notificación inválido"})
		return
	}

	// Verificar que la notificación pertenece al usuario
	notifications, err := db.GetNotificationsByUser(nh.db, userID, 1000, 0)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error verificando notificación"})
		return
	}

	found := false
	for _, n := range notifications {
		if n.ID == notificationID {
			found = true
			break
		}
	}

	if !found {
		c.JSON(http.StatusNotFound, gin.H{"error": "Notificación no encontrada"})
		return
	}

	if err := db.MarkNotificationAsRead(nh.db, notificationID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error marcando notificación como leída"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Notificación marcada como leída"})
}

// MarkAllNotificationsAsRead marca todas las notificaciones del usuario como leídas
func (nh *NotificationHandlers) MarkAllNotificationsAsRead(c *gin.Context) {
	userID := c.GetInt("user_id")

	if err := db.MarkAllNotificationsAsRead(nh.db, userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error marcando notificaciones como leídas"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Todas las notificaciones marcadas como leídas"})
}

// GetUnreadCount obtiene el número de notificaciones no leídas
func (nh *NotificationHandlers) GetUnreadCount(c *gin.Context) {
	userID := c.GetInt("user_id")

	count, err := db.GetUnreadNotificationCount(nh.db, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error obteniendo conteo de notificaciones"})
		return
	}

	response := map[string]interface{}{
		"unread_count": count,
	}

	c.JSON(http.StatusOK, response)
}

// GetAdminUnreadCount obtiene el número de notificaciones admin no leídas
func (nh *NotificationHandlers) GetAdminUnreadCount(c *gin.Context) {
	// Verificar que el usuario es admin
	userID := c.GetInt("user_id")
	user, err := db.GetUserByID(nh.db, userID)
	if err != nil || !user.IsAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "Acceso denegado"})
		return
	}

	count, err := db.GetAdminUnreadNotificationCount(nh.db)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error obteniendo conteo de notificaciones admin"})
		return
	}

	response := map[string]interface{}{
		"unread_count": count,
	}

	c.JSON(http.StatusOK, response)
}

// DeleteNotification elimina una notificación
func (nh *NotificationHandlers) DeleteNotification(c *gin.Context) {
	userID := c.GetInt("user_id")
	notificationID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de notificación inválido"})
		return
	}

	// Verificar que la notificación pertenece al usuario
	notifications, err := db.GetNotificationsByUser(nh.db, userID, 1000, 0)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error verificando notificación"})
		return
	}

	found := false
	for _, n := range notifications {
		if n.ID == notificationID {
			found = true
			break
		}
	}

	if !found {
		c.JSON(http.StatusNotFound, gin.H{"error": "Notificación no encontrada"})
		return
	}

	if err := db.DeleteNotification(nh.db, notificationID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error eliminando notificación"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Notificación eliminada"})
}

// GetNotificationPreferences obtiene las preferencias de notificación del usuario
func (nh *NotificationHandlers) GetNotificationPreferences(c *gin.Context) {
	userID := c.GetInt("user_id")

	preferences, err := db.GetNotificationPreferences(nh.db, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error obteniendo preferencias"})
		return
	}

	response := map[string]interface{}{
		"preferences": preferences,
	}

	c.JSON(http.StatusOK, response)
}

// UpdateNotificationPreferences actualiza las preferencias de notificación del usuario
func (nh *NotificationHandlers) UpdateNotificationPreferences(c *gin.Context) {
	userID := c.GetInt("user_id")

	var request struct {
		Type         string `json:"type"`
		EmailEnabled bool   `json:"email_enabled"`
		PushEnabled  bool   `json:"push_enabled"`
		InAppEnabled bool   `json:"in_app_enabled"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos"})
		return
	}

	// Validar tipo de notificación
	validTypes := map[string]bool{
		"order":     true,
		"payment":   true,
		"marketing": true,
		"security":  true,
	}

	if !validTypes[request.Type] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Tipo de notificación inválido"})
		return
	}

	if err := db.UpdateNotificationPreference(nh.db, userID, request.Type, request.EmailEnabled, request.PushEnabled, request.InAppEnabled); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error actualizando preferencias"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Preferencias actualizadas"})
}
