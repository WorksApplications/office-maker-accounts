import {getRedirectUrl} from '@/generateUrl'
import response from '@/lambdaResponse'


export const handler = async ( event: any ) => {
  console.log(event)
  const COGNITO_DOMAIN = process.env.COGNITO_DOMAIN
  const COGNITO_REGION = process.env.COGNITO_REGION
  const USER_POOL_ID = process.env.USER_POOL_ID
  const BASE_URL = process.env.BASE_URL as string
  let REDIRECT_URL = getRedirectUrl(BASE_URL)
  const clientInfo: ClientInfo = {
    ACS_URL: 'https://' + COGNITO_DOMAIN + '.auth.' + COGNITO_REGION + '.amazoncognito.com/saml2/idpresponse',
    Entity_ID: 'urn:amazon:cognito:sp:' + USER_POOL_ID,
    Start_URL: '' + REDIRECT_URL,
  }
  return response(event['headers']['origin'], 200, JSON.stringify(clientInfo))
}

interface ClientInfo {
  ACS_URL: string
  Entity_ID: string
  Start_URL: string
}
