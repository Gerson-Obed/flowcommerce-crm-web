import type {
  ActivityItem,
  AiSettings,
  AppNotification,
  Conversation,
  Customer,
  Lead,
  LeadSource,
  LeadStatus,
  Message,
  Note,
  Product,
  Quote,
  User,
} from '@/types/domain'

/* Datos de ejemplo en memoria. Se usan solo cuando VITE_USE_MOCKS=true. */

const HOUR = 3_600_000
const DAY = 24 * HOUR
const now = Date.now()
const ago = (ms: number) => new Date(now - ms).toISOString()
const inFuture = (ms: number) => new Date(now + ms).toISOString()

export const currentUser: User = {
  id: 'u1',
  name: 'Mariana Ruiz',
  email: 'mariana@flowcommerce.com',
  role: 'asesor',
  roleLabel: 'Asesora comercial',
  phone: '+502 5512 7090',
}

export const team: User[] = [
  currentUser,
  { id: 'u2', name: 'Javier Soto', email: 'javier@flowcommerce.com', role: 'asesor', roleLabel: 'Asesor comercial' },
  { id: 'u3', name: 'Luis Ovalle', email: 'luis@flowcommerce.com', role: 'supervisor', roleLabel: 'Supervisor de ventas' },
  { id: 'u4', name: 'Andrea Morales', email: 'andrea@flowcommerce.com', role: 'admin', roleLabel: 'Administradora' },
]

/* ───────────── Leads ───────────── */

const people: Array<[string, string, LeadSource]> = [
  ['Andrea López', 'Constructora Nova', 'web'],
  ['Carlos Méndez', 'Grupo Atlas', 'referido'],
  ['Sofía Ramírez', 'Soluciones GT', 'whatsapp'],
  ['Daniel Herrera', 'Corporación Central', 'facebook'],
  ['Gabriela Pérez', 'Inversiones Tikal', 'instagram'],
  ['Rodrigo Castillo', 'Transportes Quetzal', 'llamada'],
  ['Lucía Morales', 'Agro Xelajú', 'whatsapp'],
  ['Estuardo Cárdenas', 'Clínicas Vida', 'web'],
  ['Mónica Aguilar', 'Textiles del Valle', 'referido'],
  ['Pablo Girón', 'Logística Maya', 'whatsapp'],
  ['Karla Orozco', 'Café Antigua Export', 'web'],
  ['Héctor Barrios', 'Ferretería El Roble', 'llamada'],
  ['Ana Lucía Paz', 'Hotel Atitlán', 'instagram'],
  ['Marcos Tzoc', 'Muebles Chichi', 'whatsapp'],
  ['Valeria Díaz', 'Farmacias Sur', 'facebook'],
  ['Jorge Sandoval', 'Eco Plásticos', 'web'],
  ['Paola Reyes', 'Academia Digital GT', 'referido'],
  ['Iván Choc', 'Taller Industrial Z12', 'llamada'],
  ['Diana Cabrera', 'Seguros Patria', 'web'],
  ['Óscar Monzón', 'Agroinsumos Petén', 'whatsapp'],
  ['Rebeca Lemus', 'Bienes Raíces Cayalá', 'instagram'],
  ['Fernando Ruiz', 'Autos del Pacífico', 'facebook'],
  ['Silvia Gómez', 'Panificadora La Espiga', 'otro'],
  ['Mario Ajú', 'Importadora Kaibil', 'referido'],
]

const statuses: LeadStatus[] = [
  'negociacion',
  'cotizacion',
  'seguimiento',
  'nuevo',
  'contactado',
  'ganado',
  'perdido',
  'cotizacion',
]

const slug = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.|\.$/g, '')

