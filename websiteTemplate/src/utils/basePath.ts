export const getBasePath = (): string => {
    return process.env.NEXT_PUBLIC_BASE_PATH || ''
}

export const withBasePath = (path: string): string => {
    const base = getBasePath()
    if (!path) return base
    if (path.startsWith('/')) return `${base}${path}`
    return `${base}/${path}`
}

export default withBasePath
