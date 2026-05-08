-- 004_content_blocks.sql
-- CMS de contenido bilingüe: cada i18n_key se almacena con su valor ES y EN.
-- La landing fetchea /api/content y mergea sobre el diccionario hardcoded.

CREATE TABLE IF NOT EXISTS content_blocks (
  i18n_key       TEXT PRIMARY KEY,
  section        TEXT NOT NULL,                    -- agrupador para UI del admin: 'nav','hero','programs.p1', etc.
  field_label    TEXT,                              -- nombre legible para el admin: 'Headline', 'Item 1'
  value_es       TEXT NOT NULL,
  value_en       TEXT NOT NULL,
  value_type     TEXT NOT NULL DEFAULT 'text' CHECK (value_type IN ('text','html')),
  display_order  INT  NOT NULL DEFAULT 0,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by     TEXT
);

CREATE INDEX IF NOT EXISTS content_blocks_section_idx ON content_blocks(section, display_order);

-- Seed: re-ejecutable. ON CONFLICT DO NOTHING preserva ediciones del admin.
INSERT INTO content_blocks (i18n_key, section, field_label, value_es, value_en, value_type, display_order) VALUES
-- Nav
('nav.metodo',   'nav', 'Link Método',   'Método', 'Method', 'text', 1),
('nav.strategy', 'nav', 'Link Strategy', 'Strategy', 'Strategy', 'text', 2),
('nav.programs', 'nav', 'Link Programs', 'Programs', 'Programs', 'text', 3),
('nav.sobre',    'nav', 'Link Nosotros', 'Nosotros', 'About', 'text', 4),
('nav.cta',      'nav', 'CTA principal', 'Conversemos', 'Let''s talk', 'text', 5),

-- Hero
('hero.eyebrow',   'hero', 'Eyebrow', 'SLOWCRAFT · AI STRATEGY · MÉXICO', 'SLOWCRAFT · AI STRATEGY · MEXICO', 'text', 1),
('hero.h1',        'hero', 'Headline (admite <em>)', 'La IA es la mano derecha del <em>talento humano.</em>', 'AI is the right hand of <em>human talent.</em>', 'html', 2),
('hero.p',         'hero', 'Párrafo', 'Diseñamos los flujos donde tu equipo y la inteligencia artificial hacen lo que cada uno mejor sabe hacer. Sin reemplazos. Sin atajos. Con criterio.', 'We design the workflows where your team and artificial intelligence each do what they do best. No replacements. No shortcuts. With judgment.', 'text', 3),
('hero.cta',       'hero', 'Texto CTA', 'Agenda una conversación', 'Schedule a conversation', 'text', 4),
('hero.meta-text', 'hero', 'Meta texto', '"Estrategia AI, deliberadamente diseñada."', '"AI strategy, deliberately designed."', 'text', 5),

-- Tesis
('tesis.eyebrow', 'tesis', 'Eyebrow', '01 · NUESTRA TESIS', '01 · OUR THESIS', 'text', 1),
('tesis.h2',      'tesis', 'Headline (admite <em>)', 'La IA no reemplaza al humano. <em>Lo amplifica.</em> El humano no frena a la IA. La dirige. Slowcraft diseña esa colaboración.', 'AI does not replace humans. <em>It amplifies them.</em> Humans do not slow AI down. They steer it. Slowcraft designs that collaboration.', 'html', 2),
('tesis.b1',      'tesis', 'Bloque i.', 'La inteligencia artificial es el copiloto más poderoso que ha existido. Pero un copiloto sin un piloto que sepa hacia dónde va, no llega lejos.', 'AI is the most powerful copilot ever to exist. But a copilot without a pilot who knows where to go does not get far.', 'text', 3),
('tesis.b2',      'tesis', 'Bloque ii.', 'El error no es adoptar la IA tarde. Es adoptarla sin diseño. Las empresas que ganarán esta década son las que diseñaron mejor cómo trabajan con ella.', 'The mistake is not adopting AI late. It is adopting it without design. The companies that win this decade will be the ones that designed best how they work with it.', 'text', 4),
('tesis.b3',      'tesis', 'Bloque iii.', 'Tu equipo y la IA son tus dos recursos más valiosos. Nuestro trabajo es diseñar cómo se dan la mano para que ambos hagan lo que mejor saben hacer.', 'Your team and AI are your two most valuable resources. Our job is to design how they shake hands so each does what it does best.', 'text', 5),

