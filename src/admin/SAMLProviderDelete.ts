import {deleteCognitoProvider, validateOwnership} from '@/cognito/cognitoAdminOperations'
import {deleteSAMLInfo} from '@/db/dynamoAdminOperations'
import response from '@/lambdaResponse'
import {validateTenant} from '@/tenantNameRegex'

export async function handler( event: any ) {
  const userName = event['requestContext']['authorizer']['claims']['cognito:username']
  const tenantName: string = event['pathParameters']['tenant']
  const TENANT_SAML_NAME_PREFIX = process.env.TENANT_SAML_NAME_PREFIX
  const samlProviderName = TENANT_SAML_NAME_PREFIX + '.' + tenantName

  try { //fast fail
    await Promise.all([
      validateTenant(tenantName),
      validateOwnership(userName, tenantName),
    ])
  } catch (e) {
    return response(event['headers']['origin'], 400, e.message)
  }

  try {
    await deleteCognitoProvider(samlProviderName)
    await deleteSAMLInfo(tenantName)
    return response(event['headers']['origin'], 200)
  } catch (e) {
    return response(event['headers']['origin'], 500, e.message || JSON.stringify(e))
  }
}