export const leads: Lead[] = people.map(([name, company, source], i) => {
  const owner = team[i % team.length]
  const status = statuses[i % statuses.length]
  return {
    id: `l${i + 1}`,
    name,
    company,
    email: `${slug(name.split(' ')[0])}.${slug(name.split(' ').slice(-1)[0])}@${slug(company).replace(/\./g, '')}.gt`,
    phone: `+502 5${(541 + i * 37) % 1000} ${String(2200 + i * 311).slice(-4)}`,
    status,
    source,
    ownerId: owner.id,
    ownerName: owner.name,
    value: [28500, 12750, 9200, 6400, 4800, 31200, 8600, 15400][i % 8] + i * 150,
    lastContactAt: i % 7 === 3 ? null : ago((i + 1) * 5 * HOUR),
    nextFollowUpAt: ['ganado', 'perdido'].includes(status)
      ? null
      : inFuture(((i % 5) + 1) * DAY + (i % 3) * 2 * HOUR),
    createdAt: ago((i + 3) * 2 * DAY),
  }
})

/* ───────────── Conversaciones ───────────── */

const convoSeed: Array<{
  leadIdx: number
  channel: Conversation['channel']
  unread: number
  ai: boolean
  thread: Array<['lead' | 'agent' | 'ai', string]>
}> = [
  {
    leadIdx: 0,
    channel: 'whatsapp',
    unread: 2,
    ai: true,
    thread: [
      ['lead', 'Hola, buenas tardes. Vi su página y me interesa el CRM para mi equipo de ventas.'],
      ['ai', 'Hola Andrea, gracias por escribirnos. Con gusto te ayudo. ¿Cuántas personas conforman tu equipo comercial?'],
      ['lead', 'Somos 5 asesores. ¿Se puede integrar con WhatsApp Business?'],
      ['agent', 'Sí, la integración con WhatsApp Business está incluida en el plan Pro. Te comparto los detalles.'],
      ['lead', '¿Cuál es el precio y cuánto tardan en implementarlo?'],
    ],
  },
  {
    leadIdx: 1,
    channel: 'email',
    unread: 1,
    ai: false,
    thread: [
      ['agent', 'Carlos, adjunto la cotización COT-0238 con las condiciones que conversamos.'],
      ['lead', 'Gracias Mariana. ¿Podrían mejorar el descuento si cerramos esta semana?'],
    ],
  },
  {
    leadIdx: 2,
    channel: 'whatsapp',
    unread: 0,
    ai: true,
    thread: [
      ['lead', 'Buen día, necesito agendar la demo que me ofrecieron.'],
      ['ai', 'Buen día Sofía. Tenemos espacio el jueves a las 10:00 o el viernes a las 15:00. ¿Cuál te acomoda?'],
      ['lead', 'El jueves a las 10:00 está perfecto.'],
      ['ai', 'Listo, quedó agendada tu demo para el jueves a las 10:00. Te enviaremos el enlace por correo.'],
    ],
  },
  {
    leadIdx: 4,
    channel: 'instagram',
    unread: 3,
    ai: true,
    thread: [
      ['lead', 'Hola! Me interesa saber si manejan reportes de ventas por asesor'],
      ['lead', 'Y si pueden mostrarme cómo se ve el tablero'],
      ['lead', 'Quedo atenta 🙌'],
    ],
  },
  {
    leadIdx: 5,
    channel: 'facebook',
    unread: 0,
    ai: false,
    thread: [
      ['lead', 'Buenas, ¿ofrecen capacitación al equipo?'],
      ['agent', 'Sí Rodrigo, incluimos 8 horas de capacitación para tu equipo comercial.'],
    ],
  },
  {
    leadIdx: 7,
    channel: 'web',
    unread: 1,
    ai: true,
    thread: [['lead', 'Quisiera una propuesta para 12 usuarios en nuestras clínicas.']],
  },
]

export const conversations: Conversation[] = []
export const messages: Message[] = []

convoSeed.forEach((c, i) => {
  const lead = leads[c.leadIdx]
  const id = `c${i + 1}`
  const total = c.thread.length
  c.thread.forEach(([author, text], j) => {
    messages.push({
      id: `m${i + 1}-${j + 1}`,
      conversationId: id,
      author,
      authorName: author === 'lead' ? lead.name : author === 'ai' ? 'Asistente IA' : lead.ownerName,
      text,
      createdAt: ago((total - j) * 22 * 60_000 + i * HOUR),
    })
  })
  const last = c.thread[total - 1]
  conversations.push({
    id,
    leadId: lead.id,
    contactName: lead.name,
    company: lead.company,
    channel: c.channel,
    lastMessage: last[1],
    lastMessageAt: ago(i * HOUR + 12 * 60_000),
    unread: c.unread,
    aiEnabled: c.ai,
  })
})

