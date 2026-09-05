import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface SavedDocument {
  id: string;
  type: string;
  name: string;
  timestamp: number;
  data: any;
  /** If set, the document references a generated file on the backend */
  downloadUrl?: string;
}

export interface UserProfile {
  username: string;
  isAdmin: boolean;
}

export interface AdminUserData {
  username: string;
  isAdmin: boolean;
  docCount: number;
  docs: SavedDocument[];
}

// Helper: get auth headers for API calls
function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('omni_deck_token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function apiFetch(path: string, options?: RequestInit): Promise<any> {
  const res = await fetch(path, {
    ...options,
    headers: { ...authHeaders(), ...(options?.headers || {}) }
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

interface AuthContextType {
  currentUser: UserProfile | null;
  savedDocs: SavedDocument[];
  loadedDoc: SavedDocument | null;
  login: (username: string, password: string) => Promise<boolean>;
  signup: (username: string, password: string) => Promise<boolean>;
  loginWithGoogle: (idToken: string) => Promise<boolean>;
  googleClientId: string;
  logout: () => void;
  saveDoc: (type: string, name: string, data: any) => void;
  deleteDoc: (id: string) => void;
  loadDoc: (doc: SavedDocument) => void;
  clearLoadedDoc: () => void;
  getAllUsers: () => AdminUserData[];
  adminDeleteUser: (username: string) => void;
  adminDeleteDoc: (username: string, docId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [savedDocs, setSavedDocs] = useState<SavedDocument[]>([]);
  const [loadedDoc, setLoadedDoc] = useState<SavedDocument | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Restore session on mount
  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('omni_deck_token');
      const storedUser = localStorage.getItem('omni_deck_current_user');
      if (token && storedUser) {
        try {
          const data = await apiFetch('/api/auth/me');
          if (data.success && data.user) {
            setCurrentUser(data.user);
            localStorage.setItem('omni_deck_current_user', data.user.username);
          } else {
            // Token invalid, clear
            localStorage.removeItem('omni_deck_token');
            localStorage.removeItem('omni_deck_current_user');
          }
        } catch {
          // Backend may be restarting; keep cached user for now
          try {
            const parsed = JSON.parse(storedUser);
            if (parsed.username) {
              setCurrentUser(parsed);
            }
          } catch {
            localStorage.removeItem('omni_deck_token');
            localStorage.removeItem('omni_deck_current_user');
          }
        }
      }
      setIsInitialized(true);
    };
    init();
  }, []);

  // Fetch documents when user changes
  useEffect(() => {
    if (currentUser) {
      loadDocsFromBackend();
    } else {
      setSavedDocs([]);
    }
  }, [currentUser]);

  const loadDocsFromBackend = async () => {
    try {
      const data = await apiFetch('/api/documents');
      if (data.success && Array.isArray(data.documents)) {
        setSavedDocs(data.documents);
      }
    } catch {
      // Backend unavailable — keep current docs
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
      if (data.success && data.token) {
        localStorage.setItem('omni_deck_token', data.token);
        localStorage.setItem('omni_deck_current_user', JSON.stringify(data.user));
        setCurrentUser(data.user);
        return true;
      }
      return false;
    } catch (err: any) {
      throw err; // Let Login.tsx display the error
    }
  };

  const signup = async (username: string, password: string): Promise<boolean> => {
    try {
      const data = await apiFetch('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
      if (data.success && data.token) {
        localStorage.setItem('omni_deck_token', data.token);
        localStorage.setItem('omni_deck_current_user', JSON.stringify(data.user));
        setCurrentUser(data.user);
        return true;
      }
      return false;
    } catch (err: any) {
      throw err;
    }
  };

  const loginWithGoogle = async (idToken: string): Promise<boolean> => {
    try {
      const data = await apiFetch('/api/auth/google', {
        method: 'POST',
        body: JSON.stringify({ idToken })
      });
      if (data.success && data.token) {
        localStorage.setItem('omni_deck_token', data.token);
        localStorage.setItem('omni_deck_current_user', JSON.stringify(data.user));
        setCurrentUser(data.user);
        return true;
      }
      return false;
    } catch (err: any) {
      throw err;
    }
  };

  const logout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore errors on logout
    }
    setCurrentUser(null);
    setLoadedDoc(null);
    setSavedDocs([]);
    localStorage.removeItem('omni_deck_token');
    localStorage.removeItem('omni_deck_current_user');
  };

  const saveDoc = async (type: string, name: string, data: any) => {
    if (!currentUser) return;
    try {
      const result = await apiFetch('/api/documents', {
        method: 'POST',
        body: JSON.stringify({ type, name, data })
      });
      if (result.success && result.document) {
        setSavedDocs(prev => [result.document, ...prev]);
      }
    } catch {
      // Fallback: save locally
      const newDoc: SavedDocument = {
        id: `${type}-${Date.now()}`,
        type,
        name,
        timestamp: Date.now(),
        data
      };
      setSavedDocs(prev => [newDoc, ...prev]);
    }
  };

  const deleteDoc = async (id: string) => {
    if (!currentUser) return;
    try {
      await apiFetch(`/api/documents/${id}`, { method: 'DELETE' });
    } catch {
      // Ignore
    }
    setSavedDocs(prev => prev.filter(d => d.id !== id));
    if (loadedDoc && loadedDoc.id === id) {
      setLoadedDoc(null);
    }
  };

  const loadDoc = (doc: SavedDocument) => {
    setLoadedDoc(doc);
  };

  const clearLoadedDoc = () => {
    setLoadedDoc(null);
  };

  // Administrative functions (still use localStorage for admin panel data)
  const getAllUsers = useCallback((): AdminUserData[] => {
    // Try backend first, fall back to local data
    const localUsers = JSON.parse(localStorage.getItem('omni_deck_users') || '[]');
    if (localUsers.length === 0 && currentUser) {
      localUsers.push(currentUser.username);
    }
    return localUsers.map((username: string) => {
      const docs = savedDocs.filter(d => d.type !== 'admin'); // use current saved docs
      const isAdmin = username === 'admin' || username === 'system_admin';
      return {
        username,
        isAdmin,
        docCount: docs.length,
        docs
      };
    });
  }, [currentUser, savedDocs]);

  const adminDeleteUser = async (username: string) => {
    try {
      await apiFetch('/api/auth/admin/delete-user', {
        method: 'POST',
        body: JSON.stringify({ username })
      });
    } catch {
      // Ignore
    }
    if (currentUser && currentUser.username === username) {
      logout();
    }
  };

  const adminDeleteDoc = async (username: string, docId: string) => {
    try {
      await apiFetch(`/api/documents/admin/${username}/${docId}`, { method: 'DELETE' });
    } catch {
      // Ignore
    }
    if (currentUser && currentUser.username === username) {
      setSavedDocs(prev => prev.filter(d => d.id !== docId));
      if (loadedDoc && loadedDoc.id === docId) {
        setLoadedDoc(null);
      }
    }
  };

  // Don't render children until we've checked the session
  if (!isInitialized) {
    return null;
  }

  return (
    <AuthContext.Provider value={{
      currentUser,
      savedDocs,
      loadedDoc,
      login,
      signup,
      loginWithGoogle,
      googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
      logout,
      saveDoc,
      deleteDoc,
      loadDoc,
      clearLoadedDoc,
      getAllUsers,
      adminDeleteUser,
      adminDeleteDoc
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
