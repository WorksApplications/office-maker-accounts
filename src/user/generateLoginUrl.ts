import {queryTenantInfo} from '@/db/dynamoOperations'
import {getRedirectUrl} from '@/generateUrl'

const uuidv4 = require('uuid/v4') //random
const jwt = require('jsonwebtoken')
const cookie = require('cookie')

const COGNITO_DOMAIN = process.env.COGNITO_DOMAIN
const COGNITO_REGION = process.env.COGNITO_REGION
const TENANT_SAML_NAME_PREFIX = process.env.TENANT_SAML_NAME_PREFIX
const BASE_URL = process.env.BASE_URL as string
const COGNITO_USER_CLIENT_ID = process.env.COGNITO_USER_CLIENT_ID
const privateKey = process.env.privateKey

const defaultJwtExpireLength = 172800 //60*60*24*2 seconds  = 2 days
const defaultStateExpireLength = 3600 //60*60 seconds = 1 hour


export async function handler( event: any ) {
  const tenantName: string = event['queryStringParameters']['tenant']
  let state: string | undefined = event['queryStringParameters']['state']

  const cookieStr = event.headers['cookie']
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

  const processedState = createState(sessionId, state, stateExpireLength, jwtExpireLength, tenantName)
  const REDIRECT_URL = getRedirectUrl(BASE_URL)
  const url =
    'https://' + COGNITO_DOMAIN + '.auth.' + COGNITO_REGION + '.amazoncognito.com' +
    '/oauth2/authorize' +
    '?identity_provider=' + TENANT_SAML_NAME_PREFIX + '.' + tenantName +
    '&redirect_uri=' + REDIRECT_URL +
    '&response_type=CODE' +
    '&state=' + processedState +
    '&client_id=' + COGNITO_USER_CLIENT_ID
  //&scope=aws.cognito.signin.user.admin email openid phone profile

  return {
    statusCode: 302,
    headers: {
      'Location': url,
      'Set-Cookie': cookie.serialize('session_id', sessionId),
    },
    body: '',
  }

}

function jwtSign( obj: any ) {
  return jwt.sign(obj, privateKey, {algorithm: 'RS512'})
}

function createState( sessionId: string, stateUrl: string, stateExpireLength: number, jwtExpireLength: number, tenant: string ) {
  const expire = Math.floor(Date.now() / 1000) + stateExpireLength  //60 * 60, user must finish the login in 1h
  return jwtSign({
    expire: expire,
    session: sessionId,
    state: stateUrl,
    jwtExpire: jwtExpireLength,
    tenant: tenant,
  })
}

