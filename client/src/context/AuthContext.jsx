import { createContext, useContext, useState, useEffect, useCallback } from "react";
import API from "../utils/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token") || null);
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user")) || null);
  const [bookmarks, setBookmarks] = useState([]);
  const [bookmarksLoading, setBookmarksLoading] = useState(true);
  const [togglingIds, setTogglingIds] = useState([]);

  const fetchBookmarks = useCallback(async () => {
    if (!token) {
      setBookmarks([]);
      setBookmarksLoading(false);
      return;
    }
    setBookmarksLoading(true);
    try {
      const res = await API.get('/api/bookmarks');
      setBookmarks(res.data || []);
    } catch (error) {
      console.error("Failed during fetchBookmarks():", error.response?.data || error.message);
      setBookmarks([]);
    } finally {
      setBookmarksLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  const toggleBookmark = async (schemeId) => {
    if (togglingIds.includes(schemeId)) return;

    setTogglingIds(prev => [...prev, schemeId]);

    const isBookmarked = bookmarks.some((b) => String(b.schemeId) === String(schemeId));

    try {
      if (isBookmarked) {
        await API.delete(`/api/bookmarks/${schemeId}`);
        setBookmarks(prev => prev.filter(b => String(b.schemeId) !== String(schemeId)));
      } else {
        const res = await API.post('/api/bookmarks', { schemeId });
        setBookmarks(prev => [...prev, res.data]);
      }
    } catch (error) {
      console.error("Failed to toggle bookmark:", error.response?.data || error.message);
      await fetchBookmarks(); 
    } finally {
      setTogglingIds(prev => prev.filter(id => id !== schemeId));
    }
  };

  const login = (token, user) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setToken(token);
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    setBookmarks([]);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, bookmarks, bookmarksLoading, toggleBookmark, togglingIds }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}