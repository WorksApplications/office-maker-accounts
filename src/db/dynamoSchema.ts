export const TB_TENANT = {
  name: process.env.DB_TENANT_NAME,
  TENANT: 'Tenant',   //string  @PK
  CATALOG: 'Catalog',  //string @SK
  CATALOG_V_OWNER: 'OWNER',
  CATALOG_V_SAML: 'SAML',
  CATALOG_V_INFO: 'INFO',
  CATALOG_V_WHITELIST: 'WHITELIST',
  OWNER: 'Owner',     //string
  SAML: 'SAML',
  WHITELIST: 'WHITELIST',
  INFO: 'INFO',
  INFO_JWT: 'JWT_EXPIRE',
  INFO_STATE: 'STATE_EXPIRE',
  INFO_REDIRECT: 'REDIRECT_URL',
}

export const TB_USER_PRIV = {
  name: process.env.DB_USER_PRI_NAME,
  TENANT_USER: 'TenantUser',
  ROLE: 'Role',
  CONDITION: 'Condition',
  TTL: 'TTL',
  CREATOR: 'Creator',
}
