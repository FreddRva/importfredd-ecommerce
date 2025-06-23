package main

import (
	"context"
	"fmt"
	"log"
	"strings"

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

	fmt.Println("=== LIMPIEZA DE CATEGORÍAS EN LA BASE DE DATOS ===")

	// 1. Eliminar categorías vacías
	res, err := db.Pool.Exec(context.Background(), "DELETE FROM categories WHERE name IS NULL OR TRIM(name) = ''")
	if err != nil {
		log.Fatalf("Error eliminando categorías vacías: %v", err)
	}
	fmt.Printf("Categorías vacías eliminadas: %d\n", res.RowsAffected())

	// 2. Eliminar duplicados (deja solo la de menor id)
	dupDelete := `
	DELETE FROM categories
	WHERE id NOT IN (
	  SELECT min_id FROM (
	    SELECT MIN(id) as min_id FROM categories GROUP BY name
	  ) as subquery
	)
	AND name IN (
	  SELECT name FROM categories GROUP BY name HAVING COUNT(*) > 1
	)
	`
	res, err = db.Pool.Exec(context.Background(), dupDelete)
	if err != nil {
		log.Fatalf("Error eliminando duplicados: %v", err)
	}
	fmt.Printf("Categorías duplicadas eliminadas: %d\n", res.RowsAffected())

	// 3. Insertar nuevas categorías si no existen
	categoriasNuevas := []string{
		"Tecnología",
		"Ropa",
		"Calzado",
		"Hogar",
		"Deportes",
		"Libros",
		"Juguetes",
		"Belleza",
		"Accesorios",
		"Herramientas",
	}
	insertados := 0
	for _, nombre := range categoriasNuevas {
		nombre = strings.TrimSpace(nombre)
		if nombre == "" {
			continue
		}
		var existe int
		err := db.Pool.QueryRow(context.Background(), "SELECT COUNT(*) FROM categories WHERE name = $1", nombre).Scan(&existe)
		if err != nil {
			log.Printf("Error verificando existencia de '%s': %v", nombre, err)
			continue
		}
		if existe == 0 {
			_, err := db.Pool.Exec(context.Background(), "INSERT INTO categories (name) VALUES ($1)", nombre)
			if err != nil {
				log.Printf("Error insertando '%s': %v", nombre, err)
				continue
			}
			fmt.Printf("Categoría agregada: %s\n", nombre)
			insertados++
		}
	}
	fmt.Printf("Total de categorías nuevas insertadas: %d\n", insertados)

	// Mostrar resultado final
	fmt.Println("\n=== CATEGORÍAS FINALES ===")
	rows, err := db.Pool.Query(context.Background(), "SELECT id, name FROM categories ORDER BY id ASC")
	if err != nil {
		log.Fatalf("Error consultando categorías: %v", err)
	}
	defer rows.Close()
	for rows.Next() {
		var id int
		var name string
		rows.Scan(&id, &name)
		fmt.Printf("%3d | %s\n", id, name)
	}
}
