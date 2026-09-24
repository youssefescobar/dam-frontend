/**
 * Browser API base.
 * - Dev: empty → same-origin `/chat` through Vite proxy (avoids live CORS).
 * - Prod build: VITE_API_URL / VITE_API_BASE_URL.
 */
const API_BASE = (
  import.meta.env.DEV
    ? ''
    : import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || ''
).replace(/\/$/, '')

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function api<T>(
  path: string,
  options: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const { json, headers, ...rest } = options
  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...rest,
      headers: {
        Accept: 'application/json',
        ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      body: json !== undefined ? JSON.stringify(json) : rest.body,
    })
  } catch {
    throw new ApiError(
      0,
      'Network error — check the API URL / CORS, or restart Vite so the proxy loads.',
    )
  }

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const message =
      (data && typeof data === 'object' && 'error' in data && String(data.error)) ||
      `Request failed (${res.status})`
    throw new ApiError(res.status, message)
  }
  return data as T
}
