package auth

import (
	"log"

	"github.com/go-webauthn/webauthn/webauthn"
)

var WebAuthn *webauthn.WebAuthn

func InitWebAuthn() {
	var err error
	WebAuthn, err = webauthn.New(&webauthn.Config{
		RPDisplayName: "NextGen E-commerce",
		RPID:          "localhost",
		RPOrigins: []string{
			"http://localhost:3000",
			"http://192.168.1.100:3000",
		},
		// Configuración más permisiva para desarrollo
		AttestationPreference: "none", // No requiere attestation
	})
	if err != nil {
		log.Fatalf("Fallo al inicializar WebAuthn: %v", err)
	}
	log.Println("WebAuthn inicializado con éxito")
}
