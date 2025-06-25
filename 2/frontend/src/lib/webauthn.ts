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
      const res = await fetch(`${API_BASE_URL}/auth/begin-registration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, code, ...(mode ? { mode } : {}) }),
      });
  
      const responseText = await res.text();
    
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
    
      const optionsToPass = data.publicKey;

      const credential: RegistrationResponseJSON = await startRegistration(optionsToPass);
    
      const credentialJson = JSON.stringify(credential);
    
      const finishRes = await fetch(`${API_BASE_URL}/auth/finish-registration?email=${email}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, ...credential }),
      });
    
      const finishText = await finishRes.text();
    
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
    
      if (finishData.success) {
        return finishData.message || 'Registro completado exitosamente';
      } else {
        throw new Error(finishData.error || 'Error desconocido en el registro');
      }
    
    } catch (error) {
      throw error;
    }
  }

  export const startLogin = async (email: string) => {
    try {
      if (!email) {
        throw new Error("El email es requerido.");
      }
      const res = await fetch(`${API_BASE_URL}/auth/begin-login?email=${email}`, {
        method: "GET",
      });

      if (!res.ok) {
        const errorText = await res.text();
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (parseError) {
          throw new Error(`Error del servidor (${res.status}): ${errorText}`);
        }
        
        throw new Error(errorData.error || 'Error iniciando el login de Passkey');
      }
    
      const responseText = await res.text();
      
      let options;
      try {
        options = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error('Respuesta del servidor no es JSON válido');
      }
      
      const optionsToPass = options.publicKey;
    
      const credential: AuthenticationResponseJSON = await startAuthentication(optionsToPass);
    
      const credentialJson = JSON.stringify(credential);
    
      const finishRes = await fetch(`${API_BASE_URL}/auth/finish-login?email=${email}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, ...credential }),
      });
    
      const finishText = await finishRes.text();
    
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
    
      if (finishData.success) {
        return finishData;
      } else {
        throw new Error(finishData.error || 'Error desconocido en el login');
      }
    
    } catch (error) {
      throw error;
    }
  };
  
  export async function loginPasskey(email: string): Promise<any> {
    try {
      const beginLoginResponse = await fetch(`${API_BASE_URL}/auth/begin-login?email=${email}`, {
        method: 'GET',
        credentials: 'include',
      });
    
      if (!beginLoginResponse.ok) {
        const errorData = await beginLoginResponse.json();
        throw new Error(errorData.error || `Error del servidor (${beginLoginResponse.status})`);
      }

      const optionsFromServer = await beginLoginResponse.json();

      if (!optionsFromServer.publicKey) {
        throw new Error('[loginPasskey] La respuesta del servidor no contiene la clave "publicKey".');
      }

      const credentialRequestOptions = optionsFromServer.publicKey;

      const authenticationResponse = await startAuthentication(credentialRequestOptions);

      const finishLoginResponse = await fetch(`${API_BASE_URL}/auth/finish-login?email=${email}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, ...authenticationResponse }),
        credentials: 'include',
      });

      if (!finishLoginResponse.ok) {
        const errorData = await finishLoginResponse.json();
        throw new Error(errorData.error || `Error del servidor (${finishLoginResponse.status})`);
      }

      const result = await finishLoginResponse.json();

      if (result.success) {
        return result;
      } else {
        throw new Error(result.error || 'Error desconocido en el login');
      }

    } catch (error) {
      throw error;
    }
  }
  