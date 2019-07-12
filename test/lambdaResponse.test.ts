import * as chai from 'chai'
import {expect} from 'chai'
import response from '../src/lambdaResponse'

const chaiAsPromised = require('chai-as-promised')


chai.use(chaiAsPromised)

interface ResponseStruct {
  statusCode: number
  body?: string | object
  headers?: object
}

describe('response', function () {
  const testItems = [
    {
      'statusCode': 200,
      'body': 'string body with 200 code',
    },
    {
      'statusCode': 400,
      'body': 'string body with 400 code',
    },
    {
      'statusCode': 200,
      'body': {
        'item': 'object body',
      },
    },
    {
      'statusCode': 302,
      'headers': {'Location': 'some url'},
      'body': 'redirect body',
    },
  ]
  it('test result', async () => {
    testItems.forEach(( item ) => {
      let result = item
      result.body = typeof item.body === 'object' ? JSON.stringify(item.body) : (item.body ? item.body : '')

      if ( item.body && item.headers ) {
        expect(response(item.statusCode, item.body, item.headers)).to.be.deep.equals(result)
        return
      }
      if ( item.body ) {
        expect(response(item.statusCode, item.body)).to.be.deep.equals(result)
        return
      }
      if ( item.headers ) {
        expect(response(item.statusCode, item.body, item.headers)).to.be.deep.equals(result)
      }
      expect(response(item.statusCode)).to.be.deep.equals(result)
    })
  })
})
