import {adminPoolDeleteTenantInfo, deleteCognitoProvider} from '@/cognito/cognitoAdminPoolOperations'
import {deleteOwnedTenant, deleteSAMLInfo, deleteTenantDetailInfo} from '@/db/dynamoAdminOperations'
import response from '@/lambdaResponse'

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
  //todo: delete cognito item
  try {
    await adminPoolDeleteTenantInfo(username, tenant)
    await deleteSAMLInfo(tenant)
    await deleteCognitoProvider(samlProviderName)
    await deleteTenantDetailInfo(tenant)
  } catch (e) {
    console.log('delete tenant in admin pool failed: ' + e.message || JSON.stringify(e))
    return response(400, e.message || JSON.stringify(e))
  }
  return response(200)
}
