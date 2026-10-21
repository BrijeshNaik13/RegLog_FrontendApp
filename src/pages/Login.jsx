import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../services/api';
import '../styles/Login.css';

/** Same email rule as the backend. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Validates the login form.
 *
 * @returns {Object} a map of field name -> error message
 */
function validateForm(values) {
  const errors = {};

  if (!values.email.trim()) {
    errors.email = 'Email ID is required';
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = 'Enter a valid email address';
  }

  if (!values.password) {
    errors.password = 'Password is required';
  }

  return errors;
}

const INITIAL_VALUES = { email: '', password: '' };

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // If the user was redirected here by the ProtectedRoute we send them back
  // to the page they wanted to see.
  const redirectTo = location.state?.from || '/home';

  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState({});

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => ({ ...previous, [name]: undefined }));
    setServerError('');
  };

  const handleBlur = (event) => {
    const { name } = event.target;
    setTouched((previous) => ({ ...previous, [name]: true }));
    const singleFieldErrors = validateForm(values);
    setErrors((previous) => ({ ...previous, [name]: singleFieldErrors[name] }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationErrors = validateForm(values);
    setErrors(validationErrors);
    setTouched({ email: true, password: true });

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    // Prevent double submits while the request is running.
    if (submitting) return;

    setSubmitting(true);
    setServerError('');

    try {
      await login({
        email: values.email.trim(),
        password: values.password,
      });

      // The token is stored by the AuthContext - go to the home page.
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setServerError(getErrorMessage(error, 'Login failed. Please check your credentials.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-page__glow auth-page__glow--one" />
      <div className="auth-page__glow auth-page__glow--two" />

      <section className="auth-card auth-card--login">
        <div className="auth-card__intro">
          <span className="auth-card__badge">Welcome back</span>
          <h1 className="auth-card__title">Login to RegLog</h1>
          <p className="auth-card__subtitle">
            Enter your credentials to access your account and dashboard.
          </p>
        </div>

        {serverError && (
          <div className="alert alert--error" role="alert">
            <span className="alert__icon" aria-hidden="true">
              !
            </span>
            <span>{serverError}</span>
          </div>
        )}

        <form className="form" onSubmit={handleSubmit} noValidate>
          <div className="form__group">
            <label className="form__label" htmlFor="email">
              Email ID
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className={`form__input ${touched.email && errors.email ? 'form__input--invalid' : ''}`}
              placeholder="brijesh@example.com"
              value={values.email}
              onChange={handleChange}
              onBlur={handleBlur}
              autoComplete="email"
              disabled={submitting}
            />
            {touched.email && errors.email && <span className="form__error">{errors.email}</span>}
          </div>

          <div className="form__group">
            <label className="form__label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className={`form__input ${touched.password && errors.password ? 'form__input--invalid' : ''}`}
              placeholder="Your password"
              value={values.password}
              onChange={handleChange}
              onBlur={handleBlur}
              autoComplete="current-password"
              disabled={submitting}
            />
            {touched.password && errors.password && (
              <span className="form__error">{errors.password}</span>
            )}
          </div>

          <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
            {submitting ? (
              <>
                <span className="spinner" /> Logging in…
              </>
            ) : (
              'Login'
            )}
          </button>
        </form>

        <p className="auth-card__footer">
          New to RegLog? <Link to="/register">Create an account</Link>
        </p>
      </section>
    </main>
  );
}
