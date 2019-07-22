/**
 *
 * @param origin: headers.origin
 * @param statusCode: int
 * @param body: string | any.
 * @param headers
 * @return {{headers: *, body: *, statusCode: *}|{body: *, statusCode: *}}
 */

export default function( origin: string, statusCode: number, body?: string | object, headers?: HeaderObject){
  const ALLOWED_ORIGINS = (process.env.WWW_BASE_URL as string).split(',')
  let return_origin = '*'
  if(origin && ALLOWED_ORIGINS.includes(origin)){
    return_origin = origin
  }
  let bodyValue = ''
  if (typeof body === 'string') bodyValue = body
  if (typeof body === 'object') bodyValue = JSON.stringify(body)

  console.log('=-----------------------=')
  console.log('Response body: ' + bodyValue)
  console.log('=-----------------------=')

  if (typeof headers !== 'object') {
    headers = {}
  }

  headers['Access-Control-Allow-Origin'] = return_origin
  if (return_origin !== '*') {
    headers['Access-Control-Allow-Credentials'] = true
  }

  return {
    statusCode: statusCode,
    headers: headers,
    body: bodyValue
  }
}

export interface HeaderObject {
  'Access-Control-Allow-Origin'?: string
  'Access-Control-Allow-Credentials'?: boolean
  [key: string]: any
}
