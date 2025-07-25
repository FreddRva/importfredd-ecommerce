package email

import (
	"fmt"
	"log"
	"os"

	resend "github.com/resendlabs/resend-go"
	"github.com/tuusuario/ecommerce-backend/internal/models"
)

var (
	DefaultEmailService *EmailService
)

func InitEmailService() {
	apiKey := os.Getenv("RESEND_API_KEY")
	if apiKey == "" {
		log.Fatalf("FATAL: RESEND_API_KEY es requerida para el servicio de email. La aplicación no puede arrancar.")
	}

	DefaultEmailService = NewEmailService()
	log.Println("✅ Servicio de Email (Resend) inicializado correctamente.")
}

type EmailService struct {
	client *resend.Client
}

func NewEmailService() *EmailService {
	apiKey := os.Getenv("RESEND_API_KEY")
	if apiKey == "" {
		log.Println("⚠️ RESEND_API_KEY no encontrada en variables de entorno")
		return nil
	}

	client := resend.NewClient(apiKey)
	return &EmailService{
		client: client,
	}
}

func (s *EmailService) SendOrderConfirmation(user *models.User, order *models.Order) error {
	if s.client == nil {
		return fmt.Errorf("servicio de email no configurado")
	}

	subject := "¡Tu pedido ha sido confirmado!"

	htmlContent := fmt.Sprintf(`
		<!DOCTYPE html>
		<html>
		<head>
			<meta charset="utf-8">
			<title>Confirmación de Pedido</title>
			<style>
				body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
				.container { max-width: 600px; margin: 0 auto; padding: 20px; }
				.header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
				.content { padding: 20px; background: #f9f9f9; }
				.order-details { background: white; padding: 15px; margin: 20px 0; border-left: 4px solid #4CAF50; }
				.footer { text-align: center; padding: 20px; color: #666; }
			</style>
		</head>
		<body>
			<div class="container">
				<div class="header">
					<h1>¡Pedido Confirmado!</h1>
				</div>
				<div class="content">
					<h2>Hola %s,</h2>
					<p>Tu pedido ha sido procesado exitosamente. Aquí están los detalles:</p>
					
					<div class="order-details">
						<h3>Detalles del Pedido</h3>
						<p><strong>Número de Pedido:</strong> %s</p>
						<p><strong>Total:</strong> $%.2f</p>
						<p><strong>Estado:</strong> %s</p>
						<p><strong>Fecha:</strong> %s</p>
					</div>
					
					<p>Te mantendremos informado sobre el estado de tu envío.</p>
					<p>¡Gracias por tu compra!</p>
				</div>
				<div class="footer">
					<p>Este es un email automático, por favor no respondas a este mensaje.</p>
				</div>
			</div>
		</body>
		</html>
	`, user.Email, order.ID, order.Total, order.Status, order.CreatedAt.Format("02/01/2006 15:04"))

	fromEmail := os.Getenv("EMAIL_FROM")
	if fromEmail == "" {
		fromEmail = "noreply@axiora.pro"
	}

	params := &resend.SendEmailRequest{
		From:    fromEmail,
		To:      []string{user.Email},
		Subject: subject,
		Html:    htmlContent,
	}

	_, err := s.client.Emails.Send(params)
	if err != nil {
		log.Printf("❌ Error enviando email de confirmación: %v", err)
		return err
	}

	log.Printf("✅ Email de confirmación enviado a %s", user.Email)
	return nil
}