export const aiSettings: AiSettings = {
  enabled: true,
  autoReply: false,
  tone: 'cercano',
  businessHoursOnly: true,
  handoffKeywords: ['precio especial', 'reclamo', 'hablar con un asesor'],
  instructions:
    'Eres el asistente comercial de FlowCommerce. Responde en español, con claridad y amabilidad. Si el cliente pide descuentos o contratos, deriva la conversación a un asesor.',
}

/* ───────────── Clientes ───────────── */

export const customers: Customer[] = [
  ['Distribuidora Altamira, S.A.', '1234567-8', 'Luis Herrera', 'Gerente de Ventas', 'lherrera@altamira.com.gt', '5a. Avenida 10-45, Zona 9, Guatemala', 92500, 4],
  ['Constructora Nova', '2345678-9', 'Andrea López', 'Directora Comercial', 'andrea.lopez@nova.gt', '12 Calle 3-20, Zona 10, Guatemala', 28500, 2],
  ['Grupo Atlas', '3456789-0', 'Carlos Méndez', 'Gerente General', 'cmendez@grupoatlas.com', 'Blvd. Los Próceres 18-00, Zona 10', 61200, 3],
  ['Inversiones Tikal', '4567890-1', 'Gabriela Pérez', 'Jefa de Operaciones', 'gperez@tikal.com.gt', '7a. Avenida 5-10, Zona 4, Guatemala', 18300, 1],
  ['Transportes Quetzal', '5678901-2', 'Rodrigo Castillo', 'Propietario', 'rcastillo@tquetzal.gt', 'Km 14.5 Carretera a El Salvador', 41000, 2],
  ['Agro Xelajú', '6789012-3', 'Lucía Morales', 'Administradora', 'lucia@agroxelaju.gt', '4a. Calle 8-32, Zona 1, Quetzaltenango', 12750, 1],
  ['Clínicas Vida', '7890123-4', 'Estuardo Cárdenas', 'Director Administrativo', 'ecardenas@clinicasvida.gt', '6a. Avenida 12-18, Zona 14, Guatemala', 74800, 5],
].map(([name, nit, contactName, contactRole, email, address, totalSold, quotesCount], i) => ({
  id: `cu${i + 1}`,
  name: name as string,
  nit: nit as string,
  contactName: contactName as string,
  contactRole: contactRole as string,
  email: email as string,
  phone: `+502 ${2300 + i * 117} ${String(1000 + i * 733).slice(-4)}`,
  address: address as string,
  ownerName: team[i % team.length].name,
  status: i === 5 ? ('inactivo' as const) : ('activo' as const),
  totalSold: totalSold as number,
  quotesCount: quotesCount as number,
  averageTicket: Math.round((totalSold as number) / Math.max(1, (quotesCount as number) - (i % 2))),
  lastActivityAt: ago((i * 2 + 1) * DAY + 3 * HOUR),
  createdAt: ago((i + 4) * 9 * DAY),
}))

/* ───────────── Productos y servicios ───────────── */

export const products: Product[] = [
  { id: 'p1', category: 'Licencias', sku: 'LIC-PRO', name: 'Licencia FlowCommerce CRM · Plan Pro (12 meses)', kind: 'servicio', description: 'Licencia anual por usuario con todos los módulos.', unitPrice: 1850, active: true },
  { id: 'p2', category: 'Licencias', sku: 'LIC-STD', name: 'Licencia FlowCommerce CRM · Plan Estándar (12 meses)', kind: 'servicio', description: 'Leads, cotizaciones y clientes.', unitPrice: 1250, active: true },
  { id: 'p3', category: 'Implementación', sku: 'IMP-MIG', name: 'Implementación y migración de datos', kind: 'servicio', description: 'Configuración inicial y carga de información existente.', unitPrice: 4500, active: true },
  { id: 'p4', category: 'Capacitación', sku: 'CAP-08H', name: 'Capacitación para equipo comercial (8 h)', kind: 'servicio', description: 'Sesiones en vivo para el equipo de ventas.', unitPrice: 2400, active: true },
  { id: 'p5', category: 'Integraciones', sku: 'INT-WA', name: 'Integración con WhatsApp Business', kind: 'servicio', description: 'Conexión de número oficial y bandeja unificada.', unitPrice: 2300, active: true },
  { id: 'p6', category: 'Integraciones', sku: 'INT-IA', name: 'Módulo de respuestas con IA', kind: 'servicio', description: 'Sugerencias y respuestas automáticas configurables.', unitPrice: 3100, active: true },
  { id: 'p7', category: 'Soporte', sku: 'SOP-PRM', name: 'Soporte premium (12 meses)', kind: 'servicio', description: 'Atención prioritaria y asesor dedicado.', unitPrice: 3600, active: false },
]

