import CognitoPoolAdmin from '@/lib/cognitoPoolAdmin'

global.fetch = require('node-fetch')

export const signIn = async (poolId, clientId, username, password, newPassword) => {
  let cognitoAdmin = new CognitoPoolAdmin({
    poolId: poolId,
    clientId: clientId,
  })
  try {
    const data = await cognitoAdmin.signIn(username, password)
    return data.data
  } catch (err) {
    if (err.type && err.type === 'newPasswordRequired') {
      await cognitoAdmin.completeNewPasswordChallenge(err.cognitoUser, newPassword, err.userAttributes)
    }
    const data = await cognitoAdmin.signIn(username, newPassword)
    return data.data
  }
}
