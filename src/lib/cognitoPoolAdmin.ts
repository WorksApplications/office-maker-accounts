import {
  AuthenticationDetails, CognitoUser, CognitoUserAttribute, CognitoUserPool, CognitoUserSession,
} from 'amazon-cognito-identity-js'

export interface signUpOptions {
  attributeList?: Array<CognitoUserAttribute>,
  validationData?: Array<any>
}

export interface CognitoResultWithSession {
  data: CognitoUserSession,
  cognitoUser: CognitoUser,
}

export default class CognitoPoolAdmin {
  private readonly poolId: string
  private readonly clientId: string

  private readonly userPool: CognitoUserPool
  constructor( {poolId, clientId}: { poolId: string, clientId: string }){
    this.poolId = poolId
    this.clientId = clientId
    const poolData = {
      UserPoolId: this.poolId,
      ClientId: this.clientId
    };
    this.userPool = new CognitoUserPool(poolData)

  }

  public signUp(userName: string, password: string, options?: signUpOptions): Promise<any> {
    const attributeList: Array<CognitoUserAttribute> = (options && options.attributeList)?options.attributeList:[]
    const validationData = (options && options.validationData)?options.validationData:[]
    return new Promise((resolve, reject) => {
      if(!this.userPool){
        reject(new Error('userPool is not initialized'))
        return
      }
      if (options)
      this.userPool.signUp(userName, password, attributeList, validationData, (err: any, data: any) => {
        if (err){
          reject(err)
          return;
        }
        resolve(data)
      });
    })
  }

  public confirmRegistration(code: string, username?: string, user?: CognitoUser): Promise<CognitoResultWithSession> {
    return new Promise( (resolve, reject) => {
      let cognitoUser: CognitoUser
      if (!user) {
        if (!this.userPool){
          reject(new Error('userPool is not initialized.'))
          return
        }
        if (!username){
          reject(new Error('parameter is missing'))
          return
        }
        const userData = {
          Username: username,
          Pool: this.userPool
        }
        cognitoUser = new CognitoUser(userData)
      }else{
        cognitoUser = user
      }
      cognitoUser.confirmRegistration(code, true, (err, data) => {
        if (err){
          reject(err.message || JSON.stringify(err))
          return
        }
        resolve({
          data: data,
          cognitoUser: cognitoUser
        })
      })
    })
  }

  public resendConfirmationCode() {
    //todo
  }

  public changePassword(cognitoUser: CognitoUser, oldPassword: string, newPassword: string){
    return new Promise((resolve, reject) => {
      cognitoUser.changePassword(oldPassword, newPassword, function(err, result){
        if (err) {
          reject(err.message || JSON.stringify(err))
          return
        }
        resolve({
          data: result
        })
      })
    })

  }

  public signIn(userName: string, password: string): Promise<CognitoResultWithSession> {
    return new Promise( (resolve, reject) => {
      const authenticationData = {
        Username: userName,
        Password: password,
      }
      const authenticationDetails = new AuthenticationDetails(authenticationData)
      const userData = {
        Username: userName,
        Pool: this.userPool
      }
      const cognitoUser = new CognitoUser(userData)
      cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: function (data: CognitoUserSession) {
          resolve({
            data: data,
            cognitoUser: cognitoUser
          })
        },
        onFailure: function(err) {
          console.log(err)
          reject(err)
        },
        newPasswordRequired: function(userAttributes, requiredAttributes) {
          delete userAttributes.email_verified
          reject({
            type: 'newPasswordRequired',
            userAttributes: userAttributes,
            requiredAttributes: requiredAttributes,
            cognitoUser: cognitoUser,
          })
        }
      })
    })
  }

  public completeNewPasswordChallenge(cognitoUser: CognitoUser, newPassword: string, userAttributes: CognitoUserAttribute[]): Promise<CognitoResultWithSession> {
    return new Promise((resolve, reject) => {
      cognitoUser.completeNewPasswordChallenge(newPassword, userAttributes, {
        onSuccess: function( data ) {
          resolve({
            data: data,
            cognitoUser: cognitoUser
          })
        },
        onFailure: function( err ) {
          reject(err)
        }
      })
    })
  }
}

