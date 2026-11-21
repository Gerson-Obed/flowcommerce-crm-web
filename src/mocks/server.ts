import type {
  ActivityItem,
  AiSettings,
  AiSuggestion,
  Customer,
  DashboardSummary,
  Lead,
  LeadStatus,
  Message,
  Note,
  Product,
  Quote,
  QuoteStatus,
} from '@/types/domain'
import {
  aiSettings,
  conversations,
  currentUser,
  customers,
  leadActivity,
  leads,
  messages,
  nextId,
  notes,
  notifications,
  products,
  quotes,
  team,
} from './db'

/**
 * Servidor simulado en memoria. Responde con las mismas rutas y formas
 * que debe exponer el backend real (ver docs/API.md).
 */

type Query = Record<string, string | undefined>
interface Ctx {
  params: Record<string, string>
  query: Query
  body: any
}
type Handler = (ctx: Ctx) => unknown

interface Route {
  method: string
  regex: RegExp
  keys: string[]
  handler: Handler
}

const routes: Route[] = []

function on(method: string, path: string, handler: Handler) {
  const keys: string[] = []
  const pattern = path.replace(/:([a-zA-Z]+)/g, (_, k) => {
    keys.push(k)
    return '([^/]+)'
  })
  routes.push({ method, regex: new RegExp(`^${pattern}$`), keys, handler })
}

class MockError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

const notFound = (what: string) => new MockError(404, `${what} no encontrado`)

const norm = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

function paginate<T>(items: T[], q: Query) {
  const page = Math.max(1, Number(q.page ?? 1))
  const pageSize = Math.max(1, Number(q.pageSize ?? 20))
  return {
    data: items.slice((page - 1) * pageSize, page * pageSize),
    meta: { page, pageSize, total: items.length },
  }
}

/* ───────────── Auth ───────────── */

on('POST', '/auth/login', ({ body }) => {
  if (!body?.email || !body?.password) throw new MockError(422, 'Correo y contraseña son requeridos')
  return { token: 'mock-token', user: currentUser }
})
on('GET', '/auth/me', () => currentUser)
on('POST', '/auth/logout', () => ({ ok: true }))
on('PATCH', '/auth/me', ({ body }) => Object.assign(currentUser, body))
on('GET', '/users', () => team)

/* ───────────── Dashboard ───────────── */