-- Método
('metodo.eyebrow', 'metodo', 'Eyebrow', '02 · CÓMO TRABAJAMOS', '02 · HOW WE WORK', 'text', 1),
('metodo.h2',      'metodo', 'Headline', 'Tres fases. Una arquitectura. Resultados medibles.', 'Three phases. One architecture. Measurable results.', 'text', 2),
('metodo.f1.h',    'metodo', 'Fase 1 · título', 'Diagnóstico', 'Diagnostic', 'text', 3),
('metodo.f1.p',    'metodo', 'Fase 1 · descripción', 'Mapeamos cómo trabaja hoy tu empresa. Identificamos dónde la IA puede ser un copiloto poderoso para tu equipo — y dónde es mejor no tocar nada todavía.', 'We map how your company works today. We identify where AI can be a powerful copilot for your team — and where it is best not to touch anything yet.', 'text', 4),
('metodo.f2.h',    'metodo', 'Fase 2 · título', 'Arquitectura', 'Architecture', 'text', 5),
('metodo.f2.p',    'metodo', 'Fase 2 · descripción', 'Diseñamos los flujos humano–IA con propósito. Definimos qué hace mejor la máquina, qué hace mejor la persona, y cómo se complementan en cada paso.', 'We design human–AI workflows with intent. We define what the machine does best, what the person does best, and how they complement each other at every step.', 'text', 6),
('metodo.f3.h',    'metodo', 'Fase 3 · título', 'Implementación', 'Implementation', 'text', 7),
('metodo.f3.p',    'metodo', 'Fase 3 · descripción', 'Integramos las herramientas correctas, capacitamos al equipo, y medimos resultados reales. Nos quedamos hasta que el sistema funciona en sintonía.', 'We integrate the right tools, train the team, and measure real results. We stay until the system runs in sync.', 'text', 8),

-- Servicios
('serv.eyebrow', 'servicios', 'Eyebrow', '03 · STRATEGY', '03 · STRATEGY', 'text', 1),
('serv.h2',      'servicios', 'Headline', 'Engagements de arquitectura.', 'Architecture engagements.', 'text', 2),
('serv.intro',   'servicios', 'Intro', 'Para empresas que quieren repensar cómo trabajan con IA. Proyectos transformacionales, con alcance abierto al diagnóstico. Tres tipos.', 'For companies that want to rethink how they work with AI. Transformational projects with scope open to discovery. Three types.', 'text', 3),
('serv.s1.h',    'servicios', 'Servicio 1 · título', 'AI Readiness', 'AI Readiness', 'text', 4),
('serv.s1.p',    'servicios', 'Servicio 1 · descripción', 'Diagnóstico estratégico para empresas que quieren entrar bien a la era de IA. Sin desperdiciar capital ni tiempo.', 'Strategic diagnostic for companies that want to enter the AI era well — without wasting capital or time.', 'text', 5),
('serv.s1.li1',  'servicios', 'Servicio 1 · ítem 1', 'Audit de procesos actuales', 'Audit of current processes', 'text', 6),
('serv.s1.li2',  'servicios', 'Servicio 1 · ítem 2', 'Roadmap de adopción 12 meses', '12-month adoption roadmap', 'text', 7),
('serv.s1.li3',  'servicios', 'Servicio 1 · ítem 3', 'Business case por iniciativa', 'Business case per initiative', 'text', 8),
('serv.s1.li4',  'servicios', 'Servicio 1 · ítem 4', 'Plan de capacitación interna', 'Internal training plan', 'text', 9),
('serv.s2.h',    'servicios', 'Servicio 2 · título', 'Workflow Architecture', 'Workflow Architecture', 'text', 10),
('serv.s2.p',    'servicios', 'Servicio 2 · descripción', 'Diseño detallado de flujos humano–IA para áreas críticas: marketing, operaciones, ventas, atención al cliente.', 'Detailed design of human–AI workflows for critical areas: marketing, operations, sales, customer service.', 'text', 11),
('serv.s2.li1',  'servicios', 'Servicio 2 · ítem 1', 'Mapeo de tareas humano + IA', 'Human + AI task mapping', 'text', 12),
('serv.s2.li2',  'servicios', 'Servicio 2 · ítem 2', 'Selección de herramientas', 'Tool selection', 'text', 13),
('serv.s2.li3',  'servicios', 'Servicio 2 · ítem 3', 'Diseño de handoffs', 'Handoff design', 'text', 14),
('serv.s2.li4',  'servicios', 'Servicio 2 · ítem 4', 'Métricas y guardrails', 'Metrics and guardrails', 'text', 15),
('serv.s3.h',    'servicios', 'Servicio 3 · título', 'Implementation Partner', 'Implementation Partner', 'text', 16),
('serv.s3.p',    'servicios', 'Servicio 3 · descripción', 'Acompañamos la implementación end-to-end. Nos quedamos hasta que el sistema funciona y el equipo lo opera con confianza.', 'We support implementation end-to-end. We stay until the system works and the team operates it with confidence.', 'text', 17),
('serv.s3.li1',  'servicios', 'Servicio 3 · ítem 1', 'Integración técnica', 'Technical integration', 'text', 18),
('serv.s3.li2',  'servicios', 'Servicio 3 · ítem 2', 'Training del equipo', 'Team training', 'text', 19),
('serv.s3.li3',  'servicios', 'Servicio 3 · ítem 3', 'Iteración basada en datos', 'Data-driven iteration', 'text', 20),
('serv.s3.li4',  'servicios', 'Servicio 3 · ítem 4', 'Handoff documentado', 'Documented handoff', 'text', 21),

