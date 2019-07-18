const AWS = require('aws-sdk')
import {GetOptionsInfoStruct, TB_TENANT} from './dynamoSchema'
import isEmpty = require('lodash/isEmpty')

const dynamoDB = new AWS.DynamoDB({apiVersion: '2012-08-10'})

/**
 *
 * @param name
 * @return boolean
 */
export async function isTenantNameAvailable( name: string ) {
  const params = {
    Key: {
      [TB_TENANT.TENANT]: {S: name},
      [TB_TENANT.CATALOG]: {S: TB_TENANT.CATALOG_V_OWNER},
    },
    TableName: TB_TENANT.name,
  }
  try {
    const data = await dynamoDB.getItem(params).promise()
    return isEmpty(data.Item)
  } catch (e) {
    console.log(e)
    return false
  }

}

/**
 *  //dynamo putItem
 * @param username
 * @param tenantName
 * @return {Promise<''>} don't care about the result
 */
export function promiseToCreateTenant( username: string, tenantName: string ) {
  const params = {
    TableName: TB_TENANT.name,
    Item: {
      [TB_TENANT.TENANT]: {S: tenantName},
      [TB_TENANT.CATALOG]: {S: TB_TENANT.CATALOG_V_OWNER},
      [TB_TENANT.OWNER]: {S: username},
    },
    ConditionExpression: 'attribute_not_exists(' + TB_TENANT.TENANT + ')',
  }
  return new Promise(( resolve, reject ) => {
    dynamoDB.putItem(params, ( err: any, data: any ) => {
      if ( err ) reject(err)
      resolve(data) // nothing
    })
  })
}

export async function isOwnerOfTenant( userName: string, tenantName: string ) {
  try {
    const tenantItem = await dynamoDB.getItem({
      TableName: TB_TENANT.name,
      Key: {
        [TB_TENANT.TENANT]: {S: tenantName},
        [TB_TENANT.CATALOG]: {S: TB_TENANT.CATALOG_V_OWNER},
      },
    }).promise()
    return tenantItem.Item[TB_TENANT.OWNER].S.match(userName)
  } catch (e) {
    throw new Error('tenant not exist')
  }

}

export async function deleteOwnedTenant( userName: string, tenantName: string ) {
  //todo: change to batch delete to delete all record with PK tenantName
  let isOwner = false
  try {
    isOwner = await isOwnerOfTenant(userName, tenantName)
  } catch (e) {
    throw new Error('error check owner')
  }
  if ( !isOwner ) {
    throw new Error('not owner of the tenant')
  }
  try {
    const params = {
      TableName: TB_TENANT.name,
      Key: {
        [TB_TENANT.TENANT]: {S: tenantName},
        [TB_TENANT.CATALOG]: {S: TB_TENANT.CATALOG_V_OWNER},
      },
    }
    return await dynamoDB.deleteItem(params).promise()
  } catch (e) {
    throw new Error('error when delete tenant info: ' + e.message || JSON.stringify(e))
  }
}

export async function createSAMLInfo( tenantName: string, samlName: string ) {
  const params = {
    TableName: TB_TENANT.name,
    Item: {
      [TB_TENANT.TENANT]: {S: tenantName},
      [TB_TENANT.CATALOG]: {S: TB_TENANT.CATALOG_V_SAML},
      [TB_TENANT.SAML]: {S: samlName},
    },
  }
  return await dynamoDB.putItem(params).promise()
}

export async function deleteSAMLInfo( tenantName: string ) {
  const params = {
    TableName: TB_TENANT.name,
    Key: {
      [TB_TENANT.TENANT]: {S: tenantName},
      [TB_TENANT.CATALOG]: {S: TB_TENANT.CATALOG_V_SAML},
    },
  }
  return await dynamoDB.deleteItem(params).promise()
}

export async function queryTenantInfo( tenantName: string ) {
  const params = {
    TableName: TB_TENANT.name,
    Key: {
      [TB_TENANT.TENANT]: {S: tenantName},
      [TB_TENANT.CATALOG]: {S: TB_TENANT.CATALOG_V_INFO},
    },
  }
  const data = await dynamoDB.getItem(params).promise()
  console.log(JSON.stringify(data))
  if ( !data.Item ) {
    return {
      jwtExpireTime: undefined,
      stateExpireTime: undefined,
    }
  }
  const jwtExpire: string = data.Item[TB_TENANT.INFO_JWT].N
  const stateExpire: string = data.Item[TB_TENANT.INFO_STATE].N
  const url: string = data.Item[TB_TENANT.INFO_REDIRECT].S
  return {
    jwtExpireTime: jwtExpire,
    stateExpireTime: stateExpire,
    redirectUrl: url,
  }
}