on('GET', '/dashboard/summary', (): DashboardSummary => {
  const order: LeadStatus[] = ['nuevo', 'contactado', 'seguimiento', 'cotizacion', 'negociacion', 'ganado']
  const ago = (min: number) => new Date(Date.now() - min * 60_000).toISOString()
  return {
    kpis: {
      activeLeads: { value: 24, delta: 12 },
      pendingFollowUps: { value: 5, delta: -2 },
      sentQuotes: { value: 18, delta: 8 },
      wonSales: { value: 7, delta: 3 },
      conversion: { value: 31.4, delta: 4.2 },
      estimatedPipeline: { value: 144850, delta: 18 },
    },
    periodLabel: 'Septiembre',
    leadsByStatus: order.map((status, i) => ({ status, count: [6, 5, 4, 5, 3, 7][i] })),
    monthlyConversion: [
      { label: 'Feb', value: 18 },
      { label: 'Mar', value: 21 },
      { label: 'Abr', value: 19 },
      { label: 'May', value: 25 },
      { label: 'Jun', value: 24 },
      { label: 'Jul', value: 29 },
      { label: 'Ago', value: 27 },
      { label: 'Sep', value: 31.4 },
    ],
    quotesByStatus: (['borrador', 'pendiente', 'enviada', 'aprobada', 'rechazada'] as QuoteStatus[]).map((status, i) => ({
      status,
      count: [10, 9, 15, 14, 6][i],
    })),
    salesByPeriod: [
      { label: 'Feb', sales: 52000, goal: 60000 },
      { label: 'Mar', sales: 71000, goal: 65000 },
      { label: 'Abr', sales: 64000, goal: 70000 },
      { label: 'May', sales: 92000, goal: 80000 },
      { label: 'Jun', sales: 88000, goal: 85000 },
      { label: 'Jul', sales: 126000, goal: 100000 },
      { label: 'Ago', sales: 98000, goal: 110000 },
      { label: 'Sep', sales: 93300, goal: 115000 },
    ],
    salesTotal: 684300,
    todayFollowUps: [
      { id: 'f1', leadId: 'l1', leadName: 'Andrea López', company: 'Constructora Nova', time: '09:30', type: 'llamada', ownerName: 'Mariana Ruiz', status: 'pendiente' },
      { id: 'f2', leadId: 'l2', leadName: 'Carlos Méndez', company: 'Grupo Atlas', time: '11:30', type: 'reunion', ownerName: 'Javier Soto', status: 'confirmado' },
      { id: 'f3', leadId: 'l3', leadName: 'Sofía Ramírez', company: 'Soluciones GT', time: '13:00', type: 'whatsapp', ownerName: 'Mariana Ruiz', status: 'pendiente' },
      { id: 'f4', leadId: 'l4', leadName: 'Daniel Herrera', company: 'Corporación Central', time: '15:00', type: 'correo', ownerName: 'Luis Ovalle', status: 'realizado' },
      { id: 'f5', leadId: 'l8', leadName: 'Estuardo Cárdenas', company: 'Clínicas Vida', time: '16:45', type: 'llamada', ownerName: 'Javier Soto', status: 'pendiente' },
    ],
    recentActivity: [
      { id: 'a1', title: 'Nuevo lead registrado', detail: 'Daniel Herrera · Corporación Central', at: ago(12), tone: 'blue' },
      { id: 'a2', title: 'Cotización enviada', detail: 'COT-0241 · Distribuidora Altamira · Q18,450', at: ago(48), tone: 'violet' },
      { id: 'a3', title: 'Lead pasó a negociación', detail: 'Andrea López · Constructora Nova', at: ago(120), tone: 'amber' },
      { id: 'a4', title: 'Cliente respondió', detail: 'Carlos Méndez · Grupo Atlas', at: ago(190), tone: 'blue' },
      { id: 'a5', title: 'Cotización aprobada', detail: 'COT-0239 · Clínicas Vida · Q58,400', at: ago(300), tone: 'green' },
      { id: 'a6', title: 'Venta ganada', detail: 'Transportes Quetzal · Q31,950', at: ago(1500), tone: 'green' },
    ],
  }
})

/* ───────────── Leads ───────────── */

on('GET', '/leads', ({ query }) => {
  const s = norm(query.search ?? '')
  const list = leads.filter(
    (l) =>
      (!s || norm(`${l.name} ${l.company} ${l.email}`).includes(s)) &&
      (!query.status || l.status === query.status) &&
      (!query.ownerId || l.ownerId === query.ownerId) &&
      (!query.source || l.source === query.source),
  )
  if (query.period) {
    const days = Number(query.period.replace('d', ''))
    const from = Date.now() - days * 86_400_000
    for (let i = list.length - 1; i >= 0; i--) if (new Date(list[i].createdAt).getTime() < from) list.splice(i, 1)
  }
  if (query.sort === 'valor') list.sort((a, b) => b.value - a.value)
  return paginate(list, query)
})
on('GET', '/leads/:id', ({ params }) => {
  const lead = leads.find((l) => l.id === params.id)
  if (!lead) throw notFound('Lead')
  return lead
})
on('GET', '/leads/:id/activity', ({ params }): ActivityItem[] => leadActivity(params.id))
on('POST', '/leads', ({ body }) => {
  const owner = team.find((t) => t.id === body.ownerId) ?? team[0]
  const lead: Lead = {
    id: nextId('l'),
    name: body.name,
    company: body.company ?? '',
    email: body.email ?? '',
    phone: body.phone ?? '',
    status: body.status ?? 'nuevo',
    source: body.source ?? 'otro',
    ownerId: owner.id,
    ownerName: owner.name,
    value: Number(body.value ?? 0),
    lastContactAt: null,
    nextFollowUpAt: null,
    createdAt: new Date().toISOString(),
  }
  leads.unshift(lead)
  return lead
})
on('PATCH', '/leads/:id', ({ params, body }) => {
  const lead = leads.find((l) => l.id === params.id)
  if (!lead) throw notFound('Lead')
  Object.assign(lead, body)
  return lead
})
on('PATCH', '/leads/:id/status', ({ params, body }) => {
  const lead = leads.find((l) => l.id === params.id)
  if (!lead) throw notFound('Lead')
  lead.status = body.status
  return lead
})
on('DELETE', '/leads/:id', ({ params }) => {
  const i = leads.findIndex((l) => l.id === params.id)
  if (i < 0) throw notFound('Lead')
  leads.splice(i, 1)
  return { ok: true }
})

