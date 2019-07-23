import {getTenantOptionsInfo, queryTenantInfo} from '@/db/dynamoAdminOperations'
import response from '@/lambdaResponse'


export const handler = async ( event: any ) => {
  console.log(event)

  const tenantName = event['pathParameters']['tenant_name']

  let result = {} as any

  try {
    result['required'] = await queryTenantInfo(tenantName)
    result['option'] = await getTenantOptionsInfo(tenantName)

    console.debug(result)
    return response(event['headers']['origin'], 200, result)
  } catch (e) {
    console.error(e)
  }
}
