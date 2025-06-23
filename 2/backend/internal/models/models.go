package models

import (
	"time"

	"github.com/go-webauthn/webauthn/webauthn"
)

// User representa un usuario del sistema
type User struct {
	ID                         int                    `json:"id"`
	Email                      string                 `json:"email"`
	Nombre                     *string                `json:"nombre,omitempty"`
	Apellido                   *string                `json:"apellido,omitempty"`
	Telefono                   *string                `json:"telefono,omitempty"`
	Avatar                     *string                `json:"avatar,omitempty"`
	Preferencias               map[string]interface{} `json:"preferencias,omitempty"`
	PasswordHash               *string                `json:"-"`
	IsAdmin                    bool                   `json:"is_admin"`
	IsVerified                 bool                   `json:"is_verified"`
	VerificationToken          *string                `json:"-"`
	VerificationTokenExpiresAt *time.Time             `json:"-"`
	IsActive                   bool                   `json:"is_active"`
	CreatedAt                  time.Time              `json:"created_at"`
	UpdatedAt                  time.Time              `json:"updated_at"`
	Credentials                []webauthn.Credential  `json:"-"` // No incluir en JSON
}

// Métodos requeridos por la interfaz webauthn.User
func (u *User) WebAuthnID() []byte {
	return []byte(string(rune(u.ID)))
}

func (u *User) WebAuthnName() string {
	return u.Email
}

func (u *User) WebAuthnDisplayName() string {
	return u.Email
}

func (u *User) WebAuthnIcon() string {
	return "" // Puedes personalizar esto si lo deseas
}

func (u *User) WebAuthnCredentials() []webauthn.Credential {
	return u.Credentials
}

func (u *User) AddCredential(cred webauthn.Credential) {
	u.Credentials = append(u.Credentials, cred)
}

// Credential representa una credencial WebAuthn
type Credential struct {
	ID           int       `json:"id"`
	UserID       int       `json:"user_id"`
	CredentialID []byte    `json:"credential_id"`
	PublicKey    []byte    `json:"public_key"`
	SignCount    uint32    `json:"sign_count"`
	Transports   []string  `json:"transports"`
	AAGUID       []byte    `json:"aaguid"`
	CreatedAt    time.Time `json:"created_at"`
}

// Convertir a webauthn.Credential
func (c *Credential) ToWebauthn() webauthn.Credential {
	return webauthn.Credential{
		ID:        c.CredentialID,
		PublicKey: c.PublicKey,
		Authenticator: webauthn.Authenticator{
			AAGUID:    c.AAGUID,
			SignCount: c.SignCount,
		},
	}
}

// RefreshToken representa un token de renovación
type RefreshToken struct {
	ID         int       `json:"id"`
	UserID     int       `json:"user_id"`
	Token      string    `json:"token"`
	ExpiresAt  time.Time `json:"expires_at"`
	DeviceInfo string    `json:"device_info"`
	IPAddress  string    `json:"ip_address"`
	CreatedAt  time.Time `json:"created_at"`
}

// UserSession representa una sesión de usuario
type UserSession struct {
	ID           int       `json:"id"`
	UserID       int       `json:"user_id"`
	SessionToken string    `json:"session_token"`
	DeviceInfo   string    `json:"device_info"`
	IPAddress    string    `json:"ip_address"`
	UserAgent    string    `json:"user_agent"`
	IsActive     bool      `json:"is_active"`
	CreatedAt    time.Time `json:"created_at"`
	LastActivity time.Time `json:"last_activity"`
}

