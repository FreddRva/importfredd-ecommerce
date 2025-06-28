package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"Ecommerce/backend/internal/db"

	"github.com/gorilla/mux"
	"github.com/jackc/pgx/v5/pgxpool"
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
func (nh *NotificationHandlers) GetNotifications(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(int)

	// Parámetros de paginación
	limit := 20 // default
	offset := 0

	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 100 {
			limit = l
		}
	}

	if offsetStr := r.URL.Query().Get("offset"); offsetStr != "" {
		if o, err := strconv.Atoi(offsetStr); err == nil && o >= 0 {
			offset = o
		}
	}

	notifications, err := db.GetNotificationsByUser(nh.db, userID, limit, offset)
	if err != nil {
		http.Error(w, "Error obteniendo notificaciones", http.StatusInternalServerError)
		return
	}

	response := map[string]interface{}{
		"notifications": notifications,
		"pagination": map[string]interface{}{
			"limit":  limit,
			"offset": offset,
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// GetAdminNotifications obtiene las notificaciones de administrador
func (nh *NotificationHandlers) GetAdminNotifications(w http.ResponseWriter, r *http.Request) {
	// Verificar que el usuario es admin
	userID := r.Context().Value("user_id").(int)
	user, err := db.GetUserByID(nh.db, userID)
	if err != nil || !user.IsAdmin {
		http.Error(w, "Acceso denegado", http.StatusForbidden)
		return
	}

	// Parámetros de paginación
	limit := 20
	offset := 0

	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 100 {
			limit = l
		}
	}

	if offsetStr := r.URL.Query().Get("offset"); offsetStr != "" {
		if o, err := strconv.Atoi(offsetStr); err == nil && o >= 0 {
			offset = o
		}
	}

	notifications, err := db.GetAdminNotifications(nh.db, limit, offset)
	if err != nil {
		http.Error(w, "Error obteniendo notificaciones admin", http.StatusInternalServerError)
		return
	}

	response := map[string]interface{}{
		"notifications": notifications,
		"pagination": map[string]interface{}{
			"limit":  limit,
			"offset": offset,
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// MarkNotificationAsRead marca una notificación como leída
func (nh *NotificationHandlers) MarkNotificationAsRead(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(int)
	vars := mux.Vars(r)

	notificationID, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "ID de notificación inválido", http.StatusBadRequest)
		return
	}

	// Verificar que la notificación pertenece al usuario
	notifications, err := db.GetNotificationsByUser(nh.db, userID, 1000, 0)
	if err != nil {
		http.Error(w, "Error verificando notificación", http.StatusInternalServerError)
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
		http.Error(w, "Notificación no encontrada", http.StatusNotFound)
		return
	}

	if err := db.MarkNotificationAsRead(nh.db, notificationID); err != nil {
		http.Error(w, "Error marcando notificación como leída", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Notificación marcada como leída"})
}

// MarkAllNotificationsAsRead marca todas las notificaciones del usuario como leídas
func (nh *NotificationHandlers) MarkAllNotificationsAsRead(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(int)

	if err := db.MarkAllNotificationsAsRead(nh.db, userID); err != nil {
		http.Error(w, "Error marcando notificaciones como leídas", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Todas las notificaciones marcadas como leídas"})
}

// GetUnreadCount obtiene el número de notificaciones no leídas
func (nh *NotificationHandlers) GetUnreadCount(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(int)

	count, err := db.GetUnreadNotificationCount(nh.db, userID)
	if err != nil {
		http.Error(w, "Error obteniendo conteo de notificaciones", http.StatusInternalServerError)
		return
	}

	response := map[string]interface{}{
		"unread_count": count,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// GetAdminUnreadCount obtiene el número de notificaciones admin no leídas
func (nh *NotificationHandlers) GetAdminUnreadCount(w http.ResponseWriter, r *http.Request) {
	// Verificar que el usuario es admin
	userID := r.Context().Value("user_id").(int)
	user, err := db.GetUserByID(nh.db, userID)
	if err != nil || !user.IsAdmin {
		http.Error(w, "Acceso denegado", http.StatusForbidden)
		return
	}

	count, err := db.GetAdminUnreadNotificationCount(nh.db)
	if err != nil {
		http.Error(w, "Error obteniendo conteo de notificaciones admin", http.StatusInternalServerError)
		return
	}

	response := map[string]interface{}{
		"unread_count": count,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// DeleteNotification elimina una notificación
func (nh *NotificationHandlers) DeleteNotification(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(int)
	vars := mux.Vars(r)

	notificationID, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "ID de notificación inválido", http.StatusBadRequest)
		return
	}

	// Verificar que la notificación pertenece al usuario
	notifications, err := db.GetNotificationsByUser(nh.db, userID, 1000, 0)
	if err != nil {
		http.Error(w, "Error verificando notificación", http.StatusInternalServerError)
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
		http.Error(w, "Notificación no encontrada", http.StatusNotFound)
		return
	}

	if err := db.DeleteNotification(nh.db, notificationID); err != nil {
		http.Error(w, "Error eliminando notificación", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Notificación eliminada"})
}

// GetNotificationPreferences obtiene las preferencias de notificación del usuario
func (nh *NotificationHandlers) GetNotificationPreferences(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(int)

	preferences, err := db.GetNotificationPreferences(nh.db, userID)
	if err != nil {
		http.Error(w, "Error obteniendo preferencias", http.StatusInternalServerError)
		return
	}

	response := map[string]interface{}{
		"preferences": preferences,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// UpdateNotificationPreferences actualiza las preferencias de notificación del usuario
func (nh *NotificationHandlers) UpdateNotificationPreferences(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(int)

	var request struct {
		Type         string `json:"type"`
		EmailEnabled bool   `json:"email_enabled"`
		PushEnabled  bool   `json:"push_enabled"`
		InAppEnabled bool   `json:"in_app_enabled"`
	}

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, "Datos inválidos", http.StatusBadRequest)
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
		http.Error(w, "Tipo de notificación inválido", http.StatusBadRequest)
		return
	}

	if err := db.UpdateNotificationPreference(nh.db, userID, request.Type, request.EmailEnabled, request.PushEnabled, request.InAppEnabled); err != nil {
		http.Error(w, "Error actualizando preferencias", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Preferencias actualizadas"})
}
