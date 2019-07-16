import {getTenantOptionsInfo, queryTenantInfo} from '@/db/dynamoAdminOperations'
import {GetOptionsInfoStruct} from '@/db/dynamoSchema'
import {getRedirectUrl} from '@/generateUrl'
import response from '@/lambdaResponse'
import {getToken} from './worksmapJWT'

const uuidv4 = require('uuid/v4') //random
const jwt = require('jsonwebtoken')
const cookie = require('cookie')

const COGNITO_DOMAIN = process.env.COGNITO_DOMAIN
const COGNITO_REGION = process.env.COGNITO_REGION
const TENANT_SAML_NAME_PREFIX = process.env.TENANT_SAML_NAME_PREFIX
const BASE_URL = process.env.BASE_URL as string
const COGNITO_USER_CLIENT_ID = process.env.COGNITO_USER_CLIENT_ID
const privateKey = process.env.privateKey as string

const defaultJwtExpireLength = 1800 //60*30 seconds = 30 minutes
const defaultStateExpireLength = 1800 //60*30 seconds = 30 minutes


export async function handler( event: any ) {
  const tenantName: string | undefined = event['queryStringParameters']['tenant']
  let state: string | undefined = event['queryStringParameters']['state']
  const method: string | undefined = event['queryStringParameters']['method']
  const ip: string = event['requestContext']['identity']['sourceIp']

  if ( typeof tenantName === 'undefined' ) {
    return response(400, 'tenantName did not provided')
  }

  try {
    if ( 'saml' === method ) {
      return await generateUrl(tenantName, state, event.headers['cookie'], ip)
    }
    if ( 'guest' === method ) {
      return await guestLogin(tenantName, state, event.headers['cookie'], ip)
    }
    return response(400, 'login method did not provided')
  } catch (e) {
    console.error(e.message || JSON.stringify(e))
    return response(500, e)
  }

}

async function guestLogin( tenantName: string, state: string | undefined, cookieStr: string | undefined, ip: string ) {
  const opt: GetOptionsInfoStruct = await getTenantOptionsInfo(tenantName)
  if ( !opt.enableLoginFree || !opt.loginFreeIPs.includes(ip) ) {
    return response(403, 'login free not allowed')
  }

  const jwt = getToken(privateKey, 'guest', tenantName, 'guest', 1800)
  return response(200, JSON.stringify(jwt))
}

async function generateUrl( tenantName: string, state: string | undefined, cookieStr: string | undefined, ip: string ) {
  let sessionId = uuidv4()
  if ( typeof cookieStr !== 'undefined' ) {
    const cookies = cookie.parse(cookieStr)
    if ( typeof cookies['session_id'] === 'undefined' || cookies['session_id'] === '' ) {
      sessionId = cookies['session_id']
    }
  }

  const info = await queryTenantInfo(tenantName)
  const jwtExpireLength = info.jwtExpireTime ? parseInt(info.jwtExpireTime) : defaultJwtExpireLength
  const stateExpireLength = info.stateExpireTime ? parseInt(info.stateExpireTime) : defaultStateExpireLength
  const defaultRedirectUrl = info.redirectUrl ? info.redirectUrl : ''
  if ( typeof state === 'undefined' ) state = defaultRedirectUrl

  const processedState = createState(sessionId, state, stateExpireLength, jwtExpireLength, tenantName, ip)
  const REDIRECT_URL = getRedirectUrl(BASE_URL)
  const url =
    'https://' + COGNITO_DOMAIN + '.auth.' + COGNITO_REGION + '.amazoncognito.com' +
    '/oauth2/authorize' +
    '?identity_provider=' + TENANT_SAML_NAME_PREFIX + '.' + tenantName +
    '&redirect_uri=' + REDIRECT_URL +
    '&response_type=CODE' +
    '&state=' + processedState +
    '&client_id=' + COGNITO_USER_CLIENT_ID
  return {
    statusCode: 302,
    headers: {
      'Location': url,
      'Set-Cookie': cookie.serialize('session_id', sessionId),
    },
    body: '',
  }
}


function createState( sessionId: string, stateUrl: string, stateExpireLength: number, jwtExpireLength: number, tenant: string, ip: string ) {
  const expire = Math.floor(Date.now() / 1000) + stateExpireLength  //60 * 60, user must finish the login in 1h
  return jwt.sign({
    expire: expire,
    session: sessionId,
    state: stateUrl,
    jwtExpire: Math.floor(Date.now() / 1000) + jwtExpireLength,
    tenant: tenant,
    ip: ip,
  }, privateKey, {algorithm: 'RS512'})
}