// Product representa un producto
type Product struct {
	ID           int       `json:"id"`
	Name         string    `json:"name"`
	Description  *string   `json:"description,omitempty"`
	Price        float64   `json:"price"`
	ImageURL     *string   `json:"image_url,omitempty"`
	CategoryID   *int      `json:"category_id,omitempty"`
	CategoryName *string   `json:"category_name,omitempty"`
	Stock        int       `json:"stock"`
	SKU          *string   `json:"sku,omitempty"`
	Weight       *float64  `json:"weight,omitempty"`
	Dimensions   *string   `json:"dimensions,omitempty"`
	IsActive     bool      `json:"is_active"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// Category representa una categoría de productos
type Category struct {
	ID          int       `json:"id"`
	Name        string    `json:"name"`
	Description *string   `json:"description,omitempty"`
	ImageURL    *string   `json:"image_url,omitempty"`
	ParentID    *int      `json:"parent_id,omitempty"`
	IsActive    bool      `json:"is_active"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// CartItem representa un item en el carrito
type CartItem struct {
	ID        int       `json:"id"`
	UserID    int       `json:"user_id"`
	ProductID int       `json:"product_id"`
	Quantity  int       `json:"quantity"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	Product   *Product  `json:"product,omitempty"` // Para incluir datos del producto
}

// Address representa una dirección
type Address struct {
	ID         int    `json:"id"`
	UserID     int    `json:"user_id"`
	Type       string `json:"type"` // shipping, billing
	FirstName  string `json:"first_name"`
	LastName   string `json:"last_name"`
	Company    string `json:"company,omitempty"`
	Address1   string `json:"address1"`
	Address2   string `json:"address2,omitempty"`
	City       string `json:"city"`
	State      string `json:"state"`
	PostalCode string `json:"postal_code"`
	Country    string `json:"country"`
	Phone      string `json:"phone"`
	IsDefault  bool   `json:"is_default"`
}

// Order representa un pedido
type Order struct {
	ID              int         `json:"id"`
	UserID          int         `json:"user_id"`
	OrderNumber     string      `json:"order_number"`
	Status          string      `json:"status"` // pending, paid, shipped, delivered, cancelled
	Subtotal        float64     `json:"subtotal"`
	Tax             float64     `json:"tax"`
	Shipping        float64     `json:"shipping"`
	Total           float64     `json:"total"`
	Currency        string      `json:"currency"`
	PaymentStatus   string      `json:"payment_status"` // pending, paid, failed, refunded
	ShippingAddress *Address    `json:"shipping_address"`
	BillingAddress  *Address    `json:"billing_address"`
	Notes           string      `json:"notes"`
	CreatedAt       time.Time   `json:"created_at"`
	UpdatedAt       time.Time   `json:"updated_at"`
	Items           []OrderItem `json:"items,omitempty"`
	Payment         *Payment    `json:"payment,omitempty"`
}

// OrderItem representa un item en un pedido
type OrderItem struct {
	ID        int      `json:"id"`
	OrderID   int      `json:"order_id"`
	ProductID int      `json:"product_id"`
	Quantity  int      `json:"quantity"`
	Price     float64  `json:"price"`
	Subtotal  float64  `json:"subtotal"`
	Product   *Product `json:"product,omitempty"`
}

// Payment representa un pago
type Payment struct {
	ID                    int       `json:"id"`
	OrderID               int       `json:"order_id"`
	PaymentMethod         string    `json:"payment_method"` // stripe, paypal, etc.
	Amount                float64   `json:"amount"`
	Currency              string    `json:"currency"`
	Status                string    `json:"status"` // pending, succeeded, failed, cancelled
	TransactionID         string    `json:"transaction_id"`
	StripePaymentIntentID string    `json:"stripe_payment_intent_id,omitempty"`
	StripeCustomerID      string    `json:"stripe_customer_id,omitempty"`
	ErrorMessage          string    `json:"error_message,omitempty"`
	CreatedAt             time.Time `json:"created_at"`
	UpdatedAt             time.Time `json:"updated_at"`
}

// WishlistItem representa un item en la lista de deseos
type WishlistItem struct {
	ID        int       `json:"id"`
	UserID    int       `json:"user_id"`
	ProductID int       `json:"product_id"`
	CreatedAt time.Time `json:"created_at"`
	Product   *Product  `json:"product,omitempty"`
}

// Review representa una reseña de producto
type Review struct {
	ID         int       `json:"id"`
	UserID     int       `json:"user_id"`
	ProductID  int       `json:"product_id"`
	OrderID    int       `json:"order_id"`
	Rating     int       `json:"rating"` // 1-5 stars
	Title      string    `json:"title"`
	Comment    string    `json:"comment"`
	IsVerified bool      `json:"is_verified"` // Si el usuario compró el producto
	IsActive   bool      `json:"is_active"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
	User       *User     `json:"user,omitempty"`
}
