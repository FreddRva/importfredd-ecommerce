import {
    startRegistration,
    RegistrationResponseJSON,
    startAuthentication,
    AuthenticationResponseJSON,
  } from '@simplewebauthn/browser';
  
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  
  export async function requestVerificationCode(email: string, mode?: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/auth/request-verification-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, ...(mode ? { mode } : {}) }),
    });
  
    const data = await res.json();
  
    if (!res.ok) {
      throw new Error(data.error || 'Error al solicitar el código de verificación.');
    }
  
    return data;
  }
  
  export async function registerPasskey(email: string, code: string, mode?: string): Promise<string> {
    try {
      console.log('Iniciando verificación de código para:', email);
      
      const res = await fetch(`${API_BASE_URL}/auth/begin-registration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, code, ...(mode ? { mode } : {}) }),
      });
  
      const responseText = await res.text();
      console.log('Respuesta CRUDA del backend:', responseText);
      console.log('Status de la respuesta:', res.status);
    
      if (!res.ok) {
        let errorMsg = `Error del servidor: ${res.status}`;
        try {
          const errorData = JSON.parse(responseText);
          errorMsg = errorData.error || errorMsg;
        } catch (e) {
          if (responseText) {
              errorMsg = responseText;
          }
        }
        throw new Error(errorMsg);
      }
    
      const data = JSON.parse(responseText);
    
      console.log('Opciones recibidas del backend (parseadas):', data);
    
      // ¡LA CLAVE! La librería del frontend espera el objeto .publicKey, no el objeto entero.
      const optionsToPass = data.publicKey;

      // 2. Crear la credencial con WebAuthn
      // IMPORTANTE: El usuario DEBE interactuar inmediatamente después de esto
      console.log('Solicitando interacción del usuario...');
      console.log('PASANDO ESTO A startRegistration:', JSON.stringify(optionsToPass, null, 2));
      const credential: RegistrationResponseJSON = await startRegistration(optionsToPass);
      console.log('Credencial creada exitosamente');
      console.log('Credencial generada:', credential);
    
      // 3. Enviar la credencial al backend para validar
      const credentialJson = JSON.stringify(credential);
      console.log('Enviando credencial al backend...');
      console.log('CREDENCIAL A ENVIAR:', credentialJson);
    
      const finishRes = await fetch(`${API_BASE_URL}/auth/finish-registration?email=${email}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, ...credential }),
      });
    
      const finishText = await finishRes.text();
      console.log('Respuesta de finish-registration (CRUDA):', finishText);
      console.log('Status de finish-registration:', finishRes.status);
    
      if (!finishRes.ok) {
        let errorMsg = `Error del servidor en finish-registration: ${finishRes.status}`;
        try {
          const errorData = JSON.parse(finishText);
          errorMsg = errorData.error || errorMsg;
        } catch (e) {
          if (finishText) {
              errorMsg = finishText;
          }
        }
        throw new Error(errorMsg);
      }
    
      const finishData = JSON.parse(finishText);
      console.log('Respuesta de finish-registration (parseada):', finishData);
    
      if (finishData.success) {
        console.log('✅ Registro completado exitosamente');
        return finishData.message || 'Registro completado exitosamente';
      } else {
        throw new Error(finishData.error || 'Error desconocido en el registro');
      }
    
    } catch (error) {
      console.error('❌ Error en registerPasskey:', error);
      throw error;
    }
  }

  export const startLogin = async (email: string) => {
    try {
      if (!email) {
        throw new Error("El email es requerido.");
      }
      console.log(`Iniciando login para: ${email}`);
      const res = await fetch(`${API_BASE_URL}/auth/begin-login?email=${email}`, {
        method: "GET", // Cambiado a GET según la definición del backend
      });

      if (!res.ok) {
        // Intentar leer como texto primero para debug
        const errorText = await res.text();
        console.error('Error response text:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (parseError) {
          console.error('Error parsing JSON:', parseError);
          throw new Error(`Error del servidor (${res.status}): ${errorText}`);
        }
        
        throw new Error(errorData.error || 'Error iniciando el login de Passkey');
      }
    
      // Leer la respuesta como texto primero para debug
      const responseText = await res.text();
      console.log('Response text:', responseText);
      
      let options;
      try {
        options = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Error parsing JSON response:', parseError);
        console.error('Raw response:', responseText);
        throw new Error('Respuesta del servidor no es JSON válido');
      }
      
      console.log('Opciones de login recibidas del backend:', options);
    
      const optionsToPass = options.publicKey;
    
      // 2. Autenticar con WebAuthn
      console.log('Solicitando autenticación del usuario...');
      const credential: AuthenticationResponseJSON = await startAuthentication(optionsToPass);
      console.log('Autenticación completada exitosamente');
      console.log('Credencial generada:', credential);
    
      // 3. Enviar la credencial al backend para validar
      const credentialJson = JSON.stringify(credential);
      console.log('Enviando credencial al backend...');
      console.log('CREDENCIAL A ENVIAR:', credentialJson);
    
      const finishRes = await fetch(`${API_BASE_URL}/auth/finish-login?email=${email}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, ...credential }),
      });
    
      const finishText = await finishRes.text();
      console.log('Respuesta de finish-login (CRUDA):', finishText);
      console.log('Status de finish-login:', finishRes.status);
    
      if (!finishRes.ok) {
        let errorMsg = `Error del servidor en finish-login: ${finishRes.status}`;
        try {
          const errorData = JSON.parse(finishText);
          errorMsg = errorData.error || errorMsg;
        } catch (e) {
          if (finishText) {
              errorMsg = finishText;
          }
        }
        throw new Error(errorMsg);
      }
    
      const finishData = JSON.parse(finishText);
      console.log('Respuesta de finish-login (parseada):', finishData);
    
      if (finishData.success) {
        console.log('✅ Login completado exitosamente');
        return finishData;
      } else {
        throw new Error(finishData.error || 'Error desconocido en el login');
      }
    
    } catch (error) {
      console.error('❌ Error en startLogin:', error);
      throw error;
    }
  };
  
  export async function loginPasskey(email: string): Promise<any> {
    try {
      console.log(`[loginPasskey] Iniciando para: ${email}`);
      
      // 1. Iniciar autenticación con el backend
      const beginLoginResponse = await fetch(`${API_BASE_URL}/auth/begin-login?email=${email}`, {
        method: 'GET',
        credentials: 'include',
      });
    
      console.log(`[loginPasskey] Respuesta de /begin-login: ${beginLoginResponse.status}`);
      if (!beginLoginResponse.ok) {
        const errorData = await beginLoginResponse.json();
        throw new Error(errorData.error || `Error del servidor (${beginLoginResponse.status})`);
      }

      const optionsFromServer = await beginLoginResponse.json();
      console.log('[loginPasskey] Opciones recibidas del servidor:', JSON.stringify(optionsFromServer, null, 2));

      if (!optionsFromServer.publicKey) {
        throw new Error('[loginPasskey] La respuesta del servidor no contiene la clave "publicKey".');
      }

      const credentialRequestOptions = optionsFromServer.publicKey;
      console.log('[loginPasskey] Opciones que se pasarán a startAuthentication:', JSON.stringify(credentialRequestOptions, null, 2));

      // 2. Usar webauthn/client para autenticar con el dispositivo
      const authenticationResponse = await startAuthentication(credentialRequestOptions);
      console.log('[loginPasskey] Autenticación completada en el dispositivo.');

      // 3. Enviar la respuesta de autenticación al backend
      const finishLoginResponse = await fetch(`${API_BASE_URL}/auth/finish-login?email=${email}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, ...authenticationResponse }),
        credentials: 'include',
      });

      console.log(`[loginPasskey] Respuesta de /finish-login: ${finishLoginResponse.status}`);
      if (!finishLoginResponse.ok) {
        const errorData = await finishLoginResponse.json();
        throw new Error(errorData.error || `Error del servidor (${finishLoginResponse.status})`);
      }

      const result = await finishLoginResponse.json();
      console.log('[loginPasskey] Resultado final:', result);

      if (result.success) {
        console.log('[loginPasskey] ✅ Login exitoso');
        return result;
      } else {
        throw new Error(result.error || 'Error desconocido en el login');
      }

    } catch (error) {
      console.error('[loginPasskey] ❌ Error:', error);
      throw error;
    }
  }
  