func (s *EmailService) SendPaymentConfirmation(user *models.User, payment *models.Payment) error {
	if s.client == nil {
		return fmt.Errorf("servicio de email no configurado")
	}

	subject := "¡Pago procesado exitosamente!"

	htmlContent := fmt.Sprintf(`
		<!DOCTYPE html>
		<html>
		<head>
			<meta charset="utf-8">
			<title>Confirmación de Pago</title>
			<style>
				body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
				.container { max-width: 600px; margin: 0 auto; padding: 20px; }
				.header { background: #2196F3; color: white; padding: 20px; text-align: center; }
				.content { padding: 20px; background: #f9f9f9; }
				.payment-details { background: white; padding: 15px; margin: 20px 0; border-left: 4px solid #2196F3; }
				.footer { text-align: center; padding: 20px; color: #666; }
			</style>
		</head>
		<body>
			<div class="container">
				<div class="header">
					<h1>¡Pago Confirmado!</h1>
				</div>
				<div class="content">
					<h2>Hola %s,</h2>
					<p>Tu pago ha sido procesado exitosamente. Aquí están los detalles:</p>
					
					<div class="payment-details">
						<h3>Detalles del Pago</h3>
						<p><strong>ID de Pago:</strong> %s</p>
						<p><strong>Monto:</strong> $%.2f</p>
						<p><strong>Estado:</strong> %s</p>
						<p><strong>Método:</strong> %s</p>
						<p><strong>Fecha:</strong> %s</p>
					</div>
					
					<p>Tu pedido está siendo procesado y recibirás una confirmación pronto.</p>
					<p>¡Gracias por tu compra!</p>
				</div>
				<div class="footer">
					<p>Este es un email automático, por favor no respondas a este mensaje.</p>
				</div>
			</div>
		</body>
		</html>
	`, user.Email, payment.ID, payment.Amount, payment.Status, payment.PaymentMethod, payment.CreatedAt.Format("02/01/2006 15:04"))

	fromEmail := os.Getenv("EMAIL_FROM")
	if fromEmail == "" {
		fromEmail = "noreply@axiora.pro"
	}

	params := &resend.SendEmailRequest{
		From:    fromEmail,
		To:      []string{user.Email},
		Subject: subject,
		Html:    htmlContent,
	}

	_, err := s.client.Emails.Send(params)
	if err != nil {
		log.Printf("❌ Error enviando email de pago: %v", err)
		return err
	}

	log.Printf("✅ Email de pago enviado a %s", user.Email)
	return nil
}

func (s *EmailService) SendTestEmail(to, subject, body string) error {
	if s.client == nil {
		return fmt.Errorf("servicio de email no configurado")
	}

	htmlContent := fmt.Sprintf(`
		<!DOCTYPE html>
		<html>
		<head>
			<meta charset="utf-8">
			<title>Email de Prueba</title>
			<style>
				body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
				.container { max-width: 600px; margin: 0 auto; padding: 20px; }
				.header { background: #FF9800; color: white; padding: 20px; text-align: center; }
				.content { padding: 20px; background: #f9f9f9; }
				.footer { text-align: center; padding: 20px; color: #666; }
			</style>
		</head>
		<body>
			<div class="container">
				<div class="header">
					<h1>Email de Prueba</h1>
				</div>
				<div class="content">
					<h2>¡Hola!</h2>
					<p>Este es un email de prueba desde tu aplicación e-commerce con Resend.</p>
					<p><strong>Asunto:</strong> %s</p>
					<p><strong>Mensaje:</strong> %s</p>
					<p>Si recibes este email, significa que tu configuración de Resend está funcionando correctamente.</p>
				</div>
				<div class="footer">
					<p>Enviado desde tu aplicación e-commerce</p>
				</div>
			</div>
		</body>
		</html>
	`, subject, body)

	fromEmail := os.Getenv("EMAIL_FROM")
	if fromEmail == "" {
		fromEmail = "noreply@axiora.pro"
	}

	params := &resend.SendEmailRequest{
		From:    fromEmail,
		To:      []string{to},
		Subject: subject,
		Html:    htmlContent,
	}

	_, err := s.client.Emails.Send(params)
	if err != nil {
		log.Printf("❌ Error enviando email de prueba: %v", err)
		return err
	}

	log.Printf("✅ Email de prueba enviado a %s", to)
	return nil
}

// SendEmail envía un email genérico con HTML personalizado
func (s *EmailService) SendEmail(to, subject, htmlContent string) error {
	if s.client == nil {
		return fmt.Errorf("servicio de email no configurado")
	}

	fromEmail := os.Getenv("EMAIL_FROM")
	if fromEmail == "" {
		fromEmail = "noreply@axiora.pro"
	}

	params := &resend.SendEmailRequest{
		From:    fromEmail,
		To:      []string{to},
		Subject: subject,
		Html:    htmlContent,
	}

	_, err := s.client.Emails.Send(params)
	if err != nil {
		log.Printf("❌ Error enviando email: %v", err)
		return err
	}

	log.Printf("✅ Email enviado a %s", to)
	return nil
}

