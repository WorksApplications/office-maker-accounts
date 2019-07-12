import CognitoPoolAdmin from '../src/lib/cognitoPoolAdmin'
import Axios from 'axios'
import {expect} from 'chai'

global.fetch = require('node-fetch')
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
let data = fs.readFileSync(path.resolve(__dirname, './env.json'), 'utf8')
let args = JSON.parse(data)
let username = process.env.TEST_USERNAME?process.env.TEST_USERNAME:args.TEST_USERNAME
let password = process.env.TEMPORARY_PASSWORD?process.env.TEMPORARY_PASSWORD:args.TEMPORARY_PASSWORD
let COGNITO_POOL_ADMIN = process.env.COGNITO_POOL_ADMIN?process.env.COGNITO_POOL_ADMIN:args.COGNITO_POOL_ADMIN
let COGNITO_CLIENT_ADMIN = process.env.COGNITO_CLIENT_ADMIN?process.env.COGNITO_CLIENT_ADMIN:args.COGNITO_CLIENT_ADMIN
let ENDPOINT = process.env.ENDPOINT?process.env.ENDPOINT:args.ENDPOINT

let  newPassword = 'TestTest123-'


describe('tenant admin should do what he could do', function () {
  this.timeout(7000)
  let accessToken = ''
  let cognitoAdmin = new CognitoPoolAdmin({
    poolId: COGNITO_POOL_ADMIN,
    clientId: COGNITO_CLIENT_ADMIN
  })
  let axios = null;
  before(async () => {
    try {
      const data = await cognitoAdmin.signIn(username, password)
      accessToken = data.data.getAccessToken().getJwtToken()
      axios = Axios.create({
        baseURL: ENDPOINT,
        headers: {'Authorization': 'Bearer ' + accessToken},
        timeout: 5000,
      })
    } catch (err) {
      if (err.type && err.type === 'newPasswordRequired') {
        await cognitoAdmin.completeNewPasswordChallenge(err.cognitoUser, newPassword, err.userAttributes)
      }
      const data = await cognitoAdmin.signIn(username, newPassword)
      accessToken = data.data.getIdToken().getJwtToken()
      axios = Axios.create({
        baseURL: ENDPOINT,
        headers: {'Authorization': 'Bearer ' + accessToken},
        timeout: 5000,
      })
    }
  })

  const tenant_name_to_use = 'example'
  it('check tenant', async () => {

    const data = await axios.head('tenants/' + tenant_name_to_use)
    expect(data.status, 'status matches').to.be.equals(200)
  })

  it('create tenant', async () => {
    const data = axios.post('tenants?tenant=' + tenant_name_to_use)
    expect(data.status).to.be.equals(200)
  })

  it('try delete tenant', async () => {
    const data = axios.delete('tenants/' + tenant_name_to_use)
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
