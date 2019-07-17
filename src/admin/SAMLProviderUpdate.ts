import {ProviderDetails, updateCognitoProvider, validateOwnership} from '@/cognito/cognitoAdminOperations'
import response from '@/lambdaResponse'
import {validateTenant} from '@/tenantNameRegex'

export async function handler( event: any ) {
  const userName = event['requestContext']['authorizer']['claims']['cognito:username']
  const tenantName: string = event['pathParameters']['tenant']
  const body = JSON.parse(event['body'])
  const metadata: string | undefined = body['metadata']
  const metadataUrl: string | undefined = body['metadataUrl']
  const attributeMap: any = body['attributeMap']
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

  let providerDetails: ProviderDetails
  if ( metadata ) {
    try {
      providerDetails = {'MetadataFile': metadata}
    } catch (e) {
      return response(400, 'fail saving metadata')
    }
  } else {
    if ( !metadataUrl ) {
      return response(400, 'one of metadata and metadataUrl must be provided')
    }
    providerDetails = {'MetadataURL': metadataUrl}
  }

  try {
    await updateCognitoProvider(samlProviderName, providerDetails, attributeMap)
    return response(200)
  } catch (e) {
    return response(500, 'fail update cognito provider: ' + e.message || JSON.stringify(e))
  }
}
