import {
  CognitoUserPool, CognitoUserAttribute, CognitoUser, AuthenticationDetails, CognitoUserSession,
} from 'amazon-cognito-identity-js'

export interface signUpOptions {
  attributeList?: Array<CognitoUserAttribute>,
  validationData?: Array<any>
}

export interface CognitoResultWithSession {
  data: CognitoUserSession,
  cognitoUser: CognitoUser,
}

export default class CognitoPoolUser {
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


}

