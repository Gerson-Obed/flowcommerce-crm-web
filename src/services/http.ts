import { env } from '@/config/env'
import { tokenStorage } from '@/lib/token-storage'

export class ApiError extends Error {
  status: number
  details?: unknown
  constructor(status: number, message: string, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

type Primitive = string | number | boolean | null | undefined
export type QueryParams = Record<string, Primitive>

interface RequestOptions {
  params?: QueryParams
  body?: unknown
  signal?: AbortSignal
}

export const UNAUTHORIZED_EVENT = 'flowcommerce:unauthorized'

function cleanParams(params?: QueryParams): Record<string, string> {
  const out: Record<string, string> = {}
  if (!params) return out
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') out[k] = String(v)
  }
  return out
}

async function request<T>(method: string, path: string, opts: RequestOptions = {}): Promise<T> {
  const query = cleanParams(opts.params)

  let status: number
  let payload: any

  if (env.useMocks) {
    const { mockRequest } = await import('@/mocks/server')
    const res = await mockRequest(method, path, query, opts.body)
    status = res.status
    payload = res.data
  } else {
    const qs = new URLSearchParams(query).toString()
    const url = `${env.apiUrl}${path}${qs ? `?${qs}` : ''}`
    const token = tokenStorage.get()
    const res = await fetch(url, {
      method,
      signal: opts.signal,
      headers: {
        Accept: 'application/json',
        ...(opts.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    })
    status = res.status
    const text = await res.text()
    payload = text ? safeJson(text) : null
  }

  if (status === 401) {
    tokenStorage.clear()
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
  }

  if (status < 200 || status >= 300) {
    throw new ApiError(status, payload?.message ?? 'Ocurrió un error inesperado', payload?.errors ?? payload)
  }
  return payload as T
}

function safeJson(text: string) {
  try {
    return JSON.parse(text)
  } catch {
    return { message: text }
  }
}

export const http = {
  get: <T>(path: string, opts?: RequestOptions) => request<T>('GET', path, opts),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>('POST', path, { ...opts, body }),
  put: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>('PUT', path, { ...opts, body }),
  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>('PATCH', path, { ...opts, body }),
  delete: <T>(path: string, opts?: RequestOptions) => request<T>('DELETE', path, opts),
}
