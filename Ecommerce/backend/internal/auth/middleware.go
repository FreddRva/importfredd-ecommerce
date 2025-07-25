package auth

import (
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// Variable para controlar logs de debug
// var isDevelopment = os.Getenv("ENV") != "production"

func JWTMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			if isDevelopment {
				log.Printf("Token requerido - Header: %s", authHeader)
			}
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "token requerido"})
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if isDevelopment {
			log.Printf("Validando token: %s...", tokenString[:min(len(tokenString), 20)])
		}

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			// Verificar que el método de firma sea el esperado
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("método de firma inesperado: %v", token.Header["alg"])
			}
			return getJWTSecret(), nil
		})

		if err != nil {
			if isDevelopment {
				log.Printf("Error parseando token: %v", err)
			}
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "token inválido"})
			return
		}

		if !token.Valid {
			if isDevelopment {
				log.Printf("Token no válido")
			}
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "token inválido"})
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			if isDevelopment {
				log.Printf("Claims no válidos")
			}
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "sin claims válidos"})
			return
		}

		// Convertir user_id a int de forma segura
		userIDFloat, ok := claims["user_id"].(float64)
		if !ok {
			if isDevelopment {
				log.Printf("user_id inválido en claims: %v", claims["user_id"])
			}
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "user_id inválido"})
			return
		}
		userID := int(userIDFloat)

		email, ok := claims["email"].(string)
		if !ok {
			if isDevelopment {
				log.Printf("email inválido en claims: %v", claims["email"])
			}
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "email inválido"})
			return
		}

		if isDevelopment {
			log.Printf("Token válido para usuario: %s (ID: %d)", email, userID)
		}
		c.Set("user_id", userID)
		c.Set("email", email)
		c.Next()
	}
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
