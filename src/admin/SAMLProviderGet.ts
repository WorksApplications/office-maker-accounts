import {getCognitoProvider, ProviderDetails, validateOwnership} from '@/cognito/cognitoAdminPoolOperations'
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
    return response(400, e.message)
  }

  try {
    const data: any = await getCognitoProvider(samlProviderName)
    let body: ProviderDetails
    if (data.IdentityProvider.ProviderDetails.MetadataURL){
      body = {
        'MetadataURL': data.IdentityProvider.ProviderDetails.MetadataURL
      }
    } else {
      body = {
        'MetadataFile': data.IdentityProvider.ProviderDetails.MetadataFile
      }
    }
    return response(200, body)
  } catch (e) {
    return response(500, e.message || JSON.stringify(e))
  }
}
