# office-maker-accounts
![Graph](./office-maker-tenants.png)

## System Require
[Node.js](https://nodejs.org/) (>= 10)
[Serverless Frameworks](https://serverless.com/framework/)
[npm](https://www.npmjs.com/)

### Require when Test
[jq](https://stedolan.github.io/jq/) Build-in for Most Linux
[yq](https://mikefarah.github.io/yq/)

## Installing

 ```npm install```

## Resource Created on AWS
- 2 DynamoDB Table
- 2 Cognito User Pool with 1 Client Each
- 1 API Gateway
- Lambdas
- Related Policies and Roles

## Description of Files
- babel.config.js
Used for smoke test, test content is in folder `./test-flow/`

- config.sample.yaml
Sample file of config file, need to create a copy named `config.yaml` and then fill the parameters

- package.json
For npm or yarn

- tsconfig.json
Config file for `typescript`. Used when coding, test and packaging

- webpack.config.js
Used when serverless package and deploy

- cloudformation/cf_for_serverless.yaml
CloudFormation File used for Serverless.

- script/post-deploy.sh
Bash script need to run after deploy, to add additional setting not supported by CloudFormation

- script/test.sh
Bash script used for test. Fetch environment parameters before test.

- src/
Source file folder

- test/
Unit test folder

- test-flow/
Smoke test

## Name Explanation
Administrator: who integrate worksmap with his own company
User Manager: able to set permission of all users in his own tenant
Floor Manager: able to modify floor
 
## Provided Functions
### For Logged In Administrator
- add, delete, get tenant belongs to him
- add, update, get, delete saml Provider to worksmap
- set (add, update) jwt expire length, login expire length, redirect url
  cannot delete directly (delete when tenant is deleted)
- (WIP) add, update, delete ip whitelist for this tenant
- (WIP) add, update, delete user manager for the tenant

### For SAML Login
- redirect to responding SAML idp
- response to saml callback
   
## Restriction
- Administrator could not own more than 1 tenant

## Limitaion


## Configuration and Presequence
- Prepare a custom domain for API Gateway.

- Store the public key and private key on Systems Manager > Parameter Store

- Create config.yaml
```cp config.sample.yaml config.yaml```
  - COGNITO
    Enter Preferred Cognito Custom domain
  - API_BASE_URL
    default domain for office-maker api.
    e.g., `api.example.com`
  - WWW_TEMPLATE_URL
    template url, if base url for domain `xxx` is `www.example.com/xxx`, the url is `www.example.com/<tenant>`

  - SSM
    Enter the public key name and private key stored in ssm. Replace `key_name_to_use` to your key name

## Deployment
```sls deploy -s <stage name>```
```bash ./script/post-deploy.sh```

## Removement
```sls remove -s <stage name>```

## Authors

TODO

## Copyright

© 2017-Present WorksApplications CO.,LTD.

## License

[Apache License 2.0](LICENSE)
