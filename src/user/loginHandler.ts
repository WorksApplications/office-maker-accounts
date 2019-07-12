import {getRedirectUrl} from '@/generateUrl'
import response from '@/lambdaResponse'
import axios from 'axios'

const jwt = require('jsonwebtoken')
const cookie = require('cookie')
const qs = require('qs')

const COGNITO_DOMAIN = process.env.COGNITO_DOMAIN
const COGNITO_REGION = process.env.COGNITO_REGION
const BASE_URL = process.env.BASE_URL as string
const REDIRECT_URL = getRedirectUrl(BASE_URL)
const COGNITO_USER_CLIENT_ID = process.env.COGNITO_USER_CLIENT_ID
const privateKey = process.env.privateKey
const publicKey = process.env.publicKey

const cognitoDomain = 'https://' + COGNITO_DOMAIN + '.auth.' + COGNITO_REGION + '.amazoncognito.com'

export async function handler( event: any ) {
  console.log(event)
  const code: string | undefined = event['queryStringParameters']['code']
  if ( typeof code === 'undefined' ) return response(400, 'Authorization Code not found')

  const cookieStr = event.headers['cookie']
  if ( typeof cookieStr === 'undefined' ) {
    const cookies = cookie.parse(cookieStr)
    if ( !cookies['session_id'] )
      return response(400, 'Necessary cookie session_id is not found')
  }

  const sessionId = cookie.parse(cookieStr)['session_id']

  const state = event.queryStringParameters.state
  try {
    const data = await reverseState(state, sessionId)
    const originState = data.state
    const jwtExpireLength = data.jwtExpireLength
    //todo: change to tenant domain
    const tenant = data.tenant

    const token = await oAuthGetTokenWithCode(code)
    const userInfo = await oAuthGetUserInfo(token.data.access_token)
    console.log('result: ' + JSON.stringify(userInfo.data))
    const userId = userInfo.data.sub
    const role = userInfo.data.role
    if ( userId ) {
      const jwt = jwtSign({
        exp: Math.floor(Date.now() / 1000) + jwtExpireLength,
        userId: userId,
        role: role ? role : 'Normal',
        tenantDomain: tenant,
      })
      return {
        statusCode: 302,
        headers: {
          'Location': originState,
          'Set-Cookie': 'jwt=' + JSON.stringify({accessToken: jwt}),
        },
        body: '',
      }
    }
  } catch (e) {
    console.error(e)
    return response(401, JSON.stringify(e.message))
  }

}

function jwtSign( obj: any ) {
  return jwt.sign(obj, privateKey, {algorithm: 'RS512'})
}

interface ReverseStruct {
  state: string,
  jwtExpireLength: number,
  tenant: string
}

function reverseState( state: string, session: string ): Promise<ReverseStruct> {
  return new Promise(( resolve, reject ) => {
    jwt.verify(state, publicKey, {
      algorithm: ['RS512'],
    }, ( err: any, data: any ) => {
      if ( err ) {
        console.error(err)
        reject(new Error('jwt verify failed'))
      }
      const currentTime = Math.floor(Date.now() / 1000)
      if ( currentTime > data.expire ) {
        reject(new Error('session expired'))
      }

      if ( session !== data.session ) {
        reject(new Error('session not matched'))
      }
      console.log('-----------')
      console.log(data)
      console.log('-----------')
      resolve({
        state: data.state,
        jwtExpireLength: data.jwtExpire,
        tenant: data.tenant,
      })
    })
  })

}

function oAuthGetTokenWithCode( code: string ) {
  const data = {
    grant_type: 'authorization_code',
    client_id: COGNITO_USER_CLIENT_ID,
    code: code,
    scope: 'profile email phone openid aws.cognito.signin.user.admin',
    redirect_uri: REDIRECT_URL,
  }
  return axios({
    method: 'post',
    url: cognitoDomain + '/oauth2/token',
    data: qs.stringify(data),
  })
}

function oAuthGetUserInfo( accessToken: string ) {
  return axios({
    method: 'get',
    url: cognitoDomain + '/oauth2/userInfo',
    headers: {
      'Authorization': 'Bearer ' + accessToken,
    },
  })
}

function oAuthUpdateToken( refreshToken: string ) {
  return axios.post(
    cognitoDomain + '/oauth2/token',
    {
      grant_type: 'refresh_token',
      redirect_uri: REDIRECT_URL,
      refresh_token: refreshToken,
    },
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    },
  )
}
