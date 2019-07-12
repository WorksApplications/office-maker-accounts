import response from '@/lambdaResponse'
import {isTenantNameAvailable} from '@/db/dynamoOperations'

export const handler = async (event: any) => {
  console.log(event)
  if (await ableToUseTenantName(event['pathParameters']['tenant_name'])){
    return response(200, 'able to use')
  }
  return response(400, 'unable to use')
}

async function ableToUseTenantName(tenantName: string | undefined) {
  if ( typeof tenantName !== 'string') {
    console.log('tenantName is not string')
    return false
  } else {
    let result = await isTenantNameAvailable(tenantName);
    console.log(result)
    return result
  }
}
