package auth

import (
	"crypto/rand"
	"log"
	"math/big"
	"net/http"
	"os"
	"regexp"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/go-webauthn/webauthn/protocol"
	"github.com/go-webauthn/webauthn/webauthn"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/tuusuario/ecommerce-backend/internal/db"
	"github.com/tuusuario/ecommerce-backend/internal/email"
	"golang.org/x/crypto/bcrypt"
)

var sessionStore = make(map[string]*webauthn.SessionData)

// Variable para controlar logs de debug
var isDevelopment = os.Getenv("ENV") != "production"

type AuthHandler struct {
	db *pgxpool.Pool
}

func NewAuthHandler(db *pgxpool.Pool) (*AuthHandler, error) {
	return &AuthHandler{db: db}, nil
}

// Validar email con regex más estricto
func isValidEmail(email string) bool {
	emailRegex := regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
	return emailRegex.MatchString(email) && len(email) <= 254
}

// Validar código de verificación
func isValidVerificationCode(code string) bool {
	codeRegex := regexp.MustCompile(`^[0-9]{6}$`)
	return codeRegex.MatchString(code)
}

func (h *AuthHandler) RequestVerificationCode(c *gin.Context) {
	var req struct {
		Email string `json:"email" binding:"required,email"`
		Mode  string `json:"mode"` // 'register' o 'recover'
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		if isDevelopment {
			log.Printf("[ERROR] Error en ShouldBindJSON: %v", err)
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email no válido."})
		return
	}

	// Validación más estricta del email
	if !isValidEmail(req.Email) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Formato de email inválido."})
		return
	}

	// Rate limiting por IP y email
	clientIP := c.ClientIP()
	rateLimitKey := clientIP + ":" + req.Email

	if !VerificationCodeLimiter.IsAllowed(rateLimitKey) {
		resetTime := VerificationCodeLimiter.GetResetTime(rateLimitKey)

		c.JSON(http.StatusTooManyRequests, gin.H{
			"error":       "Demasiados intentos. Intenta de nuevo más tarde.",
			"retry_after": resetTime.Format(time.RFC3339),
		})
		return
	}

	code, err := generateNumericCode(6)
	if err != nil {
		if isDevelopment {
			log.Printf("[ERROR] Error generando código: %v", err)
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo generar el código."})
		return
	}

	// Enviar el código por email
	if emailErr := email.SendVerificationCodeEmail(req.Email, code); emailErr != nil {
		if isDevelopment {
			log.Printf("[ERROR] Error enviando código de verificación a %s: %v", req.Email, emailErr)
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo enviar el código de verificación."})
		return
	}

	hashedCode, err := HashPassword(code)
	if err != nil {
		if isDevelopment {
			log.Printf("[ERROR] Error hasheando código: %v", err)
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error de seguridad."})
		return
	}
	expiresAt := time.Now().Add(10 * time.Minute)

	user, err := db.GetUserByEmail(h.db, req.Email)
	if err == nil && user != nil {
		if user.IsActive && req.Mode != "recover" {
			if isDevelopment {
				log.Printf("[ERROR] Usuario ya registrado y activo: %s", req.Email)
			}
			c.JSON(http.StatusConflict, gin.H{"error": "Este correo ya está registrado."})
			return
		} else {
			// Reactivar usuario y actualizar token (o recuperación)
			err = db.ReactivateUser(h.db, req.Email, hashedCode, expiresAt)
			if err != nil {
				if isDevelopment {
					log.Printf("[ERROR] Error reactivando usuario: %v", err)
				}
				c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo reactivar el usuario."})
				return
			}

			// Solo mostrar código en desarrollo
			if isDevelopment {
				log.Printf("MODO DEBUG: Código para %s: %s", req.Email, code)
			}

			var msg string
			if req.Mode == "recover" {
				msg = "Código de recuperación generado."
			} else {
				msg = "Código generado y usuario reactivado."
			}

			response := gin.H{"message": msg}
			if isDevelopment {
				response["debug_code"] = code
			}

			c.JSON(http.StatusOK, response)
			return
		}
	}

	// Si no existe, crear usuario
	_, err = db.CreateUser(h.db, req.Email, hashedCode, expiresAt)
	if err != nil {
		if err.Error() == "user already exists and is verified" {
			if isDevelopment {
				log.Printf("[ERROR] Usuario ya existe y está verificado: %s", req.Email)
			}
			c.JSON(http.StatusConflict, gin.H{"error": "Este correo ya está registrado."})
			return
		}
		if isDevelopment {
			log.Printf("[ERROR] Error creando usuario: %v", err)
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error guardando información."})
		return
	}

	// Solo mostrar código en desarrollo
	if isDevelopment {
		log.Printf("MODO DEBUG: Código para %s: %s", req.Email, code)
	}

	response := gin.H{"message": "Código generado."}
	if isDevelopment {
		response["debug_code"] = code
	}

	c.JSON(http.StatusOK, response)
}

// Nueva función para obtener la instancia de WebAuthn según el Origin
func getWebAuthnByOrigin(origin string) (*webauthn.WebAuthn, error) {
	// Determinar RPID y RPOrigin basado en el origen de la petición
	var rpID, rpOrigin string
	switch origin {
	case "https://axiora.pro":
		rpID = "axiora.pro"
		rpOrigin = "https://axiora.pro"
	case "https://importfredd-axiora.vercel.app":
		rpID = "importfredd-axiora.vercel.app"
		rpOrigin = "https://importfredd-axiora.vercel.app"
	case "http://localhost:3000":
		rpID = "localhost"
		rpOrigin = "http://localhost:3000"
	default:
		// Para cualquier otro origen, extraer el dominio del origin
		if origin != "" {
			// Extraer el dominio del origin (remover protocolo y puerto)
			if strings.HasPrefix(origin, "https://") {
				rpID = strings.TrimPrefix(origin, "https://")
			} else if strings.HasPrefix(origin, "http://") {
				rpID = strings.TrimPrefix(origin, "http://")
			} else {
				rpID = origin
			}
			// Remover puerto si existe
			if strings.Contains(rpID, ":") {
				rpID = strings.Split(rpID, ":")[0]
			}
			rpOrigin = origin
		} else {
			// Fallback a configuración por defecto
			rpID = os.Getenv("WEBAUTHN_RPID")
			if rpID == "" {
				rpID = "axiora.pro"
			}
			rpOrigin = os.Getenv("WEBAUTHN_RP_ORIGIN")
			if rpOrigin == "" {
				rpOrigin = "https://axiora.pro"
			}
		}
	}

	if isDevelopment {
		log.Printf("WebAuthn config - Origin: %s, RPID: %s, RPOrigin: %s", origin, rpID, rpOrigin)
	}

	waconfig := &webauthn.Config{
		RPDisplayName: "Axiora E-commerce",
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

	// Validación más estricta
	if !isValidEmail(req.Email) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Formato de email inválido."})
		return
	}

	if !isValidVerificationCode(req.Code) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Código de verificación inválido."})
		return
	}

	// Rate limiting para registro
	clientIP := c.ClientIP()
	rateLimitKey := clientIP + ":register:" + req.Email

	if !RegistrationLimiter.IsAllowed(rateLimitKey) {
		resetTime := RegistrationLimiter.GetResetTime(rateLimitKey)

		c.JSON(http.StatusTooManyRequests, gin.H{
			"error":       "Demasiados intentos de registro. Intenta de nuevo más tarde.",
			"retry_after": resetTime.Format(time.RFC3339),
		})
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
		if isDevelopment {
			log.Printf("Failed to begin registration: %v", err)
		}
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
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Registro completado exitosamente",
	})
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

	// Validación más estricta del email
	if !isValidEmail(email) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Formato de email inválido."})
		return
	}

	// Rate limiting para login
	clientIP := c.ClientIP()
	rateLimitKey := clientIP + ":login:" + email

	if !LoginLimiter.IsAllowed(rateLimitKey) {
		resetTime := LoginLimiter.GetResetTime(rateLimitKey)

		c.JSON(http.StatusTooManyRequests, gin.H{
			"error":       "Demasiados intentos de login. Intenta de nuevo más tarde.",
			"retry_after": resetTime.Format(time.RFC3339),
		})
		return
	}

	user, err := db.GetUserByEmailWithPassword(h.db, email)
	if err != nil || user == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User not found"})
		return
	}

	credentials, err := db.GetCredentialsByUser(h.db, user.ID)
	if err != nil {
		if isDevelopment {
			log.Printf("could not get credentials for user %d: %v", user.ID, err)
		}
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
		if isDevelopment {
			log.Printf("Failed to begin login: %v", err)
		}
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

	// Validación más estricta del email
	if !isValidEmail(email) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Formato de email inválido."})
		return
	}

	user, err := db.GetUserByEmailWithPassword(h.db, email)
	if err != nil || user == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User not found"})
		return
	}

	credentials, err := db.GetCredentialsByUser(h.db, user.ID)
	if err != nil {
		if isDevelopment {
			log.Printf("could not get credentials for user %d: %v", user.ID, err)
		}
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
		if isDevelopment {
			log.Printf("Failed to validate login: %v", err)
		}
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
