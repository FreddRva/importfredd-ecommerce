package auth

import (
	"sync"
	"time"
)

// RateLimiter implementa un rate limiter simple en memoria
type RateLimiter struct {
	attempts    map[string][]time.Time
	mutex       sync.RWMutex
	window      time.Duration
	maxAttempts int
}

// NewRateLimiter crea una nueva instancia de rate limiter
func NewRateLimiter(window time.Duration, maxAttempts int) *RateLimiter {
	return &RateLimiter{
		attempts:    make(map[string][]time.Time),
		window:      window,
		maxAttempts: maxAttempts,
	}
}

// IsAllowed verifica si una acción está permitida para una clave específica
func (rl *RateLimiter) IsAllowed(key string) bool {
	rl.mutex.Lock()
	defer rl.mutex.Unlock()

	now := time.Now()
	windowStart := now.Add(-rl.window)

	// Limpiar intentos antiguos
	if attempts, exists := rl.attempts[key]; exists {
		var validAttempts []time.Time
		for _, attempt := range attempts {
			if attempt.After(windowStart) {
				validAttempts = append(validAttempts, attempt)
			}
		}
		rl.attempts[key] = validAttempts
	}

	// Verificar si se permite el intento
	if len(rl.attempts[key]) >= rl.maxAttempts {
		return false
	}

	// Registrar el intento
	rl.attempts[key] = append(rl.attempts[key], now)
	return true
}

// GetRemainingAttempts retorna cuántos intentos quedan
func (rl *RateLimiter) GetRemainingAttempts(key string) int {
	rl.mutex.RLock()
	defer rl.mutex.RUnlock()

	now := time.Now()
	windowStart := now.Add(-rl.window)

	if attempts, exists := rl.attempts[key]; exists {
		var validAttempts int
		for _, attempt := range attempts {
			if attempt.After(windowStart) {
				validAttempts++
			}
		}
		return rl.maxAttempts - validAttempts
	}

	return rl.maxAttempts
}

// GetResetTime retorna cuándo se resetea el rate limit
func (rl *RateLimiter) GetResetTime(key string) time.Time {
	rl.mutex.RLock()
	defer rl.mutex.RUnlock()

	if attempts, exists := rl.attempts[key]; exists && len(attempts) > 0 {
		// Encontrar el intento más antiguo
		oldest := attempts[0]
		for _, attempt := range attempts {
			if attempt.Before(oldest) {
				oldest = attempt
			}
		}
		return oldest.Add(rl.window)
	}

	return time.Now()
}

// Limpiar datos antiguos periódicamente
func (rl *RateLimiter) Cleanup() {
	ticker := time.NewTicker(5 * time.Minute)
	go func() {
		for range ticker.C {
			rl.mutex.Lock()
			now := time.Now()
			windowStart := now.Add(-rl.window)

			for key, attempts := range rl.attempts {
				var validAttempts []time.Time
				for _, attempt := range attempts {
					if attempt.After(windowStart) {
						validAttempts = append(validAttempts, attempt)
					}
				}
				if len(validAttempts) == 0 {
					delete(rl.attempts, key)
				} else {
					rl.attempts[key] = validAttempts
				}
			}
			rl.mutex.Unlock()
		}
	}()
}

// Instancias globales de rate limiters
var (
	// Rate limiter para solicitud de códigos de verificación (5 intentos por 10 minutos)
	VerificationCodeLimiter = NewRateLimiter(10*time.Minute, 5)

	// Rate limiter para login (10 intentos por 15 minutos)
	LoginLimiter = NewRateLimiter(15*time.Minute, 10)

	// Rate limiter para registro (3 intentos por 30 minutos)
	RegistrationLimiter = NewRateLimiter(30*time.Minute, 3)
)

// Inicializar cleanup para todos los rate limiters
func init() {
	VerificationCodeLimiter.Cleanup()
	LoginLimiter.Cleanup()
	RegistrationLimiter.Cleanup()
}
