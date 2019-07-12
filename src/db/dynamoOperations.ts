const AWS = require('aws-sdk')
import {TB_TENANT, TB_USER_PRIV} from './dynamoSchema'
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
 *
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

export async function addTenantDetailInfo( tenantName: string, jwtExpireTime: string, stateExpireTime: string, redirectUrl: string ) {
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

export async function deleteTenantDetailInfo( tenantName: string ) {
  const params = {
    TableName: TB_TENANT.name,
    Key: {
      [TB_TENANT.TENANT]: {S: tenantName},
      [TB_TENANT.CATALOG]: {S: TB_TENANT.CATALOG_V_INFO},
    },
  }
  return await dynamoDB.deleteItem(params).promise()
}


export async function setPrivilege( tenantName: string, creator: string, targetUser: string, condition: string, role: string, ttl?: number ) {
  let item: any = {
    [TB_USER_PRIV.TENANT_USER]: {S: tenantName + ':' + targetUser},
    [TB_USER_PRIV.ROLE]: {S: role},
    [TB_USER_PRIV.CREATOR]: {S: creator},
  }
  if ( typeof ttl !== 'undefined' ) {
    item[TB_USER_PRIV.TTL] = {N: '' + ttl}
  }
  const params = {
    TableName: TB_USER_PRIV.name,
    Item: item,
  }
  return await dynamoDB.putItem(params).promise()
}

//todo: each one could only has one privilege role, change format
export async function deletePrivilege( tenantName: string, creator: string ) {

}