-- Programs (header + 4 cards)
('prog.eyebrow',         'programs.head', 'Eyebrow',           '04 · PROGRAMS', '04 · PROGRAMS', 'text', 1),
('prog.h2',              'programs.head', 'Headline (admite <em>)', 'Productos modulares con <em>objetivos específicos.</em>', 'Modular products with <em>specific goals.</em>', 'html', 2),
('prog.bridge',          'programs.head', 'Texto puente',      'Aplicaciones modulares de la tesis Slowcraft, cada una con un objetivo específico. Los módulos se activan según la madurez del cliente.', 'Modular applications of the Slowcraft thesis, each with a specific objective. Modules are activated according to the client''s maturity.', 'text', 3),
('prog.label.parawho',   'programs.head', 'Label "Para quién"','PARA QUIÉN', 'WHO IT IS FOR', 'text', 4),

('prog.p1.h',     'programs.p1', 'Título',     'Founder OS', 'Founder OS', 'text', 1),
('prog.p1.pitch', 'programs.p1', 'Pitch',      'El sistema operativo de tu startup, diseñado desde el día uno con IA adentro.', 'The operating system for your startup, designed from day one with AI inside.', 'text', 2),
('prog.p1.who',   'programs.p1', 'Para quién', 'Founders y emprendedores arrancando su startup, o empresas con trayectoria reinventando cómo operan.', 'Founders and entrepreneurs starting their startup, or established companies reinventing how they operate.', 'text', 3),
('prog.p1.m1',    'programs.p1', 'Módulo 1',   'Brand Book de Marca', 'Brand Book', 'text', 4),
('prog.p1.m2',    'programs.p1', 'Módulo 2',   'Sistema de diseño · Gobernanza visual', 'Design system · Visual governance', 'text', 5),
('prog.p1.m3',    'programs.p1', 'Módulo 3',   'Oficina Digital · Gobernanza de información', 'Digital Office · Information governance', 'text', 6),
('prog.p1.m4',    'programs.p1', 'Módulo 4',   'Integración de herramientas IA', 'AI tools integration', 'text', 7),
('prog.p1.m5',    'programs.p1', 'Módulo 5',   'KPIs y dashboard de negocio', 'Business KPIs and dashboard', 'text', 8),
('prog.p1.m6',    'programs.p1', 'Módulo 6',   'Vibe Coding (exclusivo startups)', 'Vibe Coding (startups only)', 'text', 9),
('prog.p1.note',  'programs.p1', 'Nota',       'Módulos activados según madurez del cliente.', 'Modules activated according to client maturity.', 'text', 10),

