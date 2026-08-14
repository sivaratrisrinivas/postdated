export function jsonSecurityResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: securityHeaders(),
  });
}

function securityHeaders(): Headers {
  return new Headers({
    'cache-control': 'no-store',
    'content-security-policy': "default-src 'none'; frame-ancestors 'none'",
    'content-type': 'application/json',
    'referrer-policy': 'no-referrer',
    'strict-transport-security': 'max-age=31536000; includeSubDomains',
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'DENY',
  });
}
