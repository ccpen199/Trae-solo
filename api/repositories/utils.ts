function toCamelCase<T = unknown>(obj: unknown): T {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj as T
  }

  if (Array.isArray(obj)) {
    return obj.map(item => toCamelCase(item)) as unknown as T
  }

  const result: Record<string, unknown> = {}
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
      const objRecord = obj as Record<string, unknown>
      let value = objRecord[key]

      if (key === 'subjects' || key === 'target_cities' || key === 'holland_scores' ||
          key === 'subject_requirements' || key === 'courses' || key === 'match_reasons' ||
          key === 'conflict_warnings') {
        if (typeof value === 'string') {
          try {
            value = JSON.parse(value)
          } catch {
            // keep original value
          }
        }
      }

      if (key === 'expert_certified' || key === 'is_expert') {
        value = value === 1 || value === true
      }

      result[camelKey] = toCamelCase(value)
    }
  }
  return result as T
}

export { toCamelCase }
