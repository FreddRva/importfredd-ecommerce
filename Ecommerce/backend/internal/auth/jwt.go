package auth

import (
	"crypto/rand"
	"encoding/hex"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// Obtener JWT secret desde variable de entorno
func getJWTSecret() []byte {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		// Fallback para desarrollo, pero debería estar configurado en producción
		secret = "mi_secreto_super_seguro_dev_only"
	}
	return []byte(secret)
}

// Genera un token JWT válido por 15 minutos
func GenerateJWT(userID int, email string) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": userID,
		"email":   email,
		"exp":     time.Now().Add(15 * time.Minute).Unix(),
		"type":    "access",
	})

	return token.SignedString(getJWTSecret())
}

// Genera un token JWT válido por 1 minuto (para pruebas de expiración)
func GenerateShortJWT(userID int, email string) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": userID,
		"email":   email,
		"exp":     time.Now().Add(1 * time.Minute).Unix(),
		"type":    "access",
	})

	return token.SignedString(getJWTSecret())
}

// Genera un refresh token aleatorio
func GenerateRefreshToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

// Valida un token JWT y retorna los claims
func ValidateJWT(tokenString string) (jwt.MapClaims, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		return getJWTSecret(), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, jwt.ErrSignatureInvalid
}

// Extrae el user_id de los claims JWT
func GetUserIDFromClaims(claims jwt.MapClaims) (int, error) {
	if userID, ok := claims["user_id"].(float64); ok {
		return int(userID), nil
	}
	return 0, jwt.ErrSignatureInvalid
}

func GenerateTokens(userID int, email string, isAdmin bool) (accessToken string, refreshToken string, err error) {
	// Access Token
	accessClaims := jwt.MapClaims{
		"user_id":  userID,
		"email":    email,
		"is_admin": isAdmin,
		"exp":      time.Now().Add(15 * time.Minute).Unix(),
		"type":     "access",
	}
	accessToken, err = jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims).SignedString(getJWTSecret())
	if err != nil {
		return "", "", err
	}

	// Refresh Token
	refreshClaims := jwt.MapClaims{
		"user_id": userID,
		"exp":     time.Now().Add(7 * 24 * time.Hour).Unix(),
		"type":    "refresh",
	}
	refreshToken, err = jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims).SignedString(getJWTSecret())
	if err != nil {
		return "", "", err
	}

	return accessToken, refreshToken, nil
}
