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

let accessToken = 'eyJraWQiOiJaZGprTzBpMDBMeVZcL0hjdHVhV2xjKzQyQ1dqUjlYaXEzc0ZnalFTbDhRTT0iLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiIyOTBmY2M5YS04ZmQ1LTQ4MDgtYjZjNS01YzJmNDY5OGU1MGMiLCJhdWQiOiIybms0bWI1MTV0a3RtMGZoNXExbGhhbDJnNiIsImV2ZW50X2lkIjoiYmEzNDRhNTktMThkOC00NThlLWE1ZjgtYTNjYjc0ZTgzZWRlIiwidG9rZW5fdXNlIjoiaWQiLCJhdXRoX3RpbWUiOjE1NjM0MzgzOTEsImlzcyI6Imh0dHBzOlwvXC9jb2duaXRvLWlkcC5hcC1ub3J0aGVhc3QtMS5hbWF6b25hd3MuY29tXC9hcC1ub3J0aGVhc3QtMV9oNElDdmdrNUgiLCJjb2duaXRvOnVzZXJuYW1lIjoiMjkwZmNjOWEtOGZkNS00ODA4LWI2YzUtNWMyZjQ2OThlNTBjIiwiZXhwIjoxNTYzNDQxOTkxLCJpYXQiOjE1NjM0MzgzOTEsImVtYWlsIjoidGVzdF9hZG1pbkBleGFtcGxlLmNvbSJ9.0k22eUbE4PwNva1p-IdcgrSjJacupYev2fkOjgXVnP6q1krVmwI6p7_XKi6Iw91W0WQl88Sb_ZSlndzZeciHM3X-cjSF4SbS8wklSsiZLIUeqy_xD_yUhBxPfKKOOWYENtNvbGPGTuwTkzYihMfAVgfqPCpQdUF0-Htk7MEaDeFVbdQT4NjvLOs975QPUsXFiwdcDmWiGFmGIKdaEUAQ25S5tFVXSJjl2DKKPYS0rJH-Ieh7_Kaz_DLLhFs8uS3C3DIGs6x_oFCR6kQBo7wHUBe89EexxZ8mDSu_dtkgZcG9cBvvv-isZpPsSOqg0ADvX8scBfGoXJ710awmELLq2w'
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
    let data
    try {
      data = await axios.get('admin/tenants')
    } catch (e) {
      console.log(e.response.data)
      throw e
    }
    expect(data.status, 'status matches').to.be.equals(200)
    expect(data.data, 'data matches nothing').to.be.deep.equals([])
  })
  it('check tenant', async () => {
    try {
      const data = await axios.head('admin/tenants/' + tenant_name_to_use)
      expect(data.status, 'status matches').to.be.equals(200)
    } catch (e) {
      console.log(e.response.data)
      throw e
    }
  })

  it('create tenant', async () => {
    const data = await axios.post('admin/tenants?tenant=' + tenant_name_to_use)
    expect(data.status).to.be.equals(200)
    console.log(data)
    await new Promise(resolve => setTimeout(resolve, 1000))
  })

  it('create another tenant reject', async () => {
    try {
      await axios.post('admin/tenants?tenant=' + 'some-other-tenant')
    } catch (e){
      expect(e.response.status).to.be.equals(403)
      expect(e.response.data).to.be.equals('user cannot create tenant')
    }
  })

  it('get updated tenant', async () => {
    let data
    try {
      data = await axios.get('admin/tenants')
    } catch (e) {
      console.log(e.response.data)
      throw e
    }
    console.log(data)
    expect(data.status, 'status matches').to.be.equals(200)
    expect(data.data, 'data matches nothing').to.be.deep.equals(['example'])

  })
  it('check tenant should be unable', async () => {
    try {
      await axios.head('admin/tenants/' + tenant_name_to_use)
    } catch (e) {
      expect(e.response.status).to.be.equals(400)
    }
  })

  it('submit saml', async () => {
    try {
      const data = await axios.post(`admin/providers?tenant=${tenant_name_to_use}`, {
        metadata: metadata,
        attributeMap: {
          'email': 'email',
          'custom:role': 'roles',
        },
      })
    } catch (e) {
      console.log(e.response.data)
      throw e
    }
  })

  it('submit saml again should be reject', async ()=>{
    try{
      const data = await axios.post(`admin/providers?tenant=${tenant_name_to_use}`, {
        metadata: metadata,
        attributeMap: {
          'email': 'email',
          'custom:role': 'roles'
        }
      })
    } catch (e) {
      console.log(e.response.data)
      expect(e.response.status).to.be.equals(400)
    }
  })

  it('get saml', async () => {
    const data = await axios.get(`admin/providers/${tenant_name_to_use}`)
    expect(data.status).to.be.equals(200)
    expect(data.data.MetadataFile).to.equals(metadata)
  })

  it('update saml', async () => {
    const data = await axios.post(`admin/providers/${tenant_name_to_use}`, {
      metadata: metadata,
      attributeMap: {
        'email': 'email',
        'custom:role': 'roles',
      },
    })
    expect(data.status).to.be.equals(200)
  })

  it('delete saml provider', async () => {
    try {
      const data = await axios.delete(`admin/providers/${tenant_name_to_use}`)
      expect(data.status).to.be.equals(200)
    } catch (e) {
      console.log(e.response.data)
      throw e
    }
  })

  it('submit saml after delete', async () => {
    try {
      const data = await axios.post(`admin/providers?tenant=${tenant_name_to_use}`, {
        metadata: metadata,
        attributeMap: {
          'email': 'email',
          'custom:role': 'roles',
        },
      })
    } catch (e) {
      console.log(e.response.data)
      throw e
    }
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
    try {
      const data = await axios.post(`admin/tenants/${tenant_name_to_use}/info/options`, {
        enableLoginFree: true,
        enableLoginRestrict: false,
        loginFreeIPs: ['221.249.116.206'],
        loginRestrictIPs: ['221.249.116.206'],
        bufferTime: '1800',
      })
      expect(data.status).to.be.equals(200)
    } catch (e) {
      console.log(e.response.data)
      throw e
    }
  })

  it('get saml info', async () => {
    try {
      const data = await axios.get('admin/client-info')
      expect(data.status).to.be.equals(200)
    } catch (e) {
      console.log(e.response.data)
      throw e
    }
  })

  it('try delete tenant', async () => {
    try {
      const data = await axios.delete('admin/tenants/' + tenant_name_to_use)
      expect(data.status).to.be.equals(200)
    } catch (e) {
      console.log(e.response.data)
      throw e
    }
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
