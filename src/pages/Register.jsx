import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../services/api';
import '../styles/Register.css';

/**
 * Regular expression used to check the email format (same rule as the backend).
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Validates the registration form in the browser.
 *
 * <p>IMPORTANT: this is only a convenience for the user. The backend validates
 * everything again - never rely on frontend validation alone.
 *
 * @returns {Object} a map of field name -> error message (empty object = valid)
 */
function validateForm(values) {
  const errors = {};

  if (!values.username.trim()) {
    errors.username = 'User name is required';
  } else if (values.username.trim().length < 3) {
    errors.username = 'User name must be at least 3 characters long';
  }

  if (!values.email.trim()) {
    errors.email = 'Email ID is required';
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = 'Enter a valid email address';
  }

  if (!values.password) {
    errors.password = 'Password is required';
  } else if (values.password.length < 8) {
    errors.password = 'Password must be at least 8 characters long';
  } else if (!/[A-Za-z]/.test(values.password) || !/\d/.test(values.password)) {
    errors.password = 'Password must contain at least one letter and one number';
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = 'Confirm password is required';
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = 'Password and Confirm Password do not match';
  }

  if (!values.mobileNumber.trim()) {
    errors.mobileNumber = 'Mobile number is required';
  } else if (!/^[0-9]{10}$/.test(values.mobileNumber.trim())) {
    errors.mobileNumber = 'Mobile number must be exactly 10 digits';
  }

  return errors;
}

const INITIAL_VALUES = {
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  mobileNumber: '',
};

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState({});

  // Generic onChange handler: updates the value and clears the field error.
  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => ({ ...previous, [name]: undefined }));
    setServerError('');
    setSuccessMessage('');
  };

  // Show the error as soon as the user leaves a field.
  const handleBlur = (event) => {
    const { name } = event.target;
    setTouched((previous) => ({ ...previous, [name]: true }));
    const singleFieldErrors = validateForm({ ...values, [name]: values[name] });
    setErrors((previous) => ({ ...previous, [name]: singleFieldErrors[name] }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Always validate again - the user may not have visited every field.
    const validationErrors = validateForm(values);
    setErrors(validationErrors);
    setTouched({
      username: true,
      email: true,
      password: true,
      confirmPassword: true,
      mobileNumber: true,
    });

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    // Prevent double submits while the request is running.
    if (submitting) return;

    setSubmitting(true);
    setServerError('');

    try {
      const payload = {
        username: values.username.trim(),
        email: values.email.trim(),
        password: values.password,
        confirmPassword: values.confirmPassword,
        mobileNumber: values.mobileNumber.trim(),
      };

      const response = await register(payload);

      setSuccessMessage(response?.message || 'Registration successful. You can now log in.');
      setValues(INITIAL_VALUES);
      setTouched({});

      // Take the user to the login page so they can sign in right away.
      setTimeout(() => navigate('/login'), 1500);
    } catch (error) {
      setServerError(getErrorMessage(error, 'Registration failed. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-page__glow auth-page__glow--one" />
      <div className="auth-page__glow auth-page__glow--two" />

      <section className="auth-card">
        <div className="auth-card__intro">
          <span className="auth-card__badge">Create your account</span>
          <h1 className="auth-card__title">Join RegLog</h1>
          <p className="auth-card__subtitle">
            Sign up in a few seconds and get access to your personalised dashboard.
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

        {successMessage && (
          <div className="alert alert--success" role="status">
            <span className="alert__icon" aria-hidden="true">
              ✓
            </span>
            <span>{successMessage}</span>
          </div>
        )}

        <form className="form" onSubmit={handleSubmit} noValidate>
          {/* User name */}
          <div className="form__group">
            <label className="form__label" htmlFor="username">
              User Name
            </label>
            <input
              id="username"
              name="username"
              type="text"
              className={`form__input ${touched.username && errors.username ? 'form__input--invalid' : ''}`}
              placeholder="Brijesh"
              value={values.username}
              onChange={handleChange}
              onBlur={handleBlur}
              autoComplete="name"
              disabled={submitting}
            />
            {touched.username && errors.username && (
              <span className="form__error">{errors.username}</span>
            )}
          </div>

          {/* Email */}
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

          {/* Password */}
          <div className="form__group">
            <label className="form__label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className={`form__input ${touched.password && errors.password ? 'form__input--invalid' : ''}`}
              placeholder="At least 8 characters"
              value={values.password}
              onChange={handleChange}
              onBlur={handleBlur}
              autoComplete="new-password"
              disabled={submitting}
            />
            {touched.password && errors.password && (
              <span className="form__error">{errors.password}</span>
            )}
          </div>

          {/* Confirm password */}
          <div className="form__group">
            <label className="form__label" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              className={`form__input ${touched.confirmPassword && errors.confirmPassword ? 'form__input--invalid' : ''}`}
              placeholder="Repeat your password"
              value={values.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              autoComplete="new-password"
              disabled={submitting}
            />
            {touched.confirmPassword && errors.confirmPassword && (
              <span className="form__error">{errors.confirmPassword}</span>
            )}
          </div>

          {/* Mobile number */}
          <div className="form__group">
            <label className="form__label" htmlFor="mobileNumber">
              Mobile Number
            </label>
            <input
              id="mobileNumber"
              name="mobileNumber"
              type="tel"
              inputMode="numeric"
              maxLength={15}
              className={`form__input ${touched.mobileNumber && errors.mobileNumber ? 'form__input--invalid' : ''}`}
              placeholder="9876543210"
              value={values.mobileNumber}
              onChange={handleChange}
              onBlur={handleBlur}
              autoComplete="tel"
              disabled={submitting}
            />
            {touched.mobileNumber && errors.mobileNumber && (
              <span className="form__error">{errors.mobileNumber}</span>
            )}
          </div>

          <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
            {submitting ? (
              <>
                <span className="spinner" /> Creating account…
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <p className="auth-card__footer">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </section>
    </main>
  );
}
