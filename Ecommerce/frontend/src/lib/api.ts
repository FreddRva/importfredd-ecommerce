export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

async function refreshToken(): Promise<{ accessToken: string; refreshToken: string } | null> {
    const currentRefreshToken = localStorage.getItem('refreshToken');
    if (!currentRefreshToken) {
        return null;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refresh_token: currentRefreshToken }),
        });

        if (response.ok) {
            const data = await response.json();
            const { access_token, refresh_token } = data;
            
            if (access_token && refresh_token) {
                localStorage.setItem('accessToken', access_token);
                localStorage.setItem('refreshToken', refresh_token);
                return { accessToken: access_token, refreshToken: refresh_token };
            }
        }
        return null;
    } catch (error) {
        console.error('Error refreshing token:', error);
        return null;
    }
}

function logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    // Redirige al login. Usamos window.location para forzar un refresco de la página
    // y asegurar que todos los estados se limpien.
    if (typeof window !== 'undefined') {
        window.location.href = '/login';
    }
}

export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    let accessToken = localStorage.getItem('accessToken');

    const headers = new Headers(options.headers || {});
    if (accessToken) {
        headers.append('Authorization', `Bearer ${accessToken}`);
    }
     if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
        headers.append('Content-Type', 'application/json');
    }

    const newOptions: RequestInit = { ...options, headers };
    
    let response = await fetch(url, newOptions);

    if (response.status === 401) {
        console.log('Access token expired. Attempting to refresh...');
        const newTokens = await refreshToken();

        if (newTokens && newTokens.accessToken) {
            console.log('Token refreshed successfully. Retrying the original request...');
            // Reintentar la petición con el nuevo token
            const newHeaders = new Headers(options.headers || {});
            newHeaders.append('Authorization', `Bearer ${newTokens.accessToken}`);
            if (!newHeaders.has('Content-Type') && !(options.body instanceof FormData)) {
                newHeaders.append('Content-Type', 'application/json');
            }
            
            const retryOptions: RequestInit = { ...options, headers: newHeaders };
            response = await fetch(url, retryOptions);
        } else {
            console.log('Failed to refresh token. Logging out.');
            logout();
            // Lanza un error para detener la ejecución posterior.
            throw new Error('Session expired');
        }
    }

    return response;
}

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      // Si el backend no está disponible, devolver datos mock
      if (response.status === 0 || response.status >= 500) {
        console.warn('Backend no disponible, usando datos mock');
        return getMockData(endpoint);
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.warn('Error en API request:', error);
    // En desarrollo, devolver datos mock si el backend no está disponible
    if (process.env.NODE_ENV === 'development') {
      return getMockData(endpoint);
    }
    throw error;
  }
}

// Datos mock para cuando el backend no esté disponible
function getMockData(endpoint: string) {
  if (endpoint.includes('/products')) {
    return {
      products: [
        {
          id: 1,
          name: "Zapatillas Skater Premium",
          description: "Zapatillas de alta calidad para skateboarding",
          price: 89.99,
          stock: 15,
          image_url: "/Zapatillas.glb",
          category_name: "Zapatillas",
          featured: true
        },
        {
          id: 2,
          name: "Pelota de Fútbol Profesional",
          description: "Pelota oficial para competiciones",
          price: 45.50,
          stock: 8,
          image_url: "/pelota-de-futbol.jpg",
          category_name: "Deportes",
          featured: true
        },
        {
          id: 3,
          name: "Smartphone Ultra",
          description: "El último en tecnología móvil",
          price: 599.99,
          stock: 5,
          image_url: "/smartphone.jpg",
          category_name: "Electrónicos",
          featured: true
        }
      ],
      total: 3
    };
  }
  
  if (endpoint.includes('/categories')) {
    return {
      categories: [
        { id: 1, name: "Zapatillas" },
        { id: 2, name: "Electrónicos" },
        { id: 3, name: "Deportes" },
        { id: 4, name: "Ropa" },
        { id: 5, name: "Hogar" }
      ]
    };
  }

  return { message: "Backend no disponible" };
}

// Funciones específicas de la API
export const api = {
  // Productos
  getProducts: (params?: string) => apiRequest(`/products${params ? `?${params}` : ''}`),
  getProduct: (id: number) => apiRequest(`/products/${id}`),
  
  // Categorías
  getCategories: () => apiRequest('/categories'),
  
  // Autenticación (mock para demo)
  login: (email: string) => Promise.resolve({ 
    user: { id: 1, email, is_admin: false },
    access_token: 'mock-token'
  }),
  
  // Carrito (mock para demo)
  getCart: () => Promise.resolve({ items: [] }),
  addToCart: (data: any) => Promise.resolve({ message: 'Producto agregado (demo)' }),
  
  // Favoritos (mock para demo)
  getFavorites: () => Promise.resolve({ favorites: [] }),
  addFavorite: (productId: number) => Promise.resolve({ message: 'Favorito agregado (demo)' }),
}; 