/* ───────────── Cotizaciones ───────────── */

function makeQuote(
  n: number,
  customerIdx: number,
  status: Quote['status'],
  lines: Array<[string, number]>,
  discount = 0,
  ai = false,
): Quote {
  const c = customers[customerIdx]
  const items = lines.map(([pid, qty], i) => {
    const p = products.find((x) => x.id === pid)!
    return {
      id: `qi${n}-${i + 1}`,
      productId: p.id,
      description: p.name,
      quantity: qty,
      unitPrice: p.unitPrice,
      amount: qty * p.unitPrice,
    }
  })
  const subtotal = items.reduce((a, b) => a + b.amount, 0)
  return {
    id: `q${n}`,
    folio: `COT-${String(n).padStart(4, '0')}`,
    status,
    customerId: c.id,
    customerName: c.name,
    contactName: c.contactName,
    advisorName: team[n % team.length].name,
    currency: 'GTQ',
    issuedAt: ago((241 - n) * 0.9 * DAY),
    validUntil: inFuture((n % 6) * DAY + DAY),
    items,
    subtotal,
    discount,
    total: subtotal - discount,
    conditions:
      'Forma de pago: 50% anticipo y 50% contra entrega.\nTiempo de implementación: 3 semanas.\nPrecios incluyen IVA.',
    notes: 'Incluye capacitación presencial para el equipo y 3 meses de soporte prioritario sin costo adicional.',
    aiGenerated: ai,
    reviewRequired: ai && status === 'pendiente',
  }
}

export const quotes: Quote[] = [
  makeQuote(242, 1, 'pendiente', [['p1', 12], ['p3', 1], ['p4', 1]], 1500, true),
  makeQuote(241, 0, 'enviada', [['p1', 5], ['p3', 1], ['p4', 1], ['p5', 1]]),
  makeQuote(240, 1, 'pendiente', [['p2', 4], ['p3', 1]]),
  makeQuote(239, 6, 'aprobada', [['p1', 12], ['p3', 1], ['p4', 2]], 1500),
  makeQuote(238, 2, 'enviada', [['p1', 8], ['p6', 1], ['p4', 1]]),
  makeQuote(237, 4, 'aprobada', [['p2', 10], ['p5', 1]]),
  makeQuote(236, 3, 'rechazada', [['p2', 6]]),
  makeQuote(235, 5, 'borrador', [['p2', 3], ['p4', 1]]),
  makeQuote(234, 0, 'aprobada', [['p1', 10], ['p6', 1]], 2000),
]

/* ───────────── Notas ───────────── */

