import React, { useState, useEffect, useRef, useMemo } from "react";
import en from "./i18n/en.json";
import ta from "./i18n/ta.json";
import ChatPopup from "./components/ChatPopup";
import "./components/popup.css";
import { useAuth } from "./context/AuthContext";
import API from "./utils/api";
import "./assets/scheme.css";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { app } from "./firebase";

const translations = { en, ta };

const SchemesGrid = React.memo(
  ({
    filteredSchemes,
    token,
    bookmarks,
    bookmarksLoading,
    togglingIds,
    toggleBookmark,
    setModalScheme,
    lang,
  }) => {
    return (
      <div className="schemes-container" id="schemes-grid" role="list">
        {filteredSchemes.map((scheme) => (
          <div tabIndex={0} key={scheme.id} className="scheme-card">
            {token && (
              <button
                className="bookmark-btn card-bookmark"
                onClick={() => toggleBookmark(scheme.id)}
                disabled={bookmarksLoading || togglingIds.includes(scheme.id)}
              >
                {bookmarks.some((b) => String(b.schemeId) === String(scheme.id))
                  ? "🔖"
                  : "📖"}
              </button>
            )}
            <div
              className="scheme-card-content"
              onClick={() => setModalScheme(scheme)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setModalScheme(scheme);
              }}
            >
              <h3 className="scheme-title">{scheme.title[lang]}</h3>
              <div className="scheme-department">{scheme.department[lang]}</div>
              <div className="scheme-summary">{scheme.benefits[lang]}</div>
            </div>
          </div>
        ))}
      </div>
    );
  }
);

const Modal = React.memo(
  ({
    scheme,
    t,
    lang,
    token,
    bookmarksLoading,
    togglingIds,
    toggleBookmark,
    setModalScheme,
    isBookmarked,
  }) => {
    return (
      <div
        className="modal"
        style={{ display: "block" }}
        onClick={(e) => {
          if (e.target.classList.contains("modal")) {
            setModalScheme(null);
          }
        }}
      >
        <div className="modal-content">
          <button className="close-btn" onClick={() => setModalScheme(null)}>
            &times;
          </button>
          <h2 className="modal-title">{scheme.title[lang]}</h2>
          {token && (
            <button
              className="bookmark-btn modal-bookmark"
              onClick={() => toggleBookmark(scheme.id)}
              disabled={bookmarksLoading || togglingIds.includes(scheme.id)}
            >
              {isBookmarked ? "🔖 Remove Bookmark" : "📖 Add to Bookmarks"}
            </button>
          )}
          <section className="modal-section">
            <h3 className="modal-section-title">{t.modal_department}</h3>
            <p className="modal-body">{scheme.department[lang]}</p>
          </section>
          <section className="modal-section">
            <h3 className="modal-section-title">{t.modal_eligibility}</h3>
            <p className="modal-body">{scheme.eligibility[lang]}</p>
          </section>
          <section className="modal-section">
            <h3 className="modal-section-title">{t.modal_benefits}</h3>
            <p className="modal-body">{scheme.benefits[lang]}</p>
          </section>
          <section className="modal-section">
            <h3 className="modal-section-title">{t.modal_apply}</h3>
            <p className="modal-body">{scheme.apply[lang]}</p>
          </section>
          <a
            href={scheme.link}
            target="_blank"
            rel="noopener noreferrer"
            className="modal-read-link"
          >
            {t.modal_link}
          </a>
        </div>
      </div>
    );
  }
);