func SendVerificationEmail(to, token string) error {
	if DefaultEmailService == nil {
		return fmt.Errorf("servicio de email no inicializado")
	}

	subject := "Verifica tu dirección de correo electrónico"

	// Usar el dominio de producción en lugar de localhost
	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "https://axiora.pro"
	}
	verificationLink := fmt.Sprintf("%s/auth/verify-email?token=%s", frontendURL, token)

	htmlContent := fmt.Sprintf(`
		<!DOCTYPE html>
		<html>
		<head>
			<meta charset="utf-8">
			<title>Verificación de Email</title>
			<style>
				body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
				.container { max-width: 600px; margin: 0 auto; padding: 20px; }
				.header { background: #007bff; color: white; padding: 20px; text-align: center; }
				.content { padding: 20px; background: #f9f9f9; }
				.button { display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; }
				.footer { text-align: center; padding: 20px; color: #666; }
			</style>
		</head>
		<body>
			<div class="container">
				<div class="header">
					<h1>Verifica tu Email</h1>
				</div>
				<div class="content">
					<h2>Hola,</h2>
					<p>Gracias por registrarte. Por favor, haz clic en el botón de abajo para verificar tu dirección de correo electrónico.</p>
					<p><a href="%s" class="button">Verificar Email</a></p>
					<p>Si no puedes hacer clic en el botón, copia y pega el siguiente enlace en tu navegador:</p>
					<p>%s</p>
				</div>
				<div class="footer">
					<p>Este es un email automático, por favor no respondas a este mensaje.</p>
				</div>
			</div>
		</body>
		</html>
	`, verificationLink, verificationLink)

	fromEmail := os.Getenv("EMAIL_FROM")
	if fromEmail == "" {
		fromEmail = "noreply@axiora.pro"
	}

	params := &resend.SendEmailRequest{
		From:    fromEmail,
		To:      []string{to},
		Subject: subject,
		Html:    htmlContent,
	}

	_, err := DefaultEmailService.client.Emails.Send(params)
	if err != nil {
		log.Printf("❌ Error enviando email de verificación: %v", err)
		return err
	}

	log.Printf("✅ Email de verificación enviado a %s", to)
	return nil
}

func SendVerificationCodeEmail(to, code string) error {
	if DefaultEmailService == nil {
		// Si no hay servicio de email configurado, solo log y devolver éxito
		// para que el registro funcione en desarrollo/producción sin email
		log.Printf("⚠️ Servicio de email no configurado. Código de verificación para %s: %s", to, code)
		return nil
	}

	subject := "Tu código de verificación"
	htmlContent := fmt.Sprintf(`
		<!DOCTYPE html>
		<html>
		<head>
			<meta charset="utf-8">
			<title>Tu Código de Verificación</title>
			<style>
				body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; line-height: 1.6; color: #333; }
				.container { max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
				.header { text-align: center; padding-bottom: 20px; }
				.content { padding: 20px; background: #f9f9f9; text-align: center; }
				.code { font-size: 36px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; color: #007bff; }
				.footer { text-align: center; padding-top: 20px; color: #666; font-size: 12px; }
			</style>
		</head>
		<body>
			<div class="container">
				<div class="header">
					<h1>Tu Código de Verificación</h1>
				</div>
				<div class="content">
					<p>Hola,</p>
					<p>Usa este código para completar tu registro. El código es válido por 10 minutos.</p>
					<div class="code">%s</div>
					<p>Si no solicitaste este código, puedes ignorar este correo de forma segura.</p>
				</div>
				<div class="footer">
					<p>Este es un email automático, por favor no respondas a este mensaje.</p>
				</div>
			</div>
		</body>
		</html>
	`, code)

	fromEmail := os.Getenv("EMAIL_FROM")
	if fromEmail == "" {
		fromEmail = "noreply@axiora.pro"
	}

	params := &resend.SendEmailRequest{
		From:    fromEmail,
		To:      []string{to},
		Subject: subject,
		Html:    htmlContent,
	}

	_, err := DefaultEmailService.client.Emails.Send(params)
	if err != nil {
		log.Printf("❌ Error enviando email con código de verificación: %v", err)
		return err
	}

	log.Printf("✅ Email con código de verificación enviado a %s", to)
	return nil
}
