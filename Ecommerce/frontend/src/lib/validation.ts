// Validación más estricta para el frontend

// Validar email con regex más estricto
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email) && email.length <= 254;
}

// Validar código de verificación (6 dígitos)
export function isValidVerificationCode(code: string): boolean {
  const codeRegex = /^[0-9]{6}$/;
  return codeRegex.test(code);
}

// Validar nombre (solo letras, espacios y algunos caracteres especiales)
export function isValidName(name: string): boolean {
  const nameRegex = /^[a-zA-ZÀ-ÿ\u00f1\u00d1\s'-]{2,50}$/;
  return nameRegex.test(name.trim());
}

// Validar teléfono (formato internacional)
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

// Validar dirección
export function isValidAddress(address: string): boolean {
  return address.trim().length >= 5 && address.trim().length <= 200;
}

// Validar código postal
export function isValidPostalCode(postalCode: string): boolean {
  const postalRegex = /^[0-9A-Za-z\s-]{3,10}$/;
  return postalRegex.test(postalCode.trim());
}

// Validar ciudad
export function isValidCity(city: string): boolean {
  return city.trim().length >= 2 && city.trim().length <= 50;
}

// Validar país
export function isValidCountry(country: string): boolean {
  return country.trim().length >= 2 && country.trim().length <= 50;
}

// Sanitizar entrada de texto (remover caracteres peligrosos)
export function sanitizeText(text: string): string {
  return text
    .trim()
    .replace(/[<>]/g, '') // Remover < y >
    .replace(/javascript:/gi, '') // Remover javascript:
    .replace(/on\w+=/gi, '') // Remover event handlers
    .substring(0, 1000); // Limitar longitud
}

// Validar y sanitizar email
export function validateAndSanitizeEmail(email: string): { isValid: boolean; sanitized: string; error?: string } {
  const sanitized = email.trim().toLowerCase();
  
  if (!sanitized) {
    return { isValid: false, sanitized: '', error: 'El email es requerido' };
  }
  
  if (!isValidEmail(sanitized)) {
    return { isValid: false, sanitized: '', error: 'Formato de email inválido' };
  }
  
  return { isValid: true, sanitized };
}

// Validar y sanitizar código de verificación
export function validateAndSanitizeCode(code: string): { isValid: boolean; sanitized: string; error?: string } {
  const sanitized = code.trim();
  
  if (!sanitized) {
    return { isValid: false, sanitized: '', error: 'El código es requerido' };
  }
  
  if (!isValidVerificationCode(sanitized)) {
    return { isValid: false, sanitized: '', error: 'El código debe tener 6 dígitos' };
  }
  
  return { isValid: true, sanitized };
}

// Validar formulario de dirección
export function validateAddressForm(data: {
  first_name: string;
  last_name: string;
  phone: string;
  address1: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  
  // Validar nombre
  if (!isValidName(data.first_name)) {
    errors.first_name = 'Nombre inválido (2-50 caracteres, solo letras)';
  }
  
  // Validar apellido
  if (!isValidName(data.last_name)) {
    errors.last_name = 'Apellido inválido (2-50 caracteres, solo letras)';
  }
  
  // Validar teléfono
  if (!isValidPhone(data.phone)) {
    errors.phone = 'Teléfono inválido (formato internacional)';
  }
  
  // Validar dirección
  if (!isValidAddress(data.address1)) {
    errors.address1 = 'Dirección inválida (5-200 caracteres)';
  }
  
  // Validar ciudad
  if (!isValidCity(data.city)) {
    errors.city = 'Ciudad inválida (2-50 caracteres)';
  }
  
  // Validar estado
  if (!isValidCity(data.state)) {
    errors.state = 'Estado inválido (2-50 caracteres)';
  }
  
  // Validar código postal
  if (!isValidPostalCode(data.postal_code)) {
    errors.postal_code = 'Código postal inválido';
  }
  
  // Validar país
  if (!isValidCountry(data.country)) {
    errors.country = 'País inválido (2-50 caracteres)';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// Validar longitud de contraseña (para futuras implementaciones)
export function isValidPassword(password: string): boolean {
  return password.length >= 8 && password.length <= 128;
}

// Validar que la contraseña contenga caracteres seguros
export function isStrongPassword(password: string): boolean {
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return hasLower && hasUpper && hasNumber && hasSpecial && password.length >= 8;
} 