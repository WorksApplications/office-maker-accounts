import Axios, {AxiosInstance} from 'axios'
import {expect} from 'chai'
import {signIn} from './signIn.js'

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
const should = chai.should()

/**
 * this test should only run after all items finished creation
 * smoke test
 * rest test
 */

const path = require('path')
let fs = require('fs')
let staticData = fs.readFileSync(path.resolve(__dirname, './env.json'), 'utf8')
let args = JSON.parse(staticData)
let username = process.env.TEST_USERNAME ? process.env.TEST_USERNAME : args.TEST_USERNAME
let password = process.env.TEMPORARY_PASSWORD ? process.env.TEMPORARY_PASSWORD : args.TEMPORARY_PASSWORD
let COGNITO_POOL_ADMIN = process.env.COGNITO_POOL_ADMIN ? process.env.COGNITO_POOL_ADMIN : args.COGNITO_POOL_ADMIN
let COGNITO_CLIENT_ADMIN = process.env.COGNITO_CLIENT_ADMIN ? process.env.COGNITO_CLIENT_ADMIN : args.COGNITO_CLIENT_ADMIN
let ENDPOINT = process.env.ENDPOINT ? process.env.ENDPOINT : args.ENDPOINT
process.env.DB_TENANT_NAME = process.env.DB_TENANT_NAME ? process.env.DB_TENANT_NAME : args.DB_TENANT_NAME
process.env.DB_USER_PRI_NAME = process.env.DB_USER_PRI_NAME ? process.env.DB_USER_PRI_NAME : args.DB_USER_PRI_NAME

let newPassword = 'TestTest123-'
let metadata = fs.readFileSync(path.resolve(__dirname, './idp-metadata.xml'), 'utf8')

let accessToken = 'eyJraWQiOiJlR3NPU0FuQ0xYcmJDTDA1YWdzVElQM3pcL2themc2RlIxZ05iVzZJYjc0VT0iLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJkY2UzYjUwYS02NDU2LTQ0NzItYmZhNy0xZmMxNjY1ODRkOGQiLCJhdWQiOiI1dDk5Ym45cTR0YzkwOHR1NXI3NzU0c2FsMyIsImV2ZW50X2lkIjoiNzJjYTQwZDUtZTBiNS00ZjhkLThiNDYtYzk4YzQ5NTcwNmNiIiwidG9rZW5fdXNlIjoiaWQiLCJhdXRoX3RpbWUiOjE1NjMzMzgzNzUsImlzcyI6Imh0dHBzOlwvXC9jb2duaXRvLWlkcC5hcC1ub3J0aGVhc3QtMS5hbWF6b25hd3MuY29tXC9hcC1ub3J0aGVhc3QtMV8zRXZhdXk4bG0iLCJjdXN0b206dGVuYW50IjoiZXhhbXBsZSIsImNvZ25pdG86dXNlcm5hbWUiOiJkY2UzYjUwYS02NDU2LTQ0NzItYmZhNy0xZmMxNjY1ODRkOGQiLCJleHAiOjE1NjMzNDE5NzUsImlhdCI6MTU2MzMzODM3NSwiZW1haWwiOiJ0ZXN0X2FkbWluQGV4YW1wbGUuY29tIn0.fCnUYiLQyEMK77saMEqCnXN4DnLfrsp-g9P1MabZUER9TfBghwNU-R3GqBjqdenx2OblRRoLF--GNW64QOTBJSXla2zLcID_BCl9avS2rVkgnpmP2T5Ekt68VhRHHrRZ-tJnLHSjh73dZi9_eQ8y1KDlAQMRxwBM0s1pMmsQ99Zn-yNCksGZeYJy1P8eGNpSqktLeOxDeLzsYK2FjiIvkFrmoi7MdGntOtEEz3qmaGaL9R_Xm89exl9T79T3T4v2n8_F8WQjGovUCCxp2EvzFTzDwmGCC007LWxd_ddDAzX8psseS2zmyFfgwtppzFHhgx4VwCV3oIBhVMf3faD10A'
let authSuccess = false

