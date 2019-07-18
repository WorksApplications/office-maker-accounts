import {adminPoolDeleteTenantInfo, deleteCognitoProvider, validateOwnership} from '@/cognito/cognitoAdminOperations'
import {
  deleteOwnedTenant, deleteSAMLInfo, deleteTenantOptionsInfo, deleteTenantRequiredInfo,
} from '@/db/dynamoAdminOperations'
import response from '@/lambdaResponse'
import {validateTenant} from '@/tenantNameRegex'

export async function handler( event: any ) {
  console.log(event)
  const username = event['requestContext']['authorizer']['claims']['cognito:username']
  const tenant = event['pathParameters']['tenant_name']

  const TENANT_SAML_NAME_PREFIX = process.env.TENANT_SAML_NAME_PREFIX
  const samlProviderName = TENANT_SAML_NAME_PREFIX + '.' + tenant

  try {
    await deleteOwnedTenant(username, tenant)
  } catch (e) {
    console.log('delete tenant in dynamodb failed: ' + e.message || JSON.stringify(e))
    return response(400, e.message || JSON.stringify(e))
  }

  let errors = []
  try {
    await Promise.all([
      adminPoolDeleteTenantInfo(username, tenant),
      deleteSAMLInfo(tenant),
      deleteCognitoProvider(samlProviderName),
      deleteTenantRequiredInfo(tenant),
      deleteTenantOptionsInfo(tenant),
    ])
  } catch (e) {
    //ignore not exist errors
    if (!e.message.includes('not exist')) {
      errors.push(e.message || JSON.stringify(e))
    }
  }
  if (errors.length > 0){
    return response(400, 'delete fail with following errors: ' + JSON.stringify(errors))
  }
  return response(200)
}
