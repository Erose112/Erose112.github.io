/** Prefix a public/ path with Vite's base (needed for GitHub Pages project sites). */
export function assetUrl(path) {
  const base = import.meta.env.BASE_URL
  return `${base}${String(path).replace(/^\//, '')}`
}