('prog.p2.h',     'programs.p2', 'Título',     'Site Performance Lab', 'Site Performance Lab', 'text', 1),
('prog.p2.pitch', 'programs.p2', 'Pitch',      'Cada segundo que tarda tu sitio, pierdes una conversión.', 'Every second your site takes, you lose a conversion.', 'text', 2),
('prog.p2.who',   'programs.p2', 'Para quién', 'CEOs, CTOs, CMOs, Marketing y Digital Managers, Ecommerce Directors, agencias.', 'CEOs, CTOs, CMOs, Marketing and Digital Managers, Ecommerce Directors, agencies.', 'text', 3),
('prog.p2.m1',    'programs.p2', 'Módulo 1',   'Auditoría técnica y estratégica', 'Technical and strategic audit', 'text', 4),
('prog.p2.m2',    'programs.p2', 'Módulo 2',   'Core Web Vitals · LCP, INP, CLS', 'Core Web Vitals · LCP, INP, CLS', 'text', 5),
('prog.p2.m3',    'programs.p2', 'Módulo 3',   'SEO técnico · Lighthouse', 'Technical SEO · Lighthouse', 'text', 6),
('prog.p2.m4',    'programs.p2', 'Módulo 4',   'Plan de acción priorizado', 'Prioritized action plan', 'text', 7),
('prog.p2.m5',    'programs.p2', 'Módulo 5',   'Implementación de mejoras', 'Improvements implementation', 'text', 8),
('prog.p2.m6',    'programs.p2', 'Módulo 6',   'Modelo de medición adhoc · Mejora continua', 'Custom measurement model · Continuous improvement', 'text', 9),
('prog.p2.note',  'programs.p2', 'Nota',       'Alcance se define con base en la auditoría inicial.', 'Scope is defined based on the initial audit.', 'text', 10),

('prog.p3.h',     'programs.p3', 'Título',     'Conversion Architecture', 'Conversion Architecture', 'text', 1),
('prog.p3.pitch', 'programs.p3', 'Pitch',      'Si te encuentran pero tu sitio no convierte, no funciona.', 'If they find you but your site doesn''t convert, it doesn''t work.', 'text', 2),
('prog.p3.who',   'programs.p3', 'Para quién', 'CEOs, CTOs, CMOs, Marketing y Digital Managers, Ecommerce Directors, agencias.', 'CEOs, CTOs, CMOs, Marketing and Digital Managers, Ecommerce Directors, agencies.', 'text', 3),
('prog.p3.m1',    'programs.p3', 'Módulo 1',   'Auditoría UX/UI', 'UX/UI audit', 'text', 4),
('prog.p3.m2',    'programs.p3', 'Módulo 2',   'Mapas de calor y session recordings', 'Heatmaps and session recordings', 'text', 5),
('prog.p3.m3',    'programs.p3', 'Módulo 3',   'Customer journey y customer persona', 'Customer journey and persona', 'text', 6),
('prog.p3.m4',    'programs.p3', 'Módulo 4',   'Rediseño de paths de conversión', 'Conversion path redesign', 'text', 7),
('prog.p3.m5',    'programs.p3', 'Módulo 5',   'A/B testing', 'A/B testing', 'text', 8),
('prog.p3.m6',    'programs.p3', 'Módulo 6',   'Modelo de medición adhoc · Mejora continua', 'Custom measurement model · Continuous improvement', 'text', 9),
('prog.p3.note',  'programs.p3', 'Nota',       'Profundidad según volumen de tráfico y madurez analítica.', 'Depth depends on traffic volume and analytical maturity.', 'text', 10),

('prog.p4.h',     'programs.p4', 'Título',     'Studio Automation', 'Studio Automation', 'text', 1),
('prog.p4.pitch', 'programs.p4', 'Pitch',      'Produces mucho y rentabilizas poco. Automatiza la operación.', 'You produce a lot and monetize little. Automate operations.', 'text', 2),
('prog.p4.who',   'programs.p4', 'Para quién', 'Owners, CEOs, CMOs, Marketing y Brand Managers, agencias, internal hubs.', 'Owners, CEOs, CMOs, Marketing and Brand Managers, agencies, internal hubs.', 'text', 3),
('prog.p4.m1',    'programs.p4', 'Módulo 1',   'Auditoría del ecosistema de comunicación', 'Communication ecosystem audit', 'text', 4),
('prog.p4.m2',    'programs.p4', 'Módulo 2',   'Integración n8n / Make', 'n8n / Make integration', 'text', 5),
('prog.p4.m3',    'programs.p4', 'Módulo 3',   'Email marketing · CRM · Chatbots', 'Email marketing · CRM · Chatbots', 'text', 6),
('prog.p4.m4',    'programs.p4', 'Módulo 4',   'Agentes IA en flujos de producción', 'AI agents in production flows', 'text', 7),
('prog.p4.m5',    'programs.p4', 'Módulo 5',   'Aseguramiento de procesos del equipo', 'Team process assurance', 'text', 8),
('prog.p4.m6',    'programs.p4', 'Módulo 6',   'Modelo de medición adhoc · Mejora continua', 'Custom measurement model · Continuous improvement', 'text', 9),
('prog.p4.note',  'programs.p4', 'Nota',       'Stack se elige sobre las herramientas que ya use el cliente.', 'Stack is chosen on top of the tools the client already uses.', 'text', 10),

