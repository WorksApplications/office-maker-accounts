const AWS = require('aws-sdk')
import {TB_USER_PRIV} from './dynamoSchema'

const dynamoDB = new AWS.DynamoDB({apiVersion: '2012-08-10'})


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
