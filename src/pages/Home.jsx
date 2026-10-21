import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getHomeData } from '../services/authService';
import { getErrorMessage } from '../services/api';
import '../styles/Home.css';

/**
 * The inspirational quotes shown on the home page.
 */
const QUOTES = [
  { text: 'Believe in yourself and all that you are.', author: 'Christian D. Larson' },
  { text: 'Every day is a new beginning.', author: 'Tao Te Ching' },
  { text: 'Small steps every day lead to big achievements.', author: 'Anonymous' },
  { text: 'Your future depends on what you do today.', author: 'Mahatma Gandhi' },
];

export default function Home() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [serverMessage, setServerMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Call the protected endpoint. The JWT is attached automatically by Axios.
  useEffect(() => {
    let cancelled = false;

    getHomeData()
      .then((data) => {
        if (cancelled) return;
        setServerMessage(data.message);
      })
      .catch((requestError) => {
        if (cancelled) return;
        setError(getErrorMessage(requestError, 'Could not load the home page.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const displayName = user?.username || 'User';

  return (
    <main className="home-page">
      <div className="home-page__glow home-page__glow--one" />
      <div className="home-page__glow home-page__glow--two" />

      {/* Hero */}
      <section className="hero">
        <span className="hero__badge">You are signed in</span>
        <h1 className="hero__title">{serverMessage || 'Welcome to Our Home!'}</h1>
        <p className="hero__subtitle">
          Hello <strong>{displayName}</strong>, your account is active and protected with JWT
          authentication. We are glad to have you here!
        </p>

        <div className="hero__actions">
          <button type="button" className="btn btn--primary" onClick={handleLogout}>
            Logout
          </button>
        </div>

        {loading && (
          <div className="home-page__loader">
            <span className="spinner" /> Loading your data…
          </div>
        )}

        {error && (
          <div className="alert alert--error home-page__alert" role="alert">
            <span className="alert__icon" aria-hidden="true">
              !
            </span>
            <span>{error}</span>
          </div>
        )}
      </section>

      {/* Account card */}
      <section className="cards">
        <article className="card">
          <div className="card__icon card__icon--purple" aria-hidden="true">
            👤
          </div>
          <h2 className="card__title">Your Account</h2>
          <p className="card__text">Keep your details up to date to stay reachable.</p>
          <ul className="card__list">
            <li>
              <span>User name</span>
              <strong>{user?.username || '—'}</strong>
            </li>
            <li>
              <span>Email ID</span>
              <strong>{user?.email || '—'}</strong>
            </li>
            <li>
              <span>Mobile</span>
              <strong>{user?.mobileNumber || '—'}</strong>
            </li>
          </ul>
        </article>

        <article className="card">
          <div className="card__icon card__icon--green" aria-hidden="true">
            🔐
          </div>
          <h2 className="card__title">Secure Session</h2>
          <p className="card__text">
            Your session is protected with a signed JSON Web Token. Passwords are stored as BCrypt
            hashes and never in plain text.
          </p>
          <ul className="card__list">
            <li>
              <span>Authentication</span>
              <strong>JWT Bearer Token</strong>
            </li>
            <li>
              <span>Password storage</span>
              <strong>BCrypt (salted hash)</strong>
            </li>
            <li>
              <span>Status</span>
              <strong className="text-success">Active</strong>
            </li>
          </ul>
        </article>
      </section>

      {/* Quotes */}
      <section className="quotes">
        <h2 className="quotes__title">Today&apos;s Inspiration</h2>
        <div className="quotes__grid">
          {QUOTES.map((quote, index) => (
            <figure className="quote" key={quote.text} style={{ '--delay': `${index * 120}ms` }}>
              <span className="quote__mark" aria-hidden="true">
                &ldquo;
              </span>
              <blockquote className="quote__text">{quote.text}</blockquote>
              <figcaption className="quote__author">&mdash; {quote.author}</figcaption>
            </figure>
          ))}
        </div>
      </section>
    </main>
  );
}
