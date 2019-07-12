import {addTenantDetailInfo, isOwnerOfTenant} from '@/db/dynamoOperations'
import {getTenantBaseUrl} from '@/generateUrl'
import response from '@/lambdaResponse'
import {validateTenant} from '@/tenantNameRegex'


interface BodyParameters {
  jwtExpireTime?: string | undefined
  stateExpireTime?: string | undefined
  redirectUrl?: string | undefined
}

const defaultJwtExpireLength = 172800 //60*60*24*2 seconds  = 2 days
const defaultStateExpireLength = 3600 //60*60 seconds = 1 hour
const BASE_URL = process.env.BASE_URL as string

/**
 * @param event
 * @return {{headers: *, body: *, statusCode: *}|{body: *, statusCode: *}}
 */
export async function handler( event: any ) {
  const userName = event['requestContext']['authorizer']['claims']['cognito:username']
  const tenantName = event['pathParameters']['tenant']
  const bodyStr: string = event['body']
  const bodyObj: any = {}
  bodyStr.split('&').forEach(str => {
    const [key, value] = str.split('=')
    bodyObj[key] = value
  })

  const defaultRedirectUrl = getTenantBaseUrl(BASE_URL, tenantName)
  const jwtExpireTime: string = bodyObj['jwtExpireTime'] ? bodyObj['jwtExpireTime'] : '' + defaultJwtExpireLength
  const stateExpireTime: string = bodyObj['stateExpireTime'] ? bodyObj['stateExpireTime'] : '' + defaultStateExpireLength
  const redirectUrl: string = bodyObj['redirectUrl'] ? bodyObj['redirectUrl'] : defaultRedirectUrl
  try {
    await validateTenant(tenantName)
  } catch (e) {
    return response(400, e.message)
  }

  try {
    await isOwnerOfTenant(userName, tenantName)
  } catch (e) {
    return response(409, 'user don\'t owns the tenant')
  }

  try {
    await addTenantDetailInfo(tenantName, jwtExpireTime, stateExpireTime, redirectUrl)
    return response(200)
  } catch (e) {
    console.log(e)
    return response(400, 'unexpected error when saving tenant info into cognito')
  }
}

