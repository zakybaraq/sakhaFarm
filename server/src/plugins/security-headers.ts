import { Elysia } from 'elysia'

export const securityHeadersPlugin = new Elysia({ name: 'security-headers' })
  .onAfterHandle(({ set }) => {
    set.headers['X-Content-Type-Options'] = 'nosniff'
    set.headers['X-Frame-Options'] = 'DENY'
    set.headers['X-XSS-Protection'] = '1; mode=block'
    set.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    set.headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
    set.headers['Permissions-Policy'] = 'camera=(), microphone=(), geolocation=()'
    set.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
  })