/* ───────────── Conversaciones + IA ───────────── */

on('GET', '/conversations', ({ query }) => {
  const s = norm(query.search ?? '')
  const list = conversations
    .filter((c) => !s || norm(`${c.contactName} ${c.company} ${c.lastMessage}`).includes(s))
    .filter((c) => !query.channel || c.channel === query.channel)
    .filter((c) => !query.leadId || c.leadId === query.leadId)
    .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt))
  return list
})
on('GET', '/conversations/:id/messages', ({ params }) =>
  messages.filter((m) => m.conversationId === params.id).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
)
on('POST', '/conversations/:id/messages', ({ params, body }) => {
  const c = conversations.find((x) => x.id === params.id)
  if (!c) throw notFound('Conversación')
  const msg: Message = {
    id: nextId('m'),
    conversationId: c.id,
    author: body.author === 'ai' ? 'ai' : 'agent',
    authorName: body.author === 'ai' ? 'Asistente IA' : currentUser.name,
    text: body.text,
    createdAt: new Date().toISOString(),
  }
  messages.push(msg)
  c.lastMessage = msg.text
  c.lastMessageAt = msg.createdAt
  return msg
})
on('POST', '/conversations/:id/read', ({ params }) => {
  const c = conversations.find((x) => x.id === params.id)
  if (c) c.unread = 0
  return { ok: true }
})
on('PATCH', '/conversations/:id', ({ params, body }) => {
  const c = conversations.find((x) => x.id === params.id)
  if (!c) throw notFound('Conversación')
  Object.assign(c, body)
  return c
})
on('POST', '/conversations/:id/ai-suggestions', ({ params }): AiSuggestion[] => {
  const last = [...messages].reverse().find((m) => m.conversationId === params.id && m.author === 'lead')
  const t = norm(last?.text ?? '')
  if (/precio|costo|cuanto|implement/.test(t)) {
    return [
      { id: 's1', intent: 'Precios', confidence: 0.94, text: 'Con gusto. El plan Pro cuesta Q1,850 por usuario al año e incluye la integración con WhatsApp Business. La implementación toma alrededor de 3 semanas. ¿Te preparo una cotización formal para tu equipo?' },
      { id: 's2', intent: 'Agendar demo', confidence: 0.81, text: 'Para que veas el sistema en acción, ¿te parece una demo de 30 minutos esta semana? Puedo el jueves a las 10:00 o el viernes a las 15:00.' },
      { id: 's3', intent: 'Más información', confidence: 0.72, text: 'Claro, te cuento: el plan se cotiza por usuario e incluye implementación, capacitación y soporte. ¿Cuántas personas lo usarían?' },
    ]
  }
  if (/descuento|mejor|rebaja/.test(t)) {
    return [
      { id: 's1', intent: 'Negociación', confidence: 0.9, text: 'Gracias por considerarnos. Si confirmamos esta semana puedo gestionar una mejora en las condiciones con mi supervisión. ¿Te parece si te confirmo en las próximas horas?' },
      { id: 's2', intent: 'Valor', confidence: 0.7, text: 'Entiendo. Además del precio, la propuesta incluye capacitación al equipo y migración de datos sin costo adicional.' },
    ]
  }
  return [
    { id: 's1', intent: 'Saludo', confidence: 0.88, text: 'Hola, gracias por escribirnos. ¿Me cuentas un poco más sobre lo que necesitas para ayudarte mejor?' },
    { id: 's2', intent: 'Agendar demo', confidence: 0.76, text: 'Con gusto te muestro cómo funciona. ¿Prefieres una llamada o una demo por videollamada?' },
    { id: 's3', intent: 'Seguimiento', confidence: 0.65, text: 'Quedo atenta a cualquier duda. Si lo deseas, te comparto un resumen con las funciones principales.' },
  ]
})
on('GET', '/settings/ai', () => aiSettings)
on('PUT', '/settings/ai', ({ body }) => Object.assign(aiSettings, body as AiSettings))

/* ───────────── Clientes ───────────── */

