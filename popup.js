// popup.js
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

      // Encriptar y almacenar el token de acceso y el refresh token en el sessionStorage
      const encryptedAccessToken = CryptoJS.AES.encrypt(session.getAccessToken().getJwtToken(), 'encryption-key').toString();
      const encryptedRefreshToken = CryptoJS.AES.encrypt(session.getRefreshToken().getToken(), 'encryption-key').toString();
      sessionStorage.setItem('accessToken', encryptedAccessToken);
      sessionStorage.setItem('refreshToken', encryptedRefreshToken);

      // Establecer un temporizador para renovar el token de acceso antes de que expire
      const accessTokenExpiration = session.getAccessToken().getExpiration() * 1000; // Convertir a milisegundos
      const timeRemaining = accessTokenExpiration - Date.now();
      setTimeout(() => refreshAccessToken(email), timeRemaining - 60000); // Renovar 1 minuto antes de la expiración

      // Actualizar el contenido del popup después del inicio de sesión
      handleLoggedInState();
    },
    onFailure: (err) => {
      console.error('Error en el inicio de sesión', err);
      // Aquí puedes mostrar un mensaje de error al usuario
    },
  });
});

// Función para manejar el contenido del popup después del inicio de sesión
function handleLoggedInState() {
  const encryptedAccessToken = sessionStorage.getItem('accessToken');
  if (encryptedAccessToken) {
    // Desencriptar el token de acceso utilizando la clave de encriptación
    const decryptedAccessToken = CryptoJS.AES.decrypt(encryptedAccessToken, 'encryption-key').toString(CryptoJS.enc.Utf8);
    if (!decryptedAccessToken) {
      console.error('Error al desencriptar el token de acceso');
      // Aquí puedes mostrar un mensaje de error al usuario
      return;
    }

    // Mostrar el contenido de bienvenida y ocultar el formulario de inicio de sesión
    document.getElementById('welcome-section').style.display = 'block';
    document.getElementById('login-form').style.display = 'none';
    // Mostrar el formulario para agregar cuenta
    document.getElementById('add-account-section').style.display = 'block';

   } else {
    // Mostrar el formulario de inicio de sesión y ocultar el contenido de bienvenida y el formulario para agregar cuenta
    document.getElementById('welcome-section').style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('add-account-section').style.display = 'none';
  }
}


// Función para renovar el token de acceso
function refreshAccessToken(email) {
  const storedRefreshToken = sessionStorage.getItem('refreshToken');

  if (!storedRefreshToken) {
    // No se encontró el refresh token, redirigir al usuario al inicio de sesión nuevamente
    console.log('Refresh token no encontrado. Redirigiendo al inicio de sesión.');
    // Aquí puedes redirigir al usuario a la página de inicio de sesión
    return;
  }

  // Configurar la región y otros detalles de AWS Cognito
  const poolData = {
    UserPoolId: 'us-east-2_VWVFvffA8',
    ClientId: '2r1mfggq9g4kcevm2f4kiu73us',
  };

  const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

  const userData = {
    Username: email,
    Pool: userPool,
  };

  const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
  const refreshCognitoToken = new AmazonCognitoIdentity.CognitoRefreshToken({ RefreshToken: storedRefreshToken });

  // Renovar el token de acceso
  cognitoUser.refreshSession(refreshCognitoToken, (err, session) => {
    if (err) {
      console.error('Error al renovar el token de acceso', err);
      // Aquí puedes mostrar un mensaje de error al usuario
      return;
    }

    console.log('Token de acceso renovado', session);
    // Actualizar el token de acceso almacenado en el sessionStorage
    const encryptedAccessToken = CryptoJS.AES.encrypt(session.getAccessToken().getJwtToken(), 'encryption-key').toString();
    sessionStorage.setItem('accessToken', encryptedAccessToken);

    // Establecer un nuevo temporizador para la próxima renovación
    const accessTokenExpiration = session.getAccessToken().getExpiration() * 1000; // Convertir a milisegundos
    const timeRemaining = accessTokenExpiration - Date.now();
    setTimeout(() => refreshAccessToken(email), timeRemaining - 60000); // Renovar 1 minuto antes de la expiración
  });
}

// Función para agregar una cuenta utilizando el token de acceso
function addAccount() {
  var decryptedAccessToken;
  const encryptedAccessToken = sessionStorage.getItem('accessToken');
  if (encryptedAccessToken) {
    // Desencriptar el token de acceso utilizando la clave de encriptación
    decryptedAccessToken = CryptoJS.AES.decrypt(encryptedAccessToken, 'encryption-key').toString(CryptoJS.enc.Utf8);
    if (!decryptedAccessToken) {
      console.error('Error al desencriptar el token de acceso');
      // Aquí puedes mostrar un mensaje de error al usuario
      return;
    }
  }
  const formData = {
    "numcta": "5055404484895168",
    "pass": "mypassword",
    "AccountName": "Eduard Bancolombia",
    "tipoDoc": "DNI",
    "validated": true,
    "numDoc": "1030766849",
    "bank": "Bancolombia",
    "password": "myaccountpassword"
  };

  const requestOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${decryptedAccessToken}`
    },
    body: JSON.stringify(formData)
  };

  //console.log("acess token: ", accessToken);

  // Consumir la API Gateway para agregar la cuenta
  console.log("requestOptions: ",requestOptions);
  fetch('https://qpfg5gn4rk.execute-api.us-east-2.amazonaws.com/pruebas/addCtaBank', requestOptions)
    .then(response => response.json())
    .then(data => {
      // Manejar la respuesta del servidor
      console.log('Respuesta del servidor:', data);
    })
    .catch(error => {
      console.error('Error en la solicitud:', error);
      // Aquí puedes mostrar un mensaje de error al usuario
    });
}

// Cuando se carga el popup, verificar si el usuario ya está logueado
document.addEventListener('DOMContentLoaded', () => {
  handleLoggedInState();
});

// Manejar el envío del formulario para agregar cuenta
document.getElementById('add-account-form').addEventListener('submit', (event) => {
  event.preventDefault();
  addAccount();
});
