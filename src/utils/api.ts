function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
}

function transformKeys(obj: any): any {
  if (obj === null || obj === undefined) return obj
  if (Array.isArray(obj)) return obj.map(transformKeys)
  if (typeof obj === 'object') {
    const result: any = {}
    for (const key of Object.keys(obj)) {
      result[toCamelCase(key)] = transformKeys(obj[key])
    }
    return result
  }
  return obj
}

export async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) throw new Error(`API Error: ${res.status}`)
  const json = await res.json()
  const data = json.data !== undefined ? json.data : json
  return transformKeys(data) as T
}