on('GET', '/customers', ({ query }) => {
  const s = norm(query.search ?? '')
  return paginate(
    customers.filter((c) => !s || norm(`${c.name} ${c.contactName} ${c.nit}`).includes(s)),
    query,
  )
})
on('GET', '/customers/summary', () => ({
  active: customers.filter((c) => c.status === 'activo').length + 25,
  billedThisYear: customers.reduce((a, c) => a + c.totalSold, 0) + 2_900_000,
}))
on('GET', '/customers/:id', ({ params }) => {
  const c = customers.find((x) => x.id === params.id)
  if (!c) throw notFound('Cliente')
  return c
})
on('POST', '/customers', ({ body }) => {
  const c: Customer = {
    id: nextId('cu'),
    ...body,
    ownerName: currentUser.name,
    status: 'activo',
    totalSold: 0,
    quotesCount: 0,
    averageTicket: 0,
    lastActivityAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  }
  customers.unshift(c)
  return c
})
on('PATCH', '/customers/:id', ({ params, body }) => {
  const c = customers.find((x) => x.id === params.id)
  if (!c) throw notFound('Cliente')
  return Object.assign(c, body)
})
on('GET', '/customers/:id/quotes', ({ params }) => quotes.filter((q) => q.customerId === params.id))

/* ───────────── Productos ───────────── */

on('GET', '/products', ({ query }) => {
  const s = norm(query.search ?? '')
  return products.filter(
    (p) =>
      (!s || norm(`${p.name} ${p.sku}`).includes(s)) &&
      (!query.kind || p.kind === query.kind) &&
      (query.active === undefined || String(p.active) === query.active),
  )
})
on('POST', '/products', ({ body }) => {
  const p: Product = { id: nextId('p'), ...body }
  products.unshift(p)
  return p
})
on('PATCH', '/products/:id', ({ params, body }) => {
  const p = products.find((x) => x.id === params.id)
  if (!p) throw notFound('Producto')
  return Object.assign(p, body)
})
on('DELETE', '/products/:id', ({ params }) => {
  const i = products.findIndex((x) => x.id === params.id)
  if (i < 0) throw notFound('Producto')
  products.splice(i, 1)
  return { ok: true }
})

/* ───────────── Cotizaciones ───────────── */

on('GET', '/quotes', ({ query }) => {
  const s = norm(query.search ?? '')
  return paginate(
    quotes
      .filter((q) => (!s || norm(`${q.folio} ${q.customerName}`).includes(s)) && (!query.status || q.status === query.status))
      .sort((a, b) => b.folio.localeCompare(a.folio)),
    query,
  )
})
on('GET', '/quotes/summary', () => ({
  drafts: quotes.filter((q) => q.status === 'borrador').length,
  pending: quotes.filter((q) => q.status === 'pendiente').length,
  sent: quotes.filter((q) => q.status === 'enviada').length,
  approved: quotes.filter((q) => q.status === 'aprobada').length,
  totalCount: quotes.length,
  totalValue: quotes.reduce((a, q) => a + q.total, 0),
}))
on('POST', '/quotes/ai-draft', ({ body }) => {
  const customer = customers.find((c) => c.id === body.customerId)
  if (!customer) throw new MockError(422, 'Selecciona un cliente')
  const picks = products.filter((p) => p.active).slice(0, 3)
  const items = picks.map((p, i) => ({
    id: nextId('qi') + `-${i}`,
    productId: p.id,
    description: p.name,
    quantity: i === 0 ? 5 : 1,
    unitPrice: p.unitPrice,
    amount: (i === 0 ? 5 : 1) * p.unitPrice,
  }))
  const subtotal = items.reduce((a, b) => a + b.amount, 0)
  const next = Math.max(...quotes.map((q) => Number(q.folio.slice(4)))) + 1
  const quote: Quote = {
    id: nextId('q'),
    folio: `COT-${String(next).padStart(4, '0')}`,
    status: 'pendiente',
    customerId: customer.id,
    customerName: customer.name,
    contactName: customer.contactName,
    advisorName: currentUser.name,
    currency: 'GTQ',
    issuedAt: new Date().toISOString(),
    validUntil: new Date(Date.now() + 15 * 86_400_000).toISOString(),
    items,
    subtotal,
    discount: 0,
    total: subtotal,
    conditions: 'Forma de pago: 50% anticipo y 50% contra entrega.\nPrecios incluyen IVA.',
    notes: body.prompt ? `Basada en: ${body.prompt}` : 'Propuesta preparada con base en la conversación con el cliente.',
    aiGenerated: true,
    reviewRequired: true,
  }
  quotes.unshift(quote)
  return quote
})
on('GET', '/quotes/:id', ({ params }) => {
  const q = quotes.find((x) => x.id === params.id)
  if (!q) throw notFound('Cotización')
  return q
})
on('POST', '/quotes', ({ body }) => {
  const customer = customers.find((c) => c.id === body.customerId)
  if (!customer) throw new MockError(422, 'Selecciona un cliente')
  const items = (body.items as Quote['items']).map((it, i) => ({
    id: nextId('qi') + `-${i}`,
    productId: it.productId ?? null,
    description: it.description,
    quantity: Number(it.quantity),
    unitPrice: Number(it.unitPrice),
    amount: Number(it.quantity) * Number(it.unitPrice),
  }))
  const subtotal = items.reduce((a, b) => a + b.amount, 0)
  const discount = Number(body.discount ?? 0)
  const next = Math.max(...quotes.map((q) => Number(q.folio.slice(4)))) + 1
  const quote: Quote = {
    id: nextId('q'),
    folio: `COT-${String(next).padStart(4, '0')}`,
    status: 'borrador',
    customerId: customer.id,
    customerName: customer.name,
    contactName: customer.contactName,
    advisorName: currentUser.name,
    currency: 'GTQ',
    issuedAt: new Date().toISOString(),
    validUntil: body.validUntil,
    items,
    subtotal,
    discount,
    total: subtotal - discount,
    conditions: body.conditions ?? '',
    notes: body.notes ?? '',
    aiGenerated: false,
    reviewRequired: false,
  }
  if (body.status) quote.status = body.status
  quotes.unshift(quote)
  return quote
})
on('PATCH', '/quotes/:id/status', ({ params, body }) => {
  const q = quotes.find((x) => x.id === params.id)
  if (!q) throw notFound('Cotización')
  q.status = body.status as QuoteStatus
  q.reviewRequired = false
  return q
})