export const notes: Note[] = [
  { id: 'n1', leadId: 'l1', leadName: 'Andrea López · Constructora Nova', body: 'Solicitó precio para 5 usuarios y la integración con WhatsApp. Enviar cotización hoy.', authorName: 'Mariana Ruiz', createdAt: ago(2 * HOUR), followUpAt: inFuture(3 * HOUR), done: false },
  { id: 'n2', leadId: 'l2', leadName: 'Carlos Méndez · Grupo Atlas', body: 'Pidió mejor descuento si cierra esta semana. Consultar con supervisión.', authorName: 'Mariana Ruiz', createdAt: ago(6 * HOUR), followUpAt: inFuture(DAY), done: false },
  { id: 'n3', leadId: 'l3', leadName: 'Sofía Ramírez · Soluciones GT', body: 'Demo agendada para el jueves a las 10:00. Preparar caso de uso de seguimiento.', authorName: 'Javier Soto', createdAt: ago(DAY), followUpAt: inFuture(2 * DAY), done: false },
  { id: 'n4', leadId: 'l8', leadName: 'Estuardo Cárdenas · Clínicas Vida', body: 'Contrato firmado. Coordinar kickoff de implementación.', authorName: 'Luis Ovalle', createdAt: ago(2 * DAY), followUpAt: null, done: true },
  { id: 'n5', leadId: null, leadName: null, body: 'Actualizar plantilla de propuesta con el nuevo módulo de respuestas con IA.', authorName: 'Mariana Ruiz', createdAt: ago(3 * DAY), followUpAt: inFuture(4 * DAY), done: false },
]

let seq = 1000
export const nextId = (prefix: string) => `${prefix}${++seq}`

/* ───────────── Notificaciones ───────────── */

export const notifications: AppNotification[] = [
  { id: 'nt1', kind: 'cotizacion', tag: 'Cotización', tone: 'amber', title: 'Cotización pendiente de revisión', description: 'COT-0242 · Constructora Nova · Q28,900 preparada por IA.', createdAt: ago(25 * 60_000), read: false, href: '/cotizaciones/q242' },
  { id: 'nt2', kind: 'mensaje', tag: 'Mensaje', tone: 'blue', title: 'Mensaje nuevo de Carlos Méndez', description: '«¿Podrían mejorar el descuento si cerramos esta semana?»', createdAt: ago(55 * 60_000), read: false, href: '/conversaciones/c2' },
  { id: 'nt3', kind: 'seguimiento', tag: 'Seguimiento', tone: 'amber', title: 'Seguimiento pendiente', description: 'Llamada con Sofía Ramírez programada para hoy a las 11:45.', createdAt: ago(2 * HOUR), read: false, href: '/leads/l3' },
  { id: 'nt4', kind: 'cotizacion', tag: 'Cotización', tone: 'green', title: 'Cotización aprobada', description: 'Transportes Quetzal aceptó COT-0237 por Q31,950.', createdAt: ago(5 * HOUR), read: true, href: '/cotizaciones/q237' },
  { id: 'nt5', kind: 'lead', tag: 'Oportunidad', tone: 'violet', title: 'Nueva oportunidad detectada', description: 'La IA detectó interés de compra en la conversación con Clínicas Vida.', createdAt: ago(8 * HOUR), read: true, href: '/conversaciones/c6' },
  { id: 'nt6', kind: 'lead', tag: 'Lead', tone: 'amber', title: 'Lead sin actividad', description: 'Gabriela Pérez lleva 7 días sin contacto.', createdAt: ago(DAY), read: true, href: '/leads/l5' },
  { id: 'nt7', kind: 'cotizacion', tag: 'Cotización', tone: 'red', title: 'Cotización rechazada', description: 'Inversiones Tikal rechazó COT-0236 por Q9,000.', createdAt: ago(2 * DAY), read: true, href: '/cotizaciones/q236' },
]

/* ───────────── Actividad por lead ───────────── */

export const leadActivity = (leadId: string): ActivityItem[] => {
  const l = leads.find((x) => x.id === leadId)
  if (!l) return []
  return [
    { id: `${leadId}-a1`, title: 'Lead pasó a ' + l.status, detail: `${l.name} · ${l.company}`, at: ago(3 * HOUR), tone: 'violet' },
    { id: `${leadId}-a2`, title: 'Cotización enviada', detail: `COT-0238 · ${l.company} · Q${l.value.toLocaleString('en-US')}`, at: ago(DAY), tone: 'blue' },
    { id: `${leadId}-a3`, title: 'Llamada realizada', detail: `Seguimiento con ${l.name}`, at: ago(2 * DAY), tone: 'green' },
    { id: `${leadId}-a4`, title: 'Lead registrado', detail: `Origen: ${l.source}`, at: l.createdAt, tone: 'blue' },
  ]
}