//dynamo putItem
export async function addTenantRequiredInfo( tenantName: string, jwtExpireTime: string, stateExpireTime: string, redirectUrl: string ) {
  const params = {
    TableName: TB_TENANT.name,
    Item: {
      [TB_TENANT.TENANT]: {S: tenantName},
      [TB_TENANT.CATALOG]: {S: TB_TENANT.CATALOG_V_INFO},
      [TB_TENANT.INFO_JWT]: {N: jwtExpireTime},
      [TB_TENANT.INFO_STATE]: {N: stateExpireTime},
      [TB_TENANT.INFO_REDIRECT]: {S: redirectUrl},
    },
  }
  return await dynamoDB.putItem(params).promise()
}

export async function setTenantOptionsInfo( tenantName: string, enableLoginFree: boolean, enableLoginRestrict: boolean,
                                            loginFreeIPs: string[], loginRestrictIPs: string[], bufferTime: string ) {
  console.log(`tenantname: ${tenantName}\nenableLoginFree: ${enableLoginFree}\nenableLoginRestrict: ${enableLoginRestrict}\n`)
  console.log(`loginFreeIPs: ${loginFreeIPs}\nloginRestrictIPs: ${loginRestrictIPs}\nbufferTime: ${bufferTime}`)
  let params: any = {
    TableName: TB_TENANT.name,
    Item: {
      [TB_TENANT.TENANT]: {S: tenantName},
      [TB_TENANT.CATALOG]: {S: TB_TENANT.CATALOG_V_LOGIN_RESTRICT},
      [TB_TENANT.LOGIN_FREE]: {BOOL: enableLoginFree},
      [TB_TENANT.LOGIN_RESTRICT]: {BOOL: enableLoginRestrict},
      [TB_TENANT.LOGIN_RESTRICT_BUFFER]: {S: bufferTime},
    },
  }
  if ( loginFreeIPs.length > 0 ) {
    params.Item[TB_TENANT.LOGIN_FREE_IPS] = {SS: loginFreeIPs}
  }
  if ( loginRestrictIPs.length > 0 ) {
    params.Item[TB_TENANT.LOGIN_RESTRICT_IPS] = {SS: loginRestrictIPs}
  }
  return await dynamoDB.putItem(params).promise()
}

/**
 * If failed to get options, all not enabled
 * @param tenantName
 */
export async function getTenantOptionsInfo( tenantName: string ): Promise<GetOptionsInfoStruct> {
  let params = {
    TableName: TB_TENANT.name,
    Key: {
      [TB_TENANT.TENANT]: {S: tenantName},
      [TB_TENANT.CATALOG]: {S: TB_TENANT.CATALOG_V_LOGIN_RESTRICT},
    },
  }
  const data = await dynamoDB.getItem(params).promise()
  if ( !data.Item ) {
    return {
      enableLoginFree: false,
      enableLoginRestrict: false,
      loginFreeIPs: [],
      loginRestrictIPs: [],
      bufferTime: '0',
    }
  }
  return {
    enableLoginFree: data.Item[TB_TENANT.LOGIN_FREE].BOOL,
    enableLoginRestrict: data.Item[TB_TENANT.LOGIN_RESTRICT].BOOL,
    loginFreeIPs: data.Item[TB_TENANT.LOGIN_FREE_IPS].SS,
    loginRestrictIPs: data.Item[TB_TENANT.LOGIN_RESTRICT_IPS].SS,
    bufferTime: data.item[TB_TENANT.LOGIN_RESTRICT_BUFFER].S,
  }
}

export async function deleteTenantRequiredInfo( tenantName: string ) {
  const params = {
    TableName: TB_TENANT.name,
    Key: {
      [TB_TENANT.TENANT]: {S: tenantName},
      [TB_TENANT.CATALOG]: {S: TB_TENANT.CATALOG_V_INFO},
    },
  }
  return await dynamoDB.deleteItem(params).promise()
}

export async function deleteTenantOptionsInfo( tenantName: string ) {
  const params = {
    TableName: TB_TENANT.name,
    Key: {
      [TB_TENANT.TENANT]: {S: tenantName},
      [TB_TENANT.CATALOG]: {S: TB_TENANT.CATALOG_V_LOGIN_RESTRICT},
    },
  }
  return await dynamoDB.deleteItem(params).promise()
}