-- Principios
('pri.eyebrow', 'principios', 'Eyebrow',    '05 · PRINCIPIOS', '05 · PRINCIPLES', 'text', 1),
('pri.h2',      'principios', 'Headline',   'Cinco cosas en las que sí creemos.', 'Five things we do believe in.', 'text', 2),
('pri.1.h',     'principios', 'Pri 1 · h',  'Diseñar antes de implementar.', 'Design before implementing.', 'text', 3),
('pri.1.p',     'principios', 'Pri 1 · p',  'No instalamos herramientas. Arquitectamos cómo trabaja una organización con sus dos recursos más valiosos.', 'We do not install tools. We architect how an organization works with its two most valuable resources.', 'text', 4),
('pri.2.h',     'principios', 'Pri 2 · h',  'La IA es el copiloto. El humano dirige.', 'AI is the copilot. The human steers.', 'text', 5),
('pri.2.p',     'principios', 'Pri 2 · p',  'Cada uno hace lo que mejor sabe hacer. Diseñar bien esa colaboración es lo que define el resultado.', 'Each does what it does best. Designing that collaboration well is what defines the outcome.', 'text', 6),
('pri.3.h',     'principios', 'Pri 3 · h',  'Claridad sobre complejidad.', 'Clarity over complexity.', 'text', 7),
('pri.3.p',     'principios', 'Pri 3 · p',  'Si no podemos explicarlo en una frase, no lo hemos entendido todavía.', 'If we can''t explain it in one sentence, we haven''t understood it yet.', 'text', 8),
('pri.4.h',     'principios', 'Pri 4 · h',  'Resultados, no demos.', 'Results, not demos.', 'text', 9),
('pri.4.p',     'principios', 'Pri 4 · p',  'Vendemos cambios medibles, no presentaciones bonitas.', 'We sell measurable changes, not pretty presentations.', 'text', 10),
('pri.5.h',     'principios', 'Pri 5 · h',  'Inteligencia con criterio.', 'Intelligence with judgment.', 'text', 11),
('pri.5.p',     'principios', 'Pri 5 · p',  'La IA propone alternativas. El equipo decide cuáles amplificar. Esa es la combinación ganadora.', 'AI proposes alternatives. The team decides which to amplify. That is the winning combination.', 'text', 12),

-- Sobre
('sobre.eyebrow',         'sobre', 'Eyebrow',           '06 · NOSOTROS', '06 · ABOUT', 'text', 1),
('sobre.h2',              'sobre', 'Headline (admite <em>)', 'Slowcraft es una consultora boutique con base en <em>Ciudad de México.</em>', 'Slowcraft is a boutique consulting firm based in <em>Mexico City.</em>', 'html', 2),
('sobre.p1',              'sobre', 'Párrafo 1', 'Nacimos en 2026 con una convicción simple: la IA es la oportunidad más grande de esta década, pero la mayoría de las empresas la están adoptando mal. Sin diseño, sin criterio, sin un plan que considere a las personas que la van a usar día con día.', 'We were born in 2026 with a simple conviction: AI is the biggest opportunity of this decade, but most companies are adopting it badly. Without design, without judgment, without a plan that considers the people who will use it every day.', 'text', 3),
('sobre.p2',              'sobre', 'Párrafo 2', 'Trabajamos con CEOs y líderes de empresas en crecimiento que quieren entrar a esta era con cabeza. No vendemos hype, no prometemos atajos. Diseñamos los flujos donde el talento humano y la IA hacen lo que cada uno mejor sabe hacer — porque esa es la única forma de generar ventaja real y sostenida.', 'We work with CEOs and leaders of growing companies who want to enter this era with their head on straight. We don''t sell hype, we don''t promise shortcuts. We design the workflows where human talent and AI each do what they do best — because that''s the only way to generate real, sustained advantage.', 'text', 4),
('sobre.meta.fundado',    'sobre', 'Meta · Fundado label',   'FUNDADO', 'FOUNDED', 'text', 5),
('sobre.meta.base',       'sobre', 'Meta · Base label',      'BASE', 'BASE', 'text', 6),
('sobre.meta.alcance',    'sobre', 'Meta · Alcance label',   'ALCANCE', 'REACH', 'text', 7),
('sobre.meta.alcance.v',  'sobre', 'Meta · Alcance valor',   'LATAM · Global', 'LATAM · Global', 'text', 8),

