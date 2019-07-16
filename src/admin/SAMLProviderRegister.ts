import {
  createCognitoProvider, deleteCognitoProvider, ProviderDetails, validateOwnership,
} from '@/cognito/cognitoAdminPoolOperations'
import {createSAMLInfo, deleteSAMLInfo} from '@/db/dynamoAdminOperations'
import response from '@/lambdaResponse'
import {validateTenant} from '@/tenantNameRegex'

export async function handler (event: any) {
  const userName = event['requestContext']['authorizer']['claims']['cognito:username']
  const tenantName: string = event['queryStringParameters']['tenant']
  const metadata: string | undefined = event['body']['metadata']
  const metadataUrl: string | undefined = event['body']['metadataUrl']
  const attributeMap: any = event['body']['attributeMap']
  const TENANT_SAML_NAME_PREFIX = process.env.TENANT_SAML_NAME_PREFIX
  const samlProviderName = TENANT_SAML_NAME_PREFIX + '.' + tenantName

  try{
    //fast fail
    await Promise.all([
      validateTenant(tenantName),
      validateOwnership(userName, tenantName)
    ])
  } catch (e) {
    return response(400, e.message)
  }

  let providerDetails: ProviderDetails
  if (metadata){
    try{
      providerDetails = {
        'MetadataFile': metadata
      }
    } catch (e) {
      return response(400, 'fail saving metadata')
    }
  } else {
    if (!metadataUrl){
      return response(400, 'one of metadata and metadataUrl must be provided')
    }
    providerDetails = {
      'MetadataURL': metadataUrl
    }
  }



  /**
   * - add to dynamo record
   * - link to cognito admin pool
   */

  try{
    //todo: identities is currently not support.
    await createSAMLInfo(tenantName, samlProviderName)
    await createCognitoProvider(samlProviderName, providerDetails, attributeMap)
    return response(200)
  } catch (e) {
    await rollback(tenantName, samlProviderName).catch(e => {
      return response(500, e.message)
    })
  }

}

async function rollback(tenantName: string, samlProviderName: string ) {
  const errs: Array<string> = []
  try{
    await deleteCognitoProvider(samlProviderName)
  } catch (e){
    errs.push('fail to rollback delete cognito provider: ' +  e.message || JSON.stringify(e))
  }
  try {
    await deleteSAMLInfo(tenantName)
  } catch (e) {
    errs.push('fail to rollback delete tenant info: ' + e.message || JSON.stringify(e))
  }
  if (errs.length > 0){
    throw new Error(JSON.stringify(errs))
  }
}
