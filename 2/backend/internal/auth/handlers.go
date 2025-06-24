package auth

import (
	"crypto/rand"
	"fmt"
	"log"
	"math/big"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/go-webauthn/webauthn/protocol"
	"github.com/go-webauthn/webauthn/webauthn"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/tuusuario/ecommerce-backend/internal/db"
	"golang.org/x/crypto/bcrypt"
)

var sessionStore = make(map[string]*webauthn.SessionData)

type AuthHandler struct {
	db *pgxpool.Pool
}

func NewAuthHandler(db *pgxpool.Pool) (*AuthHandler, error) {
	return &AuthHandler{db: db}, nil
}

func (h *AuthHandler) RequestVerificationCode(c *gin.Context) {
	var req struct {
		Email string `json:"email" binding:"required,email"`
		Mode  string `json:"mode"` // 'register' o 'recover'
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("[ERROR] Error en ShouldBindJSON: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email no válido."})
		return
	}

	code, err := generateNumericCode(6)
	if err != nil {
		log.Printf("[ERROR] Error generando código: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo generar el código."})
		return
	}
	hashedCode, err := HashPassword(code)
	if err != nil {
		log.Printf("[ERROR] Error hasheando código: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error de seguridad."})
		return
	}
	expiresAt := time.Now().Add(10 * time.Minute)

	user, err := db.GetUserByEmail(h.db, req.Email)
	if err == nil && user != nil {
		if user.IsActive && req.Mode != "recover" {
			log.Printf("[ERROR] Usuario ya registrado y activo: %s", req.Email)
			c.JSON(http.StatusConflict, gin.H{"error": "Este correo ya está registrado."})
			return
		} else {
			// Reactivar usuario y actualizar token (o recuperación)
			err = db.ReactivateUser(h.db, req.Email, hashedCode, expiresAt)
			if err != nil {
				log.Printf("[ERROR] Error reactivando usuario: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo reactivar el usuario."})
				return
			}
			log.Printf("MODO DEBUG: Código para %s: %s", req.Email, code)
			var msg string
			if req.Mode == "recover" {
				msg = "Código de recuperación generado."
			} else {
				msg = "Código generado y usuario reactivado."
			}
			c.JSON(http.StatusOK, gin.H{
				"message":    msg,
				"debug_code": code,
			})
			return
		}
	}

	// Si no existe, crear usuario
	_, err = db.CreateUser(h.db, req.Email, hashedCode, expiresAt)
	if err != nil {
		if err.Error() == "user already exists and is verified" {
			log.Printf("[ERROR] Usuario ya existe y está verificado: %s", req.Email)
			c.JSON(http.StatusConflict, gin.H{"error": "Este correo ya está registrado."})
			return
		}
		log.Printf("[ERROR] Error creando usuario: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error guardando información."})
		return
	}
	log.Printf("MODO DEBUG: Código para %s: %s", req.Email, code)
	c.JSON(http.StatusOK, gin.H{
		"message":    "Código generado.",
		"debug_code": code,
	})
}

// Nueva función para obtener la instancia de WebAuthn según el Origin
func getWebAuthnByOrigin(origin string) (*webauthn.WebAuthn, error) {
	var rpID, rpOrigin string

	switch origin {
	case "https://importfredd-ecommercerv.vercel.app":
		rpID = "importfredd-ecommercerv.vercel.app"
		rpOrigin = "https://importfredd-ecommercerv.vercel.app"
	case "https://importfredd-ecommercerv-git-main-freddrvas-projects.vercel.app":
		rpID = "importfredd-ecommercerv-git-main-freddrvas-projects.vercel.app"
		rpOrigin = "https://importfredd-ecommercerv-git-main-freddrvas-projects.vercel.app"
	default:
		return nil, fmt.Errorf("Origin no permitido para WebAuthn: %s", origin)
	}

	waconfig := &webauthn.Config{
		RPDisplayName: "Go Ecommerce",
		RPID:          rpID,
		RPOrigins:     []string{rpOrigin},
	}
	return webauthn.New(waconfig)
}

func (h *AuthHandler) BeginRegistration(c *gin.Context) {
	var req struct {
		Email string `json:"email" binding:"required,email"`
		Code  string `json:"code" binding:"required"`
		Mode  string `json:"mode"` // 'register' o 'recover'
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email y código son requeridos."})
		return
	}

	user, err := db.GetUserByEmailWithPassword(h.db, req.Email)
	if err != nil || user == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Usuario no encontrado."})
		return
	}

	if user.IsVerified && req.Mode != "recover" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Este usuario ya está verificado."})
		return
	}

	if user.VerificationToken == nil || user.VerificationTokenExpiresAt == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No se ha solicitado un código."})
		return
	}
	if time.Now().After(*user.VerificationTokenExpiresAt) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "El código ha expirado."})
		return
	}
	if !CheckPasswordHash(req.Code, *user.VerificationToken) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "El código no es válido."})
		return
	}

	credentials, err := db.GetCredentialsByUser(h.db, user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudieron obtener las credenciales."})
		return
	}
	user.Credentials = credentials

	origin := c.Request.Header.Get("Origin")
	webAuthn, err := getWebAuthnByOrigin(origin)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	options, sessionData, err := webAuthn.BeginRegistration(user)
	if err != nil {
		log.Printf("Failed to begin registration: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo iniciar el registro de Passkey."})
		return
	}

	sessionStore[user.Email] = sessionData
	c.JSON(http.StatusOK, options)
}

