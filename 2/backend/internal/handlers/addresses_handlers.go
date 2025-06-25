package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/tuusuario/ecommerce-backend/internal/db"
	"github.com/tuusuario/ecommerce-backend/internal/models"

	"github.com/go-chi/render"
)

// AddressRequest representa el body esperado para crear una dirección
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

// POST /api/addresses
func CreateAddress(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("userID").(int)
	if !ok || userID == 0 {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req AddressRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	// Validación básica de campos requeridos
	if req.FirstName == "" || len(req.FirstName) > 100 {
		http.Error(w, "Nombre inválido", http.StatusBadRequest)
		return
	}
	if req.LastName == "" || len(req.LastName) > 100 {
		http.Error(w, "Apellidos inválidos", http.StatusBadRequest)
		return
	}
	if req.Address1 == "" || len(req.Address1) > 255 {
		http.Error(w, "Dirección inválida", http.StatusBadRequest)
		return
	}
	if req.City == "" || len(req.City) > 100 {
		http.Error(w, "Ciudad inválida", http.StatusBadRequest)
		return
	}
	if req.State == "" || len(req.State) > 100 {
		http.Error(w, "Estado inválido", http.StatusBadRequest)
		return
	}
	if req.PostalCode == "" || len(req.PostalCode) > 20 {
		http.Error(w, "Código postal inválido", http.StatusBadRequest)
		return
	}
	if req.Country == "" || len(req.Country) > 100 {
		http.Error(w, "País inválido", http.StatusBadRequest)
		return
	}
	if req.Phone == "" || len(req.Phone) > 30 {
		http.Error(w, "Teléfono inválido", http.StatusBadRequest)
		return
	}
	// Validar lat/lng si se usan
	if req.Lat < -90 || req.Lat > 90 || req.Lng < -180 || req.Lng > 180 {
		http.Error(w, "Coordenadas inválidas", http.StatusBadRequest)
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

	if err := db.CreateAddress(r.Context(), &address); err != nil {
		http.Error(w, "Error saving address", http.StatusInternalServerError)
		return
	}

	render.JSON(w, r, address)
}
