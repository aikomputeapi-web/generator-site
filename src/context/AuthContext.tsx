import React, { createContext, useContext, useState, useEffect } from 'react';

export interface SavedDocument {
  id: string;
  type: string;
  name: string;
  timestamp: number;
  data: any;
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

interface AuthContextType {
  currentUser: UserProfile | null;
  savedDocs: SavedDocument[];
  loadedDoc: SavedDocument | null;
  login: (username: string) => boolean;
  signup: (username: string) => boolean;
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

  // Restore session on load
  useEffect(() => {
    const loggedInUser = localStorage.getItem('omni_deck_current_user');
    if (loggedInUser) {
      const isAdmin = loggedInUser === 'admin' || loggedInUser === 'system_admin';
      setCurrentUser({ username: loggedInUser, isAdmin });
    }
  }, []);

  // Fetch saved documents when user changes
  useEffect(() => {
    if (currentUser) {
      const allDocs = localStorage.getItem(`omni_deck_docs_${currentUser.username}`);
      if (allDocs) {
        setSavedDocs(JSON.parse(allDocs));
      } else {
        setSavedDocs([]);
      }
    } else {
      setSavedDocs([]);
    }
  }, [currentUser]);

  const login = (username: string): boolean => {
    const trimmed = username.trim();
    if (!trimmed) return false;
    
    // Simple registration/login logic - create if not exists
    const users = JSON.parse(localStorage.getItem('omni_deck_users') || '[]');
    if (!users.includes(trimmed)) {
      users.push(trimmed);
      localStorage.setItem('omni_deck_users', JSON.stringify(users));
    }
    
    const isAdmin = trimmed === 'admin' || trimmed === 'system_admin';
    setCurrentUser({ username: trimmed, isAdmin });
    localStorage.setItem('omni_deck_current_user', trimmed);
    return true;
  };

  const signup = (username: string): boolean => {
    return login(username);
  };

  const logout = () => {
    setCurrentUser(null);
    setLoadedDoc(null);
    localStorage.removeItem('omni_deck_current_user');
  };

  const saveDoc = (type: string, name: string, data: any) => {
    if (!currentUser) return;
    
    const newDoc: SavedDocument = {
      id: `${type}-${Date.now()}`,
      type,
      name,
      timestamp: Date.now(),
      data
    };

    const updated = [newDoc, ...savedDocs];
    setSavedDocs(updated);
    localStorage.setItem(`omni_deck_docs_${currentUser.username}`, JSON.stringify(updated));
  };

  const deleteDoc = (id: string) => {
    if (!currentUser) return;

    const updated = savedDocs.filter(d => d.id !== id);
    setSavedDocs(updated);
    localStorage.setItem(`omni_deck_docs_${currentUser.username}`, JSON.stringify(updated));

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

  // Administrative functions
  const getAllUsers = (): AdminUserData[] => {
    const users = JSON.parse(localStorage.getItem('omni_deck_users') || '[]');
    // Make sure 'admin' is included by default if not in list
    if (users.length === 0 && currentUser) {
      users.push(currentUser.username);
      localStorage.setItem('omni_deck_users', JSON.stringify(users));
    }
    
    return users.map((username: string) => {
      const docs = JSON.parse(localStorage.getItem(`omni_deck_docs_${username}`) || '[]');
      const isAdmin = username === 'admin' || username === 'system_admin';
      return {
        username,
        isAdmin,
        docCount: docs.length,
        docs
      };
    });
  };

  const adminDeleteUser = (username: string) => {
    const users = JSON.parse(localStorage.getItem('omni_deck_users') || '[]');
    const updatedUsers = users.filter((u: string) => u !== username);
    localStorage.setItem('omni_deck_users', JSON.stringify(updatedUsers));
    localStorage.removeItem(`omni_deck_docs_${username}`);
    
    if (currentUser && currentUser.username === username) {
      logout();
    }
  };

  const adminDeleteDoc = (username: string, docId: string) => {
    const userDocs = JSON.parse(localStorage.getItem(`omni_deck_docs_${username}`) || '[]');
    const updatedDocs = userDocs.filter((d: SavedDocument) => d.id !== docId);
    localStorage.setItem(`omni_deck_docs_${username}`, JSON.stringify(updatedDocs));
    
    // Sync state if it is the current user's document
    if (currentUser && currentUser.username === username) {
      setSavedDocs(updatedDocs);
      if (loadedDoc && loadedDoc.id === docId) {
        setLoadedDoc(null);
      }
    }
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      savedDocs,
      loadedDoc,
      login,
      signup,
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