func (h *AuthHandler) FinishRegistration(c *gin.Context) {
	email := c.Query("email")
	mode := c.Query("mode") // 'register' o 'recover'
	if email == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email is required"})
		return
	}

	user, err := db.GetUserByEmailWithPassword(h.db, email)
	if err != nil || user == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User not found"})
		return
	}

	sessionData, ok := sessionStore[user.Email]
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Registration session not found"})
		return
	}

	parsedResponse, err := protocol.ParseCredentialCreationResponseBody(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse registration response"})
		return
	}

	if mode == "recover" {
		// Eliminar credenciales antiguas antes de guardar la nueva
		err := db.DeleteAllCredentialsForUser(h.db, user.ID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudieron eliminar las credenciales antiguas"})
			return
		}
	}

	origin := c.Request.Header.Get("Origin")
	webAuthn, err := getWebAuthnByOrigin(origin)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	credential, err := webAuthn.CreateCredential(user, *sessionData, parsedResponse)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create credential"})
		return
	}

	if err := db.SaveCredential(h.db, user.ID, *credential); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save credential"})
		return
	}

	if err := db.MarkUserAsVerified(h.db, user.ID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to mark user as verified"})
		return
	}

	delete(sessionStore, user.Email)
	c.JSON(http.StatusOK, gin.H{"message": "Registration successful"})
}

func (h *AuthHandler) RefreshToken(c *gin.Context) {
	var req struct {
		RefreshToken string `json:"refresh_token"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Refresh token no proporcionado"})
		return
	}

	claims, err := ValidateJWT(req.RefreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Refresh token inválido"})
		return
	}

	// Asegurarse de que es un refresh token
	if tokenType, ok := claims["type"].(string); !ok || tokenType != "refresh" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Tipo de token inválido"})
		return
	}

	userID, err := GetUserIDFromClaims(claims)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "ID de usuario inválido en el token"})
		return
	}

	// Obtener datos del usuario para generar el nuevo token
	user, err := db.GetUserByID(h.db, userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Usuario no encontrado"})
		return
	}

	// Generar nuevos tokens
	accessToken, refreshToken, err := GenerateTokens(user.ID, user.Email, user.IsAdmin)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo generar el token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"access_token":  accessToken,
		"refresh_token": refreshToken,
	})
}

func (h *AuthHandler) BeginLogin(c *gin.Context) {
	email := c.Query("email")
	if email == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email is required"})
		return
	}

	user, err := db.GetUserByEmailWithPassword(h.db, email)
	if err != nil || user == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User not found"})
		return
	}

	credentials, err := db.GetCredentialsByUser(h.db, user.ID)
	if err != nil {
		log.Printf("could not get credentials for user %d: %v", user.ID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not get user credentials"})
		return
	}
	user.Credentials = credentials

	origin := c.Request.Header.Get("Origin")
	webAuthn, err := getWebAuthnByOrigin(origin)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	options, sessionData, err := webAuthn.BeginLogin(user)
	if err != nil {
		log.Printf("Failed to begin login: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to begin login"})
		return
	}

	sessionStore[user.Email] = sessionData
	c.JSON(http.StatusOK, options)
}

func (h *AuthHandler) FinishLogin(c *gin.Context) {
	email := c.Query("email")
	if email == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email is required"})
		return
	}

	user, err := db.GetUserByEmailWithPassword(h.db, email)
	if err != nil || user == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User not found"})
		return
	}

	credentials, err := db.GetCredentialsByUser(h.db, user.ID)
	if err != nil {
		log.Printf("could not get credentials for user %d: %v", user.ID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not get user credentials"})
		return
	}
	user.Credentials = credentials

	sessionData, ok := sessionStore[user.Email]
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Login session not found"})
		return
	}

	parsedResponse, err := protocol.ParseCredentialRequestResponseBody(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse login response"})
		return
	}

	origin := c.Request.Header.Get("Origin")
	webAuthn, err := getWebAuthnByOrigin(origin)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	_, err = webAuthn.ValidateLogin(user, *sessionData, parsedResponse)
	if err != nil {
		log.Printf("Failed to validate login: %v", err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Login failed"})
		return
	}

	accessToken, refreshToken, err := GenerateTokens(user.ID, user.Email, user.IsAdmin)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	delete(sessionStore, user.Email)

	userResponse := gin.H{
		"id":          user.ID,
		"email":       user.Email,
		"is_admin":    user.IsAdmin,
		"is_verified": user.IsVerified,
		"is_active":   user.IsActive,
	}
	c.JSON(http.StatusOK, gin.H{
		"success":       true,
		"access_token":  accessToken,
		"refresh_token": refreshToken,
		"user":          userResponse,
	})
}

func CheckPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)
	return string(bytes), err
}

func generateNumericCode(length int) (string, error) {
	result := ""
	for i := 0; i < length; i++ {
		num, err := rand.Int(rand.Reader, big.NewInt(10))
		if err != nil {
			return "", err
		}
		result += num.String()
	}
	return result, nil
}

func AddAuthRoutes(rg *gin.RouterGroup, authHandler *AuthHandler) {
	rg.POST("/request-verification-code", authHandler.RequestVerificationCode)
	rg.POST("/begin-registration", authHandler.BeginRegistration)
	rg.POST("/finish-registration", authHandler.FinishRegistration)
	rg.GET("/begin-login", authHandler.BeginLogin)
	rg.POST("/finish-login", authHandler.FinishLogin)
	rg.POST("/refresh-token", authHandler.RefreshToken)
}
