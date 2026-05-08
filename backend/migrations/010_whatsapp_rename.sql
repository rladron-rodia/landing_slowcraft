-- 010_whatsapp_rename.sql
-- Rename: 'contact.whatsapp_*' keys → 'whatsapp.*'.
-- Mueve también category 'contact' → 'whatsapp'.
-- Preserva cualquier value que el admin haya configurado.
-- Idempotente: si las keys ya están renombradas (segunda corrida), no hace nada.

-- Renombrar keys + category + actualizar labels/descriptions
UPDATE site_settings
   SET key = 'whatsapp.number',
       category = 'whatsapp',
       label = 'Número de WhatsApp · con código país',
       description = 'Formato internacional sin "+" ni espacios. Ejemplo MX: 521XXXXXXXXXX (52=país, 1=mobile, 10 dígitos del número). Si tenés WhatsApp Business, usá ese número.',
       placeholder = '521XXXXXXXXXX',
       display_order = 1,
       updated_at = NOW(),
       updated_by = 'migration-010'
 WHERE key = 'contact.whatsapp_number';

UPDATE site_settings
   SET key = 'whatsapp.message',
       category = 'whatsapp',
       label = 'Mensaje pre-llenado al abrir chat',
       description = 'Texto que aparece en el campo de mensaje cuando el usuario abre WhatsApp. URL-encoding automático.',
       placeholder = 'Hola Slowcraft, quisiera agendar una conversación.',
       display_order = 2,
       updated_at = NOW(),
       updated_by = 'migration-010'
 WHERE key = 'contact.whatsapp_message';

-- Insertar nuevos campos: etiqueta visible + modo de operación (futuro chatbot)
INSERT INTO site_settings (key, category, label, description, placeholder, display_order) VALUES
  ('whatsapp.business_label', 'whatsapp',
   'Etiqueta para mostrar (opcional)',
   'Nombre que aparece junto al número en algunos contextos (ej: "Slowcraft Strategy"). No afecta al envío del mensaje.',
   'Slowcraft', 3),
  ('whatsapp.mode', 'whatsapp',
   'Modo del CTA · "link" o "chatbot" (futuro)',
   'Por ahora solo "link" funciona (abre wa.me/N en pestaña nueva). "chatbot" se reserva para integrar widget custom + IA en futuras versiones.',
   'link', 4)
ON CONFLICT (key) DO NOTHING;
