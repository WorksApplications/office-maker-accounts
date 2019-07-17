/**
 *
 * @param statusCode: int
 * @param body: string | any.
 * @param headers
 * @return {{headers: *, body: *, statusCode: *}|{body: *, statusCode: *}}
 */
export default function(statusCode: number, body?: string | object, headers?: object){
  let bodyValue = ''
  if (typeof body === 'string') bodyValue = body
  if (typeof body === 'object') bodyValue = JSON.stringify(body)
  console.log('=-----------------------=')
  console.log('Response body: ' + bodyValue)
  console.log('=-----------------------=')
  if (typeof headers !== 'object') {
    return {
      statusCode: statusCode,
      body: bodyValue
    }
  } else {
    return {
      statusCode: statusCode,
      headers: headers,
      body: bodyValue
    }
  }
}