let axios: AxiosInstance

describe('tenant admin should do what he could do', function () {
  this.timeout(7000)
  // let accessToken = ''

  before(async () => {
    try {
      const data = await signIn(COGNITO_POOL_ADMIN, COGNITO_CLIENT_ADMIN, username, password, newPassword)
      accessToken = data.getIdToken().getJwtToken()
      console.log(accessToken)
      axios = Axios.create({
        baseURL: ENDPOINT,
        headers: {'Authorization': 'Bearer ' + accessToken},
        timeout: 5000,
      })
      authSuccess = true
    } catch (err) {
      throw new Error('fail authorize')
    }
  })

  const tenant_name_to_use = 'example'
  it('get tenant', async () => {
    try {
      const data = await axios.get('admin/tenants')
      expect(data.status, 'status matches').to.be.equals(200)
    } catch (e) {
      console.log(e.response)
      throw e
    }
  })
  it('check tenant', async () => {
    try {
      const data = await axios.head('admin/tenants/' + tenant_name_to_use)
      expect(data.status, 'status matches').to.be.equals(200)
    } catch (e) {
      console.log(e.response)
      throw e
    }

  })

  it('create tenant', async () => {
    const data = await axios.post('admin/tenants?tenant=' + tenant_name_to_use)
    expect(data.status).to.be.equals(200)

  })

  it('submit saml', async () => {
    console.group('submit saml')
    try {
      const data = await axios.post(`admin/providers?tenant=${tenant_name_to_use}`, {
        metadata: metadata,
        attributeMap: {
          'email': 'email',
          'role': 'roles',
        },
      })

      expect(data.status).to.be.equals(400)
      console.groupEnd()
    } catch (e) {
      console.log(e.response)
      throw e
    }

  })

  it('get saml', async () => {
    const data = await axios.get(`admin/providers/${tenant_name_to_use}`)
    expect(data.status).to.be.equals(200)
    expect(data.data.metadata).to.equals(metadata)
  })

  it('update saml', async () => {
    const data = await axios.post(`admin/providers/${tenant_name_to_use}`, {
      metadata: metadata,
      attributeMap: {
        'email': 'email',
        'role': 'roles',
      },
    })
    expect(data.status).to.be.equals(200)
  })

  it('update necessary info', async () => {
    const data = await axios.post(`admin/tenants/${tenant_name_to_use}/info/required`, {
      jwtExpireTime: '1800',
      stateExpireTime: '1800',
      redirectUrl: 'https://aws.amazon.com/jp/',
    })
    expect(data.status).to.be.equals(200)
  })

  it('update option info', async () => {
    const data = await axios.post(`admin/tenants/${tenant_name_to_use}/info/options`, {
      enableLoginFree: true,
      enableLoginRestrict: false,
      loginFreeIPs: ['221.249.116.206'],
      loginRestrictIPs: ['221.249.116.206'],
      bufferTime: '1800',
    })
    expect(data.status).to.be.equals(200)
  })

  it('try delete tenant', async () => {
    const data = await axios.delete('admin/tenants/' + tenant_name_to_use)
    expect(data.status).to.be.equals(200)
  })
})


// describe('tenant user should be able to get jwt flow', function(){
//   let cognitoUser = new CognitoPoolUser({
//
//   })
//   let axios = null;
//   before(function(done){
//     cognitoAdmin.signIn(username, password)
//       .then(data=> {
//         accessToken = data.data.getAccessToken().getJwtToken()
//         axios = Axios.create({
//           baseURL: ENDPOINT,
//           headers: {'Authorization': 'Bearer '+accessToken},
//           timeout: 5000,
//         })
//         done();
//       })
//       .catch(_ => {
//         password = newPassword
//         cognitoAdmin.signIn(username, password)
//           .then(data=> {
//             accessToken = data.data.getIdToken().getJwtToken()
//             axios = Axios.create({
//               baseURL: ENDPOINT,
//               headers: {'Authorization': 'Bearer ' + accessToken},
//               timeout: 5000
//             })
//             done();
//           })
//       })
//   })
// })
