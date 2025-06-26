package auth

import (
	"log"
	"os"

	"github.com/go-webauthn/webauthn/webauthn"
)

var WebAuthn *webauthn.WebAuthn

func InitWebAuthn() {
	// Obtener configuración desde variables de entorno
	rpID := os.Getenv("WEBAUTHN_RPID")
	if rpID == "" {
		rpID = "axiora.pro" // Valor por defecto para producción
	}

	rpOrigin := os.Getenv("WEBAUTHN_RP_ORIGIN")
	if rpOrigin == "" {
		rpOrigin = "https://axiora.pro" // Valor por defecto para producción
	}

	var err error
	WebAuthn, err = webauthn.New(&webauthn.Config{
		RPDisplayName: "Axiora E-commerce",
		RPID:          rpID,
		RPOrigins: []string{
			rpOrigin,
			"https://axiora.pro",    // Dominio principal
			"http://localhost:3000", // Desarrollo local
		},
		// Configuración más permisiva para desarrollo
		AttestationPreference: "none", // No requiere attestation
	})
	if err != nil {
		log.Fatalf("Fallo al inicializar WebAuthn: %v", err)
	}
	log.Printf("WebAuthn inicializado con éxito - RPID: %s, RPOrigin: %s", rpID, rpOrigin)
}
