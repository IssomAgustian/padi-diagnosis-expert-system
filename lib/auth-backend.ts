/**
 * Backend Authentication Client for Flask API Integration
 * Handles Google OAuth and JWT token management
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  is_admin: boolean;
  created_at: string;
  last_login?: string;
}

export interface AuthResponse {
  access_token: string;
  user: AuthUser;
}

class AuthClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      this.logout();
      throw new Error('Authentication required');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response;
  }

  async getGoogleAuthUrl(): Promise<{ authorization_url: string; state: string }> {
    const response = await this.request('/api/auth/google/url');
    return response.json();
  }

  async handleGoogleCallback(code: string, state: string): Promise<AuthResponse> {
    const response = await this.request('/api/auth/google/callback', {
      method: 'POST',
      body: JSON.stringify({ code, state }),
    });

    const data = await response.json();
    this.token = data.access_token;

    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', this.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
    }

    return data;
  }

  async getCurrentUser(): Promise<AuthUser> {
    const response = await this.request('/api/auth/verify');
    const data = await response.json();
    return data.user;
  }

  async updateProfile(name: string): Promise<AuthUser> {
    const response = await this.request('/api/auth/update-profile', {
      method: 'PUT',
      body: JSON.stringify({ name }),
    });

    const data = await response.json();

    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_user', JSON.stringify(data.user));
    }

    return data.user;
  }

  logout(): void {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  getUser(): AuthUser | null {
    if (typeof window === 'undefined') return null;

    const userStr = localStorage.getItem('auth_user');
    return userStr ? JSON.parse(userStr) : null;
  }

  isAdmin(): boolean {
    const user = this.getUser();
    return user?.is_admin || false;
  }
}

export const authClient = new AuthClient();

// Hook for React components
export function useAuth() {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const token = authClient.getToken();
    if (token) {
      authClient.getCurrentUser()
        .then(setUser)
        .catch(() => {
          authClient.logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async () => {
    try {
      const { authorization_url, state } = await authClient.getGoogleAuthUrl();

      // Open Google OAuth in popup
      const popup = window.open(
        authorization_url,
        'google-auth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      return new Promise((resolve, reject) => {
        const checkClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkClosed);
            reject(new Error('Authentication cancelled'));
          }
        }, 1000);

        const messageHandler = async (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;

          if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
            clearInterval(checkClosed);
            window.removeEventListener('message', messageHandler);
            popup?.close();

            try {
              const authData = await authClient.handleGoogleCallback(
                event.data.code,
                event.data.state
              );
              setUser(authData.user);
              resolve(authData);
            } catch (error) {
              reject(error);
            }
          } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
            clearInterval(checkClosed);
            window.removeEventListener('message', messageHandler);
            popup?.close();
            reject(new Error(event.data.error));
          }
        };

        window.addEventListener('message', messageHandler);
      });
    } catch (error) {
      throw new Error(`Login failed: ${error}`);
    }
  };

  const logout = () => {
    authClient.logout();
    setUser(null);
  };

  const updateUser = async (name: string) => {
    const updatedUser = await authClient.updateProfile(name);
    setUser(updatedUser);
    return updatedUser;
  };

  return {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.is_admin || false,
    login,
    logout,
    updateUser,
  };
}

// React import
import React from 'react';