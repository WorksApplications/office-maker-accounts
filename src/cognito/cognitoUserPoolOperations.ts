// should include both cognito user pool and identity pool actions if exist

import {USER_POOL} from '@/cognito/cognitoPoolSchema'

const AWS = require('aws-sdk')
const cognitoUserPool = new AWS.CognitoIdentityServiceProvider({apiVersion: '2016-04-18'})

interface UserAttributeStruct {
  Name: string,
  Value: string
}

export async function getLoginTimeFromUser( username: string ) {
  const data = await cognitoUserPool.adminGetUser({
    Username: username,
    UserPoolId: process.env.USER_POOL_ID,
  }).promise()
  const userAttributes: UserAttributeStruct[] = data.UserAttributes ? data.UserAttributes : []
  const resultList = userAttributes
    .filter(item => item.Name === USER_POOL.ATTR_GREEN_LOGIN_TIME)
    .map(item => item.Value)
  if ( resultList.length === 1 )
    return parseInt(resultList[0])
  if ( resultList.length === 0 )
    return 0
  throw new Error(`unexpect results number ${resultList.length}, expect 1`)
}

export async function setLoginTimeForUser( user: string, timestamp: string ) {
  return await cognitoUserPool.adminUpdateUserAttributes({
    UserAttributes: [
      {
        Name: USER_POOL.ATTR_GREEN_LOGIN_TIME,
        Value: timestamp,
      },
    ],
    UserPoolId: process.env.USER_POOL_ID,
    Username: user,
  }).promise()
}
