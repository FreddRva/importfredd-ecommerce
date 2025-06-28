-- Esquema para el sistema de notificaciones

-- Tabla de notificaciones
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- order, payment, stock, security, admin
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data TEXT, -- JSON string con datos adicionales
    is_read BOOLEAN DEFAULT FALSE,
    is_admin BOOLEAN DEFAULT FALSE, -- true si es notificación de admin
    priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, urgent
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP, -- opcional, para notificaciones temporales
    read_at TIMESTAMP -- cuando fue leída
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_is_admin ON notifications(is_admin);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);

-- Tabla de preferencias de notificación
CREATE TABLE IF NOT EXISTS notification_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- order, payment, marketing, security
    email_enabled BOOLEAN DEFAULT TRUE,
    push_enabled BOOLEAN DEFAULT TRUE,
    in_app_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, type)
);

-- Índices para preferencias
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_type ON notification_preferences(type);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notification_preferences_updated_at 
    BEFORE UPDATE ON notification_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insertar preferencias por defecto para usuarios existentes
INSERT INTO notification_preferences (user_id, type, email_enabled, push_enabled, in_app_enabled)
SELECT 
    u.id,
    'order',
    TRUE,
    TRUE,
    TRUE
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM notification_preferences np 
    WHERE np.user_id = u.id AND np.type = 'order'
);

INSERT INTO notification_preferences (user_id, type, email_enabled, push_enabled, in_app_enabled)
SELECT 
    u.id,
    'payment',
    TRUE,
    TRUE,
    TRUE
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM notification_preferences np 
    WHERE np.user_id = u.id AND np.type = 'payment'
);

INSERT INTO notification_preferences (user_id, type, email_enabled, push_enabled, in_app_enabled)
SELECT 
    u.id,
    'marketing',
    TRUE,
    TRUE,
    TRUE
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM notification_preferences np 
    WHERE np.user_id = u.id AND np.type = 'marketing'
);

INSERT INTO notification_preferences (user_id, type, email_enabled, push_enabled, in_app_enabled)
SELECT 
    u.id,
    'security',
    TRUE,
    TRUE,
    TRUE
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM notification_preferences np 
    WHERE np.user_id = u.id AND np.type = 'security'
); 