-- CTA final
('cta.h2', 'cta', 'Headline (admite <em>)', 'Diseñemos juntos cómo trabaja tu empresa <em>con IA.</em>', 'Let''s design together how your company works <em>with AI.</em>', 'html', 1),
('cta.p',  'cta', 'Párrafo',                'Agenda una conversación de 30 minutos. Sin pitch, sin presentación. Solo una charla honesta sobre dónde está tu empresa y cómo podríamos ayudarte.', 'Schedule a 30-minute conversation. No pitch, no presentation. Just an honest chat about where your company stands and how we could help.', 'text', 2),

-- Formulario
('form.l.nombre',         'form', 'Label · Nombre',        'Nombre completo', 'Full name', 'text', 1),
('form.ph.nombre',        'form', 'Placeholder · Nombre',  'Ada Lovelace', 'Ada Lovelace', 'text', 2),
('form.l.email',          'form', 'Label · Email',         'Email empresa', 'Work email', 'text', 3),
('form.ph.email',         'form', 'Placeholder · Email',   'ada@empresa.com', 'ada@company.com', 'text', 4),
('form.l.cargo',          'form', 'Label · Cargo',         'Cargo / posición', 'Role / position', 'text', 5),
('form.ph.cargo',         'form', 'Placeholder · Cargo',   'CEO, COO, Head of Operations…', 'CEO, COO, Head of Operations…', 'text', 6),
('form.l.web',            'form', 'Label · Web',           'www de la empresa', 'Company website', 'text', 7),
('form.ph.web',           'form', 'Placeholder · Web',     'empresa.com', 'company.com', 'text', 8),
('form.l.motivo',         'form', 'Label · Motivo',        'Motivo de contacto', 'Reason for contact', 'text', 9),
('form.opt.placeholder',  'form', 'Select · placeholder',  'Selecciona un motivo', 'Select a reason', 'text', 10),
('form.opt.proyectos',    'form', 'Opción · Proyectos',    'Proyectos', 'Projects', 'text', 11),
('form.opt.informes',     'form', 'Opción · Informes',     'Informes', 'Inquiries', 'text', 12),
('form.opt.bolsa',        'form', 'Opción · Bolsa',        'Bolsa de trabajo', 'Job openings', 'text', 13),
('form.l.desc',           'form', 'Label · Descripción',   'Descripción', 'Description', 'text', 14),
('form.ph.desc',          'form', 'Placeholder · Desc',    'Cuéntanos brevemente sobre tu empresa, el contexto y qué te gustaría explorar.', 'Briefly tell us about your company, the context, and what you would like to explore.', 'text', 15),
('form.submit',           'form', 'Botón · Enviar',        'Enviar mensaje', 'Send message', 'text', 16),
('form.submit.loading',   'form', 'Botón · Cargando',      'Enviando…', 'Sending…', 'text', 17),
('form.disclaimer',       'form', 'Disclaimer',            'Respondemos en máximo 48h hábiles. Tu información es confidencial y solo la usamos para responder tu consulta.', 'We reply within 48 business hours. Your information is confidential and used only to respond to your inquiry.', 'text', 18),
('form.alt.divider',      'form', 'Divider "o"',           'o', 'or', 'text', 19),
('form.whatsapp',         'form', 'Botón · WhatsApp',      'Contáctanos por WhatsApp', 'Contact us on WhatsApp', 'text', 20),

-- Footer
('footer.tagline',     'footer', 'Tagline',                'Estrategia AI, deliberadamente diseñada. La mano derecha del talento humano.', 'AI strategy, deliberately designed. The right hand of human talent.', 'text', 1),
('footer.col.nav',     'footer', 'Título columna · Nav',   'Navegación', 'Navigation', 'text', 2),
('footer.col.contact', 'footer', 'Título columna · Contacto', 'Contacto', 'Contact', 'text', 3),
('footer.copy',        'footer', 'Copyright',              '© 2026 Slowcraft. Diseñado con criterio en Ciudad de México.', '© 2026 Slowcraft. Designed with judgment in Mexico City.', 'text', 4)

ON CONFLICT (i18n_key) DO NOTHING;
