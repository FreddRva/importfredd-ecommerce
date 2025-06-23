package main

import (
	"fmt"
	"log"

	"github.com/joho/godotenv"
	"github.com/tuusuario/ecommerce-backend/internal/db"
)

func main() {
	// Cargar variables de entorno
	if err := godotenv.Load(); err != nil {
		log.Println("No se encontró archivo .env, usando variables de entorno del sistema")
	}

	// Conectar a la base de datos
	if err := db.Connect(); err != nil {
		log.Fatalf("Error conectando a la base de datos: %v", err)
	}
	defer db.Pool.Close()

	// Email del usuario a actualizar como admin
	email := "rvfredy9@gmail.com"

	// Verificar si el usuario existe
	user, err := db.GetUserByEmail(db.Pool, email)
	if err != nil {
		log.Fatalf("Error obteniendo usuario: %v", err)
	}

	fmt.Printf("Usuario encontrado: ID=%d, Email=%s, IsAdmin=%t\n", user.ID, user.Email, user.IsAdmin)

	// Si ya es admin, no hacer nada
	if user.IsAdmin {
		fmt.Println("El usuario ya es administrador")
		return
	}

	// Actualizar como administrador
	if err := db.UpdateUserAsAdmin(db.Pool, email); err != nil {
		log.Fatalf("Error actualizando usuario como admin: %v", err)
	}

	fmt.Printf("✅ Usuario %s actualizado como administrador exitosamente\n", email)
}
