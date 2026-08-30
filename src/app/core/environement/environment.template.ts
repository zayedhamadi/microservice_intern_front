export const environment = {
  production: false,FRONTEND_PORT: 4200,
  apiUrl: 'http://localhost:8080',
  DISCOVERY_PORT: 8761,
  CONFIG_PORT: 8888,
  GATEWAY_PORT: 8080,
  EMPLOYEE_PORT: 8081,
  RECRUTEMENT_PORT:8082,

  keycloak: {
    url: 'http://localhost:8180',
    realm: 'employee-realm',
    clientId: 'employee-service',
    redirectUri: 'http://localhost:4200/callback',
    clientSecret: '__KEYCLOAK_CLIENT_SECRET__',
    issuerUri: 'http://localhost:8180/realms/employee-realm',
  },
};