/* ───────────── Notificaciones ───────────── */

on('GET', '/notifications', ({ query }) =>
  notifications
    .filter((n) => !query.kind || n.kind === query.kind)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
)
on('POST', '/notifications/read-all', () => {
  notifications.forEach((n) => (n.read = true))
  return { ok: true }
})
on('PATCH', '/notifications/:id', ({ params, body }) => {
  const n = notifications.find((x) => x.id === params.id)
  if (!n) throw notFound('Notificación')
  return Object.assign(n, body)
})

/* ───────────── Notas ───────────── */

on('GET', '/notes', ({ query }) =>
  notes
    .filter((n) => !query.leadId || n.leadId === query.leadId)
    .filter((n) => query.done === undefined || String(n.done) === query.done)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
)
on('POST', '/notes', ({ body }) => {
  const lead = leads.find((l) => l.id === body.leadId)
  const n: Note = {
    id: nextId('n'),
    leadId: lead?.id ?? null,
    leadName: lead ? `${lead.name} · ${lead.company}` : null,
    body: body.body,
    authorName: currentUser.name,
    createdAt: new Date().toISOString(),
    followUpAt: body.followUpAt ?? null,
    done: false,
  }
  notes.unshift(n)
  return n
})
on('PATCH', '/notes/:id', ({ params, body }) => {
  const n = notes.find((x) => x.id === params.id)
  if (!n) throw notFound('Nota')
  return Object.assign(n, body)
})
on('DELETE', '/notes/:id', ({ params }) => {
  const i = notes.findIndex((x) => x.id === params.id)
  if (i >= 0) notes.splice(i, 1)
  return { ok: true }
})

/* ───────────── Entrada ───────────── */

export async function mockRequest(
  method: string,
  path: string,
  query: Query,
  body: unknown,
): Promise<{ status: number; data: unknown }> {
  await new Promise((r) => setTimeout(r, 180 + Math.random() * 220))
  for (const route of routes) {
    if (route.method !== method) continue
    const m = route.regex.exec(path)
    if (!m) continue
    const params: Record<string, string> = {}
    route.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1])))
    try {
      const data = route.handler({ params, query, body })
      return { status: 200, data: JSON.parse(JSON.stringify(data)) }
    } catch (e) {
      if (e instanceof MockError) return { status: e.status, data: { message: e.message } }
      throw e
    }
  }
  return { status: 404, data: { message: `Ruta no encontrada: ${method} ${path}` } }
}
