export const TB_TENANT = {
  name: process.env.DB_TENANT_NAME,
  TENANT: 'Tenant',   //string  @PK
  CATALOG: 'Catalog',  //string @SK
  CATALOG_V_OWNER: 'OWNER',
  CATALOG_V_SAML: 'SAML',
  CATALOG_V_INFO: 'INFO',
  CATALOG_V_LOGIN_RESTRICT: 'LOGIN_RESTRICT',
  OWNER: 'Owner',     //string
  SAML: 'SAML',
  INFO: 'INFO',
  INFO_JWT: 'JWT_EXPIRE',
  INFO_STATE: 'STATE_EXPIRE',
  INFO_REDIRECT: 'REDIRECT_URL',
  LOGIN_FREE: 'LOGIN_FREE',
  LOGIN_FREE_IPS: 'LOGIN_FREE_IPS',
  LOGIN_RESTRICT: 'LOGIN_RESTRICT',
  LOGIN_RESTRICT_IPS: 'LOGIN_RESTRICT_IPS',
  LOGIN_RESTRICT_BUFFER: 'LOGIN_RESTRICT_BUFFER',
}

export const TB_USER_PRIV = {
  name: process.env.DB_USER_PRI_NAME,
  TENANT_USER: 'TenantUser',
  ROLE: 'Role',
  CONDITION: 'Condition',
  TTL: 'TTL',
  CREATOR: 'Creator',
}

export interface GetOptionsInfoStruct {
  enableLoginFree: string | boolean
  loginFreeIPs: string[]
  enableLoginRestrict: string | boolean
  loginRestrictIPs: string[]
  bufferTime: string
}
