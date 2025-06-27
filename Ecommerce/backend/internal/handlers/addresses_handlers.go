package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/tuusuario/ecommerce-backend/internal/db"
	"github.com/tuusuario/ecommerce-backend/internal/models"
)

// AddressHandler maneja todas las operaciones relacionadas con direcciones
type AddressHandler struct {
	DB *pgxpool.Pool
}

// NewAddressHandler crea una nueva instancia del handler de direcciones
func NewAddressHandler(db *pgxpool.Pool) *AddressHandler {
	return &AddressHandler{DB: db}
}

// AddressRequest representa el body esperado para crear/actualizar una dirección
// Puedes ajustar los campos según tu frontend
// Incluye lat/lng si lo necesitas

type AddressRequest struct {
	Type       string  `json:"type"`
	FirstName  string  `json:"first_name"`
	LastName   string  `json:"last_name"`
	Company    string  `json:"company,omitempty"`
	Address1   string  `json:"address1"`
	Address2   string  `json:"address2,omitempty"`
	City       string  `json:"city"`
	State      string  `json:"state"`
	PostalCode string  `json:"postal_code"`
	Country    string  `json:"country"`
	Phone      string  `json:"phone"`
	IsDefault  bool    `json:"is_default"`
	Lat        float64 `json:"lat,omitempty"`
	Lng        float64 `json:"lng,omitempty"`
}

// GetUserAddresses obtiene todas las direcciones del usuario
func (h *AddressHandler) GetUserAddresses(c *gin.Context) {
	userID := c.GetInt("user_id")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuario no autenticado"})
		return
	}

	addresses, err := db.GetUserAddresses(h.DB, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error obteniendo direcciones: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"addresses": addresses,
	})
}

// GetAddressByID obtiene una dirección específica
func (h *AddressHandler) GetAddressByID(c *gin.Context) {
	userID := c.GetInt("user_id")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuario no autenticado"})
		return
	}

	addressID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de dirección inválido"})
		return
	}

	address, err := db.GetAddressByID(h.DB, addressID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Dirección no encontrada"})
		return
	}

	// Verificar que la dirección pertenece al usuario
	if address.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "No tienes permisos para ver esta dirección"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"address": address,
	})
}

// CreateAddress crea una nueva dirección
func (h *AddressHandler) CreateAddress(c *gin.Context) {
	userID := c.GetInt("user_id")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuario no autenticado"})
		return
	}

	var req AddressRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos: " + err.Error()})
		return
	}

	// Validación básica de campos requeridos
	if req.FirstName == "" || len(req.FirstName) > 100 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Nombre inválido"})
		return
	}
	if req.LastName == "" || len(req.LastName) > 100 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Apellidos inválidos"})
		return
	}
	if req.Address1 == "" || len(req.Address1) > 255 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dirección inválida"})
		return
	}
	if req.City == "" || len(req.City) > 100 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ciudad inválida"})
		return
	}
	if req.State == "" || len(req.State) > 100 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Estado inválido"})
		return
	}
	if req.PostalCode == "" || len(req.PostalCode) > 20 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Código postal inválido"})
		return
	}
	if req.Country == "" || len(req.Country) > 100 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "País inválido"})
		return
	}
	if req.Phone == "" || len(req.Phone) > 30 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Teléfono inválido"})
		return
	}

	// Validar lat/lng si se usan
	if req.Lat < -90 || req.Lat > 90 || req.Lng < -180 || req.Lng > 180 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Coordenadas inválidas"})
		return
	}

	address := models.Address{
		UserID:     userID,
		Type:       req.Type,
		FirstName:  req.FirstName,
		LastName:   req.LastName,
		Company:    req.Company,
		Address1:   req.Address1,
		Address2:   req.Address2,
		City:       req.City,
		State:      req.State,
		PostalCode: req.PostalCode,
		Country:    req.Country,
		Phone:      req.Phone,
		IsDefault:  req.IsDefault,
		Lat:        req.Lat,
		Lng:        req.Lng,
	}

	if err := db.CreateAddress(c.Request.Context(), &address); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error guardando dirección: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"address": address,
		"message": "Dirección creada exitosamente",
	})
}

// UpdateAddress actualiza una dirección existente
func (h *AddressHandler) UpdateAddress(c *gin.Context) {
	userID := c.GetInt("user_id")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuario no autenticado"})
		return
	}

	addressID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de dirección inválido"})
		return
	}

	// Verificar que la dirección existe y pertenece al usuario
	existingAddress, err := db.GetAddressByID(h.DB, addressID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Dirección no encontrada"})
		return
	}

	if existingAddress.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "No tienes permisos para editar esta dirección"})
		return
	}

	var req AddressRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos: " + err.Error()})
		return
	}

	// Validaciones similares a CreateAddress
	if req.FirstName == "" || len(req.FirstName) > 100 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Nombre inválido"})
		return
	}
	if req.LastName == "" || len(req.LastName) > 100 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Apellidos inválidos"})
		return
	}
	if req.Address1 == "" || len(req.Address1) > 255 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dirección inválida"})
		return
	}
	if req.City == "" || len(req.City) > 100 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ciudad inválida"})
		return
	}
	if req.State == "" || len(req.State) > 100 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Estado inválido"})
		return
	}
	if req.PostalCode == "" || len(req.PostalCode) > 20 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Código postal inválido"})
		return
	}
	if req.Country == "" || len(req.Country) > 100 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "País inválido"})
		return
	}
	if req.Phone == "" || len(req.Phone) > 30 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Teléfono inválido"})
		return
	}

	// Actualizar campos
	existingAddress.Type = req.Type
	existingAddress.FirstName = req.FirstName
	existingAddress.LastName = req.LastName
	existingAddress.Company = req.Company
	existingAddress.Address1 = req.Address1
	existingAddress.Address2 = req.Address2
	existingAddress.City = req.City
	existingAddress.State = req.State
	existingAddress.PostalCode = req.PostalCode
	existingAddress.Country = req.Country
	existingAddress.Phone = req.Phone
	existingAddress.IsDefault = req.IsDefault
	existingAddress.Lat = req.Lat
	existingAddress.Lng = req.Lng

	if err := db.UpdateAddress(h.DB, existingAddress); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error actualizando dirección: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"address": existingAddress,
		"message": "Dirección actualizada exitosamente",
	})
}

// DeleteAddress elimina una dirección
func (h *AddressHandler) DeleteAddress(c *gin.Context) {
	userID := c.GetInt("user_id")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuario no autenticado"})
		return
	}

	addressID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de dirección inválido"})
		return
	}

	// Verificar que la dirección existe y pertenece al usuario
	existingAddress, err := db.GetAddressByID(h.DB, addressID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Dirección no encontrada"})
		return
	}

	if existingAddress.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "No tienes permisos para eliminar esta dirección"})
		return
	}

	if err := db.DeleteAddress(h.DB, addressID, userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error eliminando dirección: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Dirección eliminada exitosamente",
	})
}

// SetDefaultAddress establece una dirección como predeterminada
func (h *AddressHandler) SetDefaultAddress(c *gin.Context) {
	userID := c.GetInt("user_id")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuario no autenticado"})
		return
	}

	addressID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de dirección inválido"})
		return
	}

	// Verificar que la dirección existe y pertenece al usuario
	existingAddress, err := db.GetAddressByID(h.DB, addressID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Dirección no encontrada"})
		return
	}

	if existingAddress.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "No tienes permisos para modificar esta dirección"})
		return
	}

	if err := db.SetDefaultAddress(h.DB, addressID, userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error estableciendo dirección predeterminada: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Dirección establecida como predeterminada",
	})
}
