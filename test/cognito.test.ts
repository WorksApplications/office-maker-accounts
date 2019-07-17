import {
  adminPoolAddTenantInfo, createCognitoProvider, getCognitoProvider, userAbleToCreateTenant, validateOwnership,
} from '@/cognito/cognitoAdminOperations'
import * as chai from 'chai'
import {expect} from 'chai'
import AWS = require('aws-sdk')


const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)

const path = require('path')
let fs = require('fs')
let data = fs.readFileSync(path.resolve(__dirname, '../test-flow/env.json'), 'utf8')
let args = JSON.parse(data)
const COGNITO_POOL_ADMIN = process.env.COGNITO_POOL_ADMIN ? process.env.COGNITO_POOL_ADMIN : args.COGNITO_POOL_ADMIN
process.env.ADMIN_POOL_ID = COGNITO_POOL_ADMIN
process.env.USER_POOL_ID = process.env.COGNITO_POOL_USER ? process.env.COGNITO_POOL_USER : args.COGNITO_POOL_USER

let metadata = fs.readFileSync(path.resolve(__dirname, './metadata.xml'), 'utf8')
describe('cognito', function () {
  console.group('cognito')
  before('create two temp user', async () => {
    const cognito = new AWS.CognitoIdentityServiceProvider({apiVersion: '2016-04-18'});
    try {
      await cognito.adminCreateUser({
        UserPoolId: COGNITO_POOL_ADMIN,
        Username: 'no_body@example.com',
        TemporaryPassword: 'SomeTempP9-',
        UserAttributes: [
          {
            Name: 'email',
            Value: 'no_body@example.com',
          },
          {
            Name: 'email_verified',
            Value: 'True',
          },
        ],
      }).promise()
      await cognito.adminCreateUser({
        UserPoolId: COGNITO_POOL_ADMIN,
        Username: 'test_user@example.com',
        TemporaryPassword: 'SomeTempP9-',
        UserAttributes: [
          {
            Name: 'email',
            Value: 'test_user@example.com',
          },
          {
            Name: 'email_verified',
            Value: 'True',
          },
        ],
      }).promise()
    } catch (e) {
      console.log(e.message || JSON.stringify(e))
    }
  })

  it('user able to create', async () => {
    await expect(userAbleToCreateTenant('no_body@example.com')).to.be.fulfilled
  })

  it('user create tenant, then he owns it , and cannot create more', async () => {
    await expect(adminPoolAddTenantInfo('test_user@example.com', 'dummy-test')).to.be.fulfilled
    await expect(validateOwnership('test_user@example.com', 'dummy-test')).to.be.fulfilled
    await expect(userAbleToCreateTenant('test_user@example.com')).to.be.rejected
  })

  it('user add metadata', async () => {
    await expect(
      createCognitoProvider(
        'worksmap.dummy-test',
        {
          'MetadataFile': metadata,
        },
        {
          'email': 'email',
        },
      )).to.be.fulfilled

    const data = await getCognitoProvider('worksmap.dummy-test')
    const file = data.IdentityProvider.ProviderDetails.MetadataFile
    expect(file).to.be.equals(metadata)

    // await expect(deleteCognitoProvider('worksmap.dummy-test')).to.be.fulfilled
  })

  console.groupEnd()
})