const BookmarksModal = React.memo(
  ({ schemes, bookmarks, lang, togglingIds, toggleBookmark, setShowBookmarks }) => {
    return (
      <div className="modal" style={{ display: "block" }} onClick={() => setShowBookmarks(false)}>
        <div className="modal-content">
          <button className="close-btn" onClick={() => setShowBookmarks(false)}>
            &times;
          </button>
          <h2 className="modal-title">My Bookmarked Schemes</h2>
          <div className="bookmarks-list">
            {bookmarks.length > 0 ? (
              bookmarks.map((bookmark) => {
                const scheme = schemes.find(
                  (s) => String(s.id) === String(bookmark.schemeId)
                );
                if (!scheme) {
                  return (
                    <div key={bookmark._id || bookmark.schemeId} className="bookmark-item">
                      <div className="bookmark-item-details">
                        <h3>Scheme Not Found</h3>
                        <p>ID: {bookmark.schemeId}</p>
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={bookmark._id} className="bookmark-item">
                    <div className="bookmark-item-details">
                      <h3>{scheme.title[lang]}</h3>
                      <p>
                        Bookmarked on:{" "}
                        {new Date(bookmark.bookmarkedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      className="remove-bookmark-btn"
                      onClick={() => toggleBookmark(bookmark.schemeId)}
                      disabled={togglingIds.includes(bookmark.schemeId)}
                    >
                      Remove
                    </button>
                  </div>
                );
              })
            ) : (
              <p>You have no bookmarked schemes yet.</p>
            )}
          </div>
        </div>
      </div>
    );
  }
);

const Wizard = React.memo(
  ({ t, filters, wizardData, setWizardData, getRecommendations, setWizardOpen }) => {
    const handleInput = (e) => {
      const { name, value } = e.target;
      setWizardData((prev) => ({ ...prev, [name]: value }));
    };

    return (
      <div
        className="modal"
        style={{ display: "flex", justifyContent: "center", alignItems: "center" }}
        onClick={(e) => {
          if (e.target.classList.contains("modal")) {
            setWizardOpen(false);
          }
        }}
      >
        <div
          className="modal-content"
          style={{ maxWidth: "400px" }}
          onClick={(e) => e.stopPropagation()}
        >
          <button className="close-btn" onClick={() => setWizardOpen(false)}>
            &times;
          </button>
          <h2 className="modal-title">{t.wizard_title}</h2>
          <form
            id="wizard-steps"
            onSubmit={(e) => {
              e.preventDefault();
              getRecommendations();
            }}
          >
            <label htmlFor="user-age">{t.modal_eligibility} - Age</label>
            <input
              id="user-age"
              name="age"
              type="number"
              min="0"
              value={wizardData.age}
              onChange={handleInput}
              required
              placeholder="e.g. 30"
            />
            <label htmlFor="user-income">{t.modal_eligibility} - Income</label>
            <input
              id="user-income"
              name="income"
              type="number"
              min="0"
              value={wizardData.income}
              onChange={handleInput}
              required
              placeholder="Annual income"
            />
            <label htmlFor="user-category">{t.filter_all} / Category</label>
            <select
              id="user-category"
              name="category"
              value={wizardData.category}
              onChange={handleInput}
            >
              <option value="any">{t.filter_all}</option>
              {filters
                .filter((f) => f.key !== "all")
                .map((f) => (
                  <option key={f.key} value={f.key}>
                    {f.label}
                  </option>
                ))}
            </select>
            <button type="submit">{t.recommend_button}</button>
          </form>
        </div>
      </div>
    );
  }
);

export default function App() {
  const [lang, setLang] = useState(localStorage.getItem("preferredLang") || "en");
  const [t, setT] = useState(translations[lang]);
  const [schemes, setSchemes] = useState([]);
  const [filteredSchemes, setFilteredSchemes] = useState([]);
  const [query, setQuery] = useState("");
  const [modalScheme, setModalScheme] = useState(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState("all");
  const [suggestions, setSuggestions] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const suggestionBoxRef = useRef(null);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpExpiryTime, setOtpExpiryTime] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const {
    token,
    user,
    login,
    logout,
    bookmarks,
    bookmarksLoading,
    toggleBookmark,
    togglingIds,
  } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [registerData, setRegisterData] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
  });
  const [profileOpen, setProfileOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [wizardData, setWizardData] = useState({
    age: "",
    income: "",
    category: "any",
  });

  // --- FINAL FIX: Add a loading state for schemes to prevent race condition ---
  const [schemesLoading, setSchemesLoading] = useState(true);

  useEffect(() => {
    fetch("/schemes.json")
      .then((res) => res.json())
      .then((data) => {
        setSchemes(data);
        setFilteredSchemes(data);
        setSchemesLoading(false);
      });
  }, []);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  useEffect(() => {
    setT(translations[lang]);
    localStorage.setItem("preferredLang", lang);
  }, [lang]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileMenuRef]);

  function handleSearch(input) {
    setQuery(input);
    const q = input.toLowerCase();
    const results = schemes.filter(
      (s) =>
        s.title[lang].toLowerCase().includes(q) ||
        s.department[lang].toLowerCase().includes(q)
    );
    setFilteredSchemes(results);
    setFilterCategory("all");
  }

  function handleFilter(category) {
    setFilterCategory(category);
    setSidebarOpen(false);
    if (category === "all") {
      setFilteredSchemes(schemes);
    } else {
      const filtered = schemes.filter((s) =>
        Array.isArray(s.category)
          ? s.category.includes(category)
          : s.category === category
      );
      setFilteredSchemes(filtered);
    }
    setQuery("");
  }

  function toggleLanguage() {
    const newLang = lang === "en" ? "ta" : "en";
    setLang(newLang);
    setSuggestions([]);
  }

  function onInputChange(e) {
    const val = e.target.value;
    setQuery(val);
    if (!val.trim()) {
      setSuggestions([]);
      setFilteredSchemes(schemes);
      setFilterCategory("all");
      return;
    }
    const q = val.toLowerCase();
    const matches = schemes
      .filter((s) => s.title[lang].toLowerCase().includes(q))
      .slice(0, 5);
    setSuggestions(matches);
  }

  function onSuggestionClick(title) {
    setQuery(title);
    const filtered = schemes.filter((s) => s.title[lang] === title);
    setFilteredSchemes(filtered);
    setSuggestions([]);
    setFilterCategory("all");
  }

  useEffect(() => {
    function handleClickOutside(event) {
      if (suggestionBoxRef.current && !suggestionBoxRef.current.contains(event.target)) {
        setSuggestions([]);
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  function getRecommendations() {
    const age = parseInt(wizardData.age) || 0;
    const income = parseInt(wizardData.income) || 0;
    const category = wizardData.category.toLowerCase();
    const matchedSchemes = schemes.filter((scheme) => {
      const minAge = scheme.minAge ?? 0;
      const maxAge = scheme.maxAge ?? 150;
      const maxIncome = scheme.maxIncome ?? Infinity;
      const ageValid = age >= minAge && age <= maxAge;
      const incomeValid = income <= maxIncome;
      const cats = scheme.category ?? [];
      const categories = Array.isArray(cats)
        ? cats.map((c) => (c || "").toLowerCase())
        : [(cats || "").toLowerCase()];
      const categoryValid = category === "any" || categories.includes(category);
      return ageValid && incomeValid && categoryValid;
    });
    setFilteredSchemes(matchedSchemes);
    setWizardOpen(false);
    setModalScheme(null);
  }

  const filters = [
    { key: "all", label: t.filter_all },
    { key: "education", label: t.filter_education },
    { key: "health", label: t.filter_health },
    { key: "women", label: t.filter_women },
    { key: "agriculture", label: t.filter_agriculture },
    { key: "employment", label: t.filter_employment },
    { key: "disability", label: t.filter_disability },
    { key: "social", label: t.filter_social },
    { key: "housing", label: t.filter_housing },
    { key: "environment", label: t.filter_environment },
    { key: "rehabilitation", label: t.filter_rehabilitation },
    { key: "women_employment", label: t.filter_women_employment },
    { key: "education_skill", label: t.filter_education_skill },
    { key: "social_welfare", label: t.filter_social_welfare },
    { key: "disaster", label: t.filter_disaster },
    { key: "women_transport", label: t.filter_women_transport },
    { key: "agriculture_innovation", label: t.filter_agriculture_innovation },
    { key: "food", label: t.filter_food },
    { key: "mental_health", label: t.filter_mental_health },
    { key: "energy", label: t.filter_energy },
    { key: "food_security", label: t.filter_food_security },
    { key: "water_supply", label: t.filter_water_supply },
    { key: "cyber_safety", label: t.filter_cyber_safety },
    { key: "environment_coastal", label: t.filter_environment_coastal },
  ];

  function Sidebar({ open, onClose }) {
    return (
      <div className={`sidebar${open ? " open" : ""}`} onClick={(e) => e.stopPropagation()}>
        <div className="sidebar-header">
          <span>Filters</span>
          <span className="close-sidebar" onClick={onClose}>
            &times;
          </span>
        </div>
        <div className="sidebar-body">
          {filters.map(({ key, label }) => (
            <button
              key={key}
              className={`filter-btn${filterCategory === key ? " active" : ""} filter-expand`}
              onClick={() => handleFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  function handleSendOtp() {
    if (window.recaptchaVerifier && !window.recaptchaVerifier.cleared) {
      return;
    }
    if (!registerData.phone || registerData.phone.length !== 10) {
      alert("Enter a valid 10-digit phone number");
      return;
    }
    const auth = getAuth(app);
    window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
      size: "invisible",
      callback: () => {},
    });
    const appVerifier = window.recaptchaVerifier;
    signInWithPhoneNumber(auth, `+91${registerData.phone}`, appVerifier)
      .then((result) => {
        window.confirmationResult = result;
        setOtpSent(true);
        setOtpExpiryTime(Date.now() + 5 * 60 * 1000);
        setCooldown(60);
        alert("OTP sent to your phone!");
      })
      .catch((err) => {
        if (window.recaptchaVerifier) {
          window.recaptchaVerifier.clear();
        }
        alert("Failed to send OTP. Please try again.");
      });
  }

  function Footer() {
    return <footer className="footer">{t.footer}</footer>;
  }

  function closeLoginModal() {
    setUsername("");
    setPassword("");
    setShowLogin(false);
  }

  return (
    <>
      <header style={{ position: "relative" }}>
        <div className="container" style={{ position: "relative" }}>
          <div className="top-right-button">
            <button className="lang-toggle" onClick={toggleLanguage}>
              {t.language_toggle}
            </button>
            <button
              id="start-wizard"
              className="recommend-btn"
              onClick={() => setWizardOpen(true)}
              style={{ marginLeft: ".75rem" }}
            >
              {t.recommend_button}
            </button>
            {!token ? (
              <>
                <button onClick={() => setShowLogin(true)}>Login</button>
                <button onClick={() => setShowRegister(true)}>Register</button>
              </>
            ) : (
              <div className="profile-menu-container" ref={profileMenuRef}>
                <button
                  className="profile-icon"
                  onClick={() => setProfileOpen(!profileOpen)}
                >
                  {user && user.username ? user.username.charAt(0).toUpperCase() : "P"}
                </button>
                {profileOpen && (
                  <div className="profile-dropdown">
                    <div
                      className="profile-dropdown-item"
                      onClick={() => {
                        setShowBookmarks(true);
                        setProfileOpen(false);
                      }}
                    >
                      Bookmarks
                    </div>
                    <div
                      className="profile-dropdown-item"
                      onClick={() => {
                        logout();
                        setProfileOpen(false);
                      }}
                    >
                      Logout
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          {!sidebarOpen && (
            <button
              className="hamburger-btn"
              aria-label="Toggle Filters"
              onClick={() => setSidebarOpen(true)}
            >
              &#9776;
            </button>
          )}
          <h1>{t.page_title}</h1>
          <p className="tagline">{t.tagline}</p>
        </div>
      </header>
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 1500,
          }}
        >
          <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        </div>
      )}
      <main>
        <div className="container">
          <div className="search-wrapper">
            <div className="search-bar">
              <input
                type="text"
                id="search-input"
                value={query}
                placeholder={t.search_placeholder}
                onChange={onInputChange}
                autoComplete="off"
              />
              <button id="search-btn" onClick={() => handleSearch(query)}>
                {t.search_button}
              </button>
            </div>
            {suggestions.length > 0 && (
              <ul className="suggestions-list" ref={suggestionBoxRef}>
                {suggestions.map((s) => (
                  <li key={s.id} onClick={() => onSuggestionClick(s.title[lang])}>
                    {s.title[lang]}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* --- FINAL FIX: Conditionally render the grid only when all data is loaded --- */}
          {schemesLoading || (token && bookmarksLoading) ? (
            <p style={{ padding: "1rem", textAlign: "center" }}>Loading Schemes...</p>
          ) : (
            <SchemesGrid
              filteredSchemes={filteredSchemes}
              token={token}
              bookmarks={bookmarks}
              bookmarksLoading={bookmarksLoading}
              togglingIds={togglingIds}
              toggleBookmark={toggleBookmark}
              setModalScheme={setModalScheme}
              lang={lang}
            />
          )}

          {modalScheme && (
            <Modal
              scheme={modalScheme}
              t={t}
              lang={lang}
              token={token}
              bookmarksLoading={bookmarksLoading}
              togglingIds={togglingIds}
              toggleBookmark={toggleBookmark}
              setModalScheme={setModalScheme}
              isBookmarked={bookmarks.some((b) => String(b.schemeId) === String(modalScheme.id))}
            />
          )}

          {wizardOpen && (
            <Wizard
              t={t}
              filters={filters}
              wizardData={wizardData}
              setWizardData={setWizardData}
              getRecommendations={getRecommendations}
              setWizardOpen={setWizardOpen}
            />
          )}

          {showBookmarks && (
            <BookmarksModal
              schemes={schemes}
              bookmarks={bookmarks}
              lang={lang}
              togglingIds={togglingIds}
              toggleBookmark={toggleBookmark}
              setShowBookmarks={setShowBookmarks}
            />
          )}
        </div>
      </main>
      <Footer />
      <button className="chatbot-toggle-btn" onClick={() => setChatOpen(true)}>
        💬
      </button>
      <ChatPopup show={chatOpen} onClose={() => setChatOpen(false)} />
      {showLogin && (
        <div className="modal_login" onClick={closeLoginModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Login</h2>
            <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
            <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button
              onClick={async () => {
                try {
                  const res = await API.post("/api/auth/login", { username, password });
                  login(res.data.token, res.data.user);
                  closeLoginModal();
                } catch (err) {
                  console.error("Login Error:", err.response?.data || err.message);
                  alert(err.response?.data?.message || "Login failed");
                }
              }}
            >
              Login
            </button>
            <button onClick={closeLoginModal}>Cancel</button>
          </div>
        </div>
      )}
      {showRegister && (
        <div
          className="modal_register"
          onClick={() => {
            if (window.recaptchaVerifier) {
              window.recaptchaVerifier.clear();
            }
            setShowRegister(false);
          }}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Register</h2>
            <input placeholder="Username" onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })} />
            <input placeholder="Email" onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })} />
            <input placeholder="Phone" onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })} />
            <input placeholder="Password" type="password" onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })} />
            {!otpSent ? (
              <button onClick={handleSendOtp} disabled={cooldown > 0}>
                {cooldown > 0 ? `Resend OTP in ${cooldown}s` : "Send OTP"}
              </button>
            ) : (
              <>
                <input placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} />
                <button
                  onClick={async () => {
                    try {
                      if (!otp || Date.now() > otpExpiryTime) {
                        alert("OTP is missing or expired");
                        return;
                      }
                      const result = await window.confirmationResult.confirm(otp);
                      console.log("Firebase OTP Verified:", result.user);
                      await API.post("/api/auth/register", {
                        username: registerData.username,
                        email: registerData.email,
                        password: registerData.password,
                        phone: registerData.phone,
                      });
                      alert("Registration successful");
                      if (window.recaptchaVerifier) {
                        window.recaptchaVerifier.clear();
                      }
                      setShowRegister(false);
                    } catch (err) {
                      alert(err.response?.data?.message || "Registration failed");
                    }
                  }}
                >
                  Register
                </button>
              </>
            )}
            <button
              onClick={() => {
                if (window.recaptchaVerifier) {
                  window.recaptchaVerifier.clear();
                }
                setShowRegister(false);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      <div id="recaptcha-container"></div>
    </>
  );
}
