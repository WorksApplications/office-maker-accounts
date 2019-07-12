export function getRedirectUrl( baseUrl: string ): string {
  let redirectUrl = baseUrl
  if ( !baseUrl.startsWith('https://') ) {
    redirectUrl = 'https://' + redirectUrl
  }
  const postPath = 'saml/login/callback'
  if ( !redirectUrl.endsWith('/') ) {
    redirectUrl = redirectUrl + '/'
  }
  redirectUrl = redirectUrl + postPath
  return redirectUrl
}

export function getTenantBaseUrl( baseUrl: string, tenant: string ): string {
  let redirectUrl = baseUrl
  if ( !baseUrl.startsWith('https://') ) {
    redirectUrl = 'https://' + redirectUrl
  }
  if ( !redirectUrl.endsWith('/') ) {
    redirectUrl = redirectUrl + '/'
  }
  redirectUrl = redirectUrl + tenant
  return redirectUrl
}
