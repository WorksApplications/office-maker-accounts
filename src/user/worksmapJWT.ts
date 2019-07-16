const jwt = require('jsonwebtoken')

export function getToken( privateKey: string, userId: string, tenant: string, role: string, expireIn: number ) {
  return jwt.sign({
    exp: Math.floor(Date.now() / 1000) + expireIn,
    userId: userId,
    role: role ? role : 'Guest',
    tenantDomain: tenant,
    expireInForRefresh: expireIn,
  }, privateKey, {algorithm: 'RS512'})
}
