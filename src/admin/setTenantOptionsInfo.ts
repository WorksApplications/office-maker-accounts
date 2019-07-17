import {validateOwnership} from '@/cognito/cognitoAdminOperations'
import {setTenantOptionsInfo} from '@/db/dynamoAdminOperations'
import response from '@/lambdaResponse'

interface BodyParametersForOptions {
  enableLoginFree: string | boolean
  loginFreeIPs: string[] | undefined
  enableLoginRestrict: string | boolean
  loginRestrictIPs: string[] | undefined
  bufferTime: string
}

/**
 * @param event
 * @return {{headers: *, body: *, statusCode: *}|{body: *, statusCode: *}}
 */
export async function handler( event: any ) {
  console.log(event)
  const userName = event['requestContext']['authorizer']['claims']['cognito:username']
  const tenantName = event['pathParameters']['tenant_name']

  try {
    await validateOwnership(userName, tenantName)
  } catch (e) {
    return response(409, 'user don\'t owns the tenant')
  }

  let body
  try {
    body = JSON.parse(event['body'])
  } catch (e) {
    return response(400, 'API requires \'application/json\' style body')
  }

  let enableLoginFree: boolean = false
  let loginFreeIPs: string[] = []
  let enableLoginRestrict: boolean = false
  let loginRestrictIPs: string[] = []
  let bufferTime: string = process.env.DEFAULT_LOGIN_BUFFER_TIME as string
  if ( body['enableLoginFree'] && (body['enableLoginFree'] === 'true' || body['enableLoginFree'] === true) ) {
    enableLoginFree = true
    if ( !body['loginFreeIPs'] ) {
      return response(400, 'login free IPs is not provided while login free is enabled')
    }
    loginFreeIPs = body['loginFreeIPs']
  }

  if ( body['enableLoginRestrict'] && (body['enableLoginRestrict'] === 'true' || body['enableLoginRestrict'] === true) ) {
    enableLoginRestrict = true
    if ( !body['loginRestrictIPs'] ) {
      return response(400, 'login restrict IPs is not provided while login restrict is enabled')
    }
    loginRestrictIPs = body['loginRestrictIPs']

    if ( !body['bufferTime'] ) {
      return response(400, 'login restrict IPs is not provided while login restrict is enabled')
    }
    bufferTime = body['bufferTime']
  }

  const bodyParameters: BodyParametersForOptions = {
    enableLoginFree: enableLoginFree,
    loginFreeIPs: loginFreeIPs,
    enableLoginRestrict: enableLoginRestrict,
    loginRestrictIPs: loginRestrictIPs,
    bufferTime: bufferTime,
  }


  try {
    await setTenantOptionsInfo(tenantName, enableLoginFree, enableLoginRestrict, loginFreeIPs, loginRestrictIPs, bufferTime)
    return response(200, JSON.stringify(bodyParameters))
  } catch (e) {
    console.log(e)
    return response(400, 'unexpected error when saving tenant info into cognito')
  }
}

