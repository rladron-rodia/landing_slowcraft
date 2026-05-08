-- 009_contact_settings.sql
-- Settings de contacto: WhatsApp + redes sociales (administrables desde el admin).
-- La landing los lee en /api/content y arma los links/CTAs dinámicamente.

INSERT INTO site_settings (key, category, label, description, placeholder, display_order) VALUES
  ('contact.whatsapp_number', 'contact',
   'WhatsApp · Número con código país',
   'Número en formato internacional sin "+" ni espacios. Ejemplo MX: 521XXXXXXXXXX (52=país, 1=mobile, 10 dígitos).',
   '521XXXXXXXXXX', 1),
  ('contact.whatsapp_message', 'contact',
   'WhatsApp · Mensaje pre-llenado',
   'Mensaje que aparece cuando se abre el chat (URL-encoded NO necesario, lo hacemos automático).',
   'Hola Slowcraft, quisiera agendar una conversación.', 2),
  ('social.linkedin_url', 'social',
   'LinkedIn · URL de la empresa',
   'URL completa del perfil de LinkedIn de Slowcraft. Si está vacío, el link se oculta del footer.',
   'https://linkedin.com/company/slowcraft', 1),
  ('social.twitter_url', 'social',
   'Twitter / X · URL del perfil',
   'URL completa del perfil. Si está vacío, el link se oculta del footer.',
   'https://twitter.com/slowcraft_ai', 2),
  ('social.instagram_url', 'social',
   'Instagram · URL del perfil',
   'URL completa del perfil. Si está vacío, no se muestra.',
   'https://instagram.com/slowcraft', 3)
ON CONFLICT (key) DO NOTHING;
