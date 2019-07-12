import {blackList} from '@/tenantNameBlackList'

export async function validateTenant(tenantName: string){
  const tenant_regex = /^[a-z][a-z0-9-]*$/

  if ( tenantName.length < 4 ) {
    throw new Error('given tenantName is too short. Minimum length is 4')
  }
  if ( blackList.includes(tenantName) ) {
    throw new Error('given tenantName is reserved or not allowed')
  }
  if (tenant_regex.test(tenantName)) {
    return true
  }
  throw new Error('tenantName must start with lower case letter, and could only contains lower case letter,' +
    ' number and hyphen (-)')
}
