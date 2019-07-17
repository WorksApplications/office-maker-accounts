// should include both cognito user pool and identity pool actions if exist

const AWS = require('aws-sdk')
const cognitoUserPool = new AWS.CognitoIdentityServiceProvider({apiVersion: '2016-04-18'})
import {ADMIN_POOL} from './cognitoPoolSchema'

interface UserAttributeStruct {
  Name: string,
  Value: string
}

export async function validateOwnership( username: string, tenant: string ) {
  const tenantNames = await getTenantAttributeFromUser(username)
  if ( tenantNames.length === 1 && tenantNames[0] === tenant ) {
    return true
  }
  throw new Error(`user: ${username} is not the owner of tenant: ${tenant}`)
}

/**
 * simple judge whether user is able to create tenant
 * currently, one user could only own one tenant
 * tenant could be owned by multiple users added through original user
 */
export async function userAbleToCreateTenant( username: string ) {
  const tenantNames = await getTenantAttributeFromUser(username)
  if ( tenantNames.length === 0 )
    return true
  throw new Error(`user already own a tenant: ${tenantNames[0]}`)
}

async function getTenantAttributeFromUser( username: string ) {
  const data = await cognitoUserPool.adminGetUser({
    Username: username,
    UserPoolId: process.env.ADMIN_POOL_ID,
  }).promise()
  const userAttributes: UserAttributeStruct[] = data.UserAttributes ? data.UserAttributes : []
  return userAttributes.filter(item => item.Name === ADMIN_POOL.ATTR_NAME_TENANT).map(item => item.Value)
}

export async function getTenantList( username: string ) {
  const tenantNames = await getTenantAttributeFromUser(username)
  if ( tenantNames.length === 0 ) {
    return []
  }
  if ( tenantNames.length === 1 ) {
    return tenantNames[0].split(',')
  }
  throw new Error('Unexcept attribute number: ' + tenantNames.length)
}
export async function adminPoolAddTenantInfo( user: string, tenants: string ) {
  //tenant is a comma separated string in the future
  return await cognitoUserPool.adminUpdateUserAttributes({
    UserAttributes: [
      {
        Name: ADMIN_POOL.ATTR_NAME_TENANT,
        Value: tenants,
      },
    ],
    UserPoolId: process.env.ADMIN_POOL_ID,
    Username: user,
  }).promise()
}

export async function adminPoolDeleteTenantInfo( user: string, tenantToDelete: string ) {
  //require tenantToDelete in case need in the future
  return await cognitoUserPool.adminDeleteUserAttributes({
    UserAttributeNames: [
      ADMIN_POOL.ATTR_NAME_TENANT,
    ],
    UserPoolId: process.env.ADMIN_POOL_ID,
    Username: user,
  }).promise()
}


export async function createCognitoProvider( samlProviderName: string, providerDetails: ProviderDetails, attributeMap: any ) {
  await cognitoUserPool.createIdentityProvider({
    ProviderType: 'SAML',
    ProviderName: samlProviderName,
    UserPoolId: process.env.USER_POOL_ID,
    ProviderDetails: providerDetails,
    AttributeMapping: attributeMap,
  }).promise()

  const data = await cognitoUserPool.describeUserPoolClient({
    ClientId: process.env.USER_CLIENT_ID,
    UserPoolId: process.env.USER_POOL_ID,
  }).promise()
  let providerList: string[] = []
  if ( data.UserPoolClient.SupportedIdentityProviders ) {
    providerList = data.UserPoolClient.SupportedIdentityProviders
  }
  providerList.push(samlProviderName)

  await cognitoUserPool.updateUserPoolClient({
    ClientId: process.env.USER_CLIENT_ID,
    UserPoolId: process.env.USER_POOL_ID,
    SupportedIdentityProviders: providerList,
  }).promise()
  return
}

export async function deleteCognitoProvider( samlProviderName: string ) {
  return await cognitoUserPool.deleteIdentityProvider({
    UserPoolId: process.env.USER_POOL_ID,
    ProviderName: samlProviderName,
  }).promise()
}

export async function getCognitoProvider( samlProviderName: string ) {
  return await cognitoUserPool.describeIdentityProvider({
    ProviderName: samlProviderName,
    UserPoolId: process.env.USER_POOL_ID,
  }).promise()
}

export interface ProviderDetails {
  'MetadataURL'?: string,
  'MetadataFile'?: string
}

export async function updateCognitoProvider( samlProviderName: string, providerDetails: ProviderDetails, attributeMap: any ) {
  return await cognitoUserPool.updateIdentityProvider({
    ProviderName: samlProviderName,
    UserPoolId: process.env.USER_POOL_ID,
    ProviderDetails: providerDetails,
    AttributeMapping: attributeMap,
  }).promise()
}

