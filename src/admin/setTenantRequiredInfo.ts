import {validateOwnership} from '@/cognito/cognitoAdminOperations' // cognito adminGetUser
import {addTenantRequiredInfo} from '@/db/dynamoAdminOperations'   //dynamo putItem
import {getTenantBaseUrl} from '@/generateUrl'
import response from '@/lambdaResponse'


interface BodyParameters {
  jwtExpireTime?: string | undefined
  stateExpireTime?: string | undefined
  redirectUrl?: string | undefined
}

const defaultJwtExpireLength = 1800 //60*30 seconds = 30 minutes
const defaultStateExpireLength = 1800 //60*30 seconds = 30 minutes
const WWW_BASE_URL = process.env.WWW_BASE_URL as string // default

/**
 * @param event
 * @return {{headers: *, body: *, statusCode: *}|{body: *, statusCode: *}}
 */
export async function handler( event: any ) {
  const userName = event['requestContext']['authorizer']['claims']['cognito:username']
  const tenantName = event['pathParameters']['tenant_name']
  let body
  try {
    body = JSON.parse(event['body'])
  } catch (e) {
    return response(400, 'API requires \'application/json\' style body')
  }

  const defaultRedirectUrl = getTenantBaseUrl(WWW_BASE_URL, tenantName)
  const jwtExpireTime: string = body['jwtExpireTime'] ? body['jwtExpireTime'] : '' + defaultJwtExpireLength
  const stateExpireTime: string = body['stateExpireTime'] ? body['stateExpireTime'] : '' + defaultStateExpireLength
  const redirectUrl: string = body['redirectUrl'] ? body['redirectUrl'] : defaultRedirectUrl
  const bodyParameters: BodyParameters = {
    jwtExpireTime: jwtExpireTime,
    stateExpireTime: stateExpireTime,
    redirectUrl: redirectUrl,
  }

  try {
    await validateOwnership(userName, tenantName)
  } catch (e) {
    return response(409, 'user don\'t owns the tenant')
  }

  try {
    await addTenantRequiredInfo(tenantName, jwtExpireTime, stateExpireTime, redirectUrl)
    return response(200, JSON.stringify(bodyParameters))
  } catch (e) {
    console.log(e)
    return response(400, 'unexpected error when saving tenant info into cognito')
  }
}

