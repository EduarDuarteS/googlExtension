
document.getElementById('login-form').addEventListener('submit', (event) => {
    event.preventDefault();
  
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
  
    // Configurar la región y otros detalles de AWS Cognito
    const poolData = {
      UserPoolId: '',
      ClientId: '',
    };
  
    const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
  
    const authenticationData = {
      Username: email,
      Password: password,
    };
  
    const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);
  
    const userData = {
      Username: email,
      Pool: userPool,
    };
  
    const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
  
    // Intentar iniciar sesión
    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: (session) => {
        console.log('Inicio de sesión exitoso', session);
        // Aquí puedes redirigir al usuario a una página de tu elección
      },
      onFailure: (err) => {
        console.error('Error en el inicio de sesión', err);
        // Aquí puedes mostrar un mensaje de error al usuario
      },
    });
  });
  