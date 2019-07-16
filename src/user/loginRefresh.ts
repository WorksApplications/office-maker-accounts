import response from '@/lambdaResponse'
import {samlSign} from '@/user/samlLoginHandler'
import {getToken} from '@/user/worksmapJWT'

const uuidv4 = require('uuid/v4') //random
const jwt = require('jsonwebtoken')
const cookie = require('cookie')

const COGNITO_DOMAIN = process.env.COGNITO_DOMAIN
const COGNITO_REGION = process.env.COGNITO_REGION
const TENANT_SAML_NAME_PREFIX = process.env.TENANT_SAML_NAME_PREFIX
const BASE_URL = process.env.BASE_URL as string
const COGNITO_USER_CLIENT_ID = process.env.COGNITO_USER_CLIENT_ID
const privateKey = process.env.privateKey as string
const publicKey = process.env.publicKey as string
const defaultJwtExpireLength = 1800 //60*30 seconds = 30 minutes
const defaultStateExpireLength = 1800 //60*30 seconds = 30 minutes


export async function handler( event: any ) {
  const tenantName: string | undefined = event['queryStringParameters']['tenant']
  const method: string = event['queryStringParameters']['method']
  const ip: string = event['requestContext']['identity']['sourceIp']
  const token: string = event['queryStringParameters']['token']

  if ( typeof tenantName === 'undefined' ) {
    return response(400, 'tenantName did not provided')
  }

  try {
    if ( 'saml' === method ) {
      return await refreshSAML(tenantName, event.headers['cookie'], ip, token)
    }
    if ( 'guest' === method ) {
      return await refreshGuest(tenantName, token)
    }
    return response(400, 'login method did not provided')
  } catch (e) {
    console.error(e.message || JSON.stringify(e))
    return response(400, e)
  }
}


async function oldTokenValid( token: string ) {
  return new Promise(( resolve, reject ) => {
    jwt.verify(token, publicKey, {
      algorithm: ['RS512'],
    }, ( err: any, data: any ) => {
      if ( err ) {
        reject(err)
      }
      resolve(data)
    })
  })
}


async function refreshGuest( tenantName: string, token: string ) {
  try {
    await oldTokenValid(token)
  } catch (e) {
    throw new Error(`token provided is not valid`)
  }
  const newToken = getToken(privateKey, 'guest', tenantName, 'guest', 1800)
  return response(200, JSON.stringify(newToken))
}

/**
 * saml don't refresh cognito oauth token as long as worksmap token is valid
 * @param tenantName
 * @param cookieStr
 * @param ip
 * @param token
 */
async function refreshSAML( tenantName: string, cookieStr: string | undefined, ip: string, token: string ) {
  let tokenData: any
  try {
    tokenData = await oldTokenValid(token)
  } catch (e) {
    throw new Error(`token provided is not valid`)
  }

  const newToken = samlSign(tenantName, ip, tokenData.userId, tokenData.role, tokenData.expireInForRefresh)
  return response(200, newToken)
}
