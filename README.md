# RegLog - Frontend

React frontend for the **RegLog** registration / login application.
The user registers, logs in, receives a **JWT** from the backend and is then taken
to a protected welcome page. The logout button clears the token and returns to the
login page.

The backend lives in a separate repository:
[RegLog_BackendApp](https://github.com/BrijeshNaik13/RegLog_BackendApp)

---

## 1. Project overview

```
src/
├── components/
│   ├── Navbar.jsx              # top navigation + logout button
│   └── ProtectedRoute.jsx      # blocks /home for anonymous visitors
├── pages/
│   ├── Register.jsx            # registration form + client side validation
│   ├── Login.jsx               # login form
│   └── Home.jsx                # protected welcome page with the quotes
├── services/
│   ├── api.js                  # central Axios instance + JWT interceptor
│   └── authService.js          # register / login / getHomeData
├── context/
│   └── AuthContext.jsx         # keeps the "who is logged in" state
├── styles/
│   ├── Register.css
│   ├── Login.css
│   └── Home.css
├── App.jsx                     # the routes
├── main.jsx                    # entry point (Router + AuthProvider)
└── index.css                   # global styles / design system
```

---

## 2. Technologies

| Tool | Version | Purpose |
| ---- | ------- | ------- |
| React | 19.x | UI library |
| JavaScript (JSX) | ES2022 | programming language |
| Vite | 6.x | dev server + build tool |
| React Router DOM | 7.x | client side routing (`/register`, `/login`, `/home`) |
| Axios | 1.x | HTTP calls to the Spring Boot backend |
| HTML5 / CSS3 | - | markup and styling (Flexbox, Grid, gradients, animations) |
| ESLint | 9.x | code quality checks |

---

## 3. Installation

```bash
# 1. clone the repository
git clone https://github.com/BrijeshNaik13/RegLog_FrontendApp.git
cd RegLog_FrontendApp

# 2. install the dependencies
npm install
```

Node.js 18 or newer is required (Node 20+ recommended).

---

## 4. Configuring the backend URL

The frontend talks to the Spring Boot backend through one single Axios instance
(`src/services/api.js`). The base URL comes from a Vite environment variable.

1. Copy the template file:

   ```bash
   cp .env.example .env          # Linux / macOS
   copy .env.example .env        # Windows
   ```

2. Adjust the value if your backend runs somewhere else:

   ```properties
   VITE_API_BASE_URL=http://localhost:8080
   ```

   Do **not** add a trailing slash.

3. `.env` is listed in `.gitignore`, so it is never committed. Vite only exposes
   variables that start with `VITE_` to the browser code.

If you change `.env` while the dev server is running, restart it (`npm run dev`).

---

## 5. Running the frontend

```bash
npm run dev        # development server on http://localhost:5173
npm run build      # production build into the "dist" folder
npm run preview    # serves the production build locally
npm run lint       # ESLint check
```

The backend has to be running as well, otherwise you will see
*"Cannot reach the server. Make sure the backend is running on ..."*.

---

## 6. Frontend routes

| Route | Page | Access |
| ----- | ---- | ------ |
| `/` | redirects to `/home` when logged in, otherwise to `/login` | public |
| `/register` | registration form | public |
| `/login` | login form | public (already logged-in users are sent to `/home`) |
| `/home` | welcome page with the quotes | **JWT required** |

`ProtectedRoute` checks the authentication state. If there is no valid token the
visitor is redirected to `/login` and returned to `/home` after a successful login.

---

## 7. Backend API integration

All calls live in `src/services/authService.js` and go through the Axios instance
in `src/services/api.js`.

| Function | HTTP call | Backend endpoint |
| -------- | ---------- | ---------------- |
| `register(payload)` | `POST` | `/api/register` |
| `login(credentials)` | `POST` | `/api/login` |
| `getHomeData()` | `GET` | `/api/home` |

### How the JWT is sent

`src/services/api.js` installs a **request interceptor** that adds the token to
every request automatically:

```js
api.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

The frontend therefore never has to build the header itself - it simply calls
`getHomeData()` and the protected endpoint works.

### Error handling

A **response interceptor** clears the stored token when the backend answers with
`401 Unauthorized` (for example after the token expired) and fires the
`reglog:unauthorized` event, which the `AuthContext` listens to. The pages display
the message from the backend, including the per-field validation messages
(`fieldErrors`).

### Token storage strategy (please read)

The JWT is kept in **`localStorage`** under the key `reglog_token`.

*Advantages:* it survives a page reload, it is simple and it needs no server side
session.

*Risks:* every script that runs on the page can read `localStorage`. An XSS
(Cross-Site-Scripting) bug anywhere in the app could therefore steal the token.
To reduce that risk this project

* never renders user input as raw HTML (React escapes it by default) and does not
  use `dangerouslySetInnerHTML` anywhere,
* stores only the token - no password is ever kept in the browser,
* clears the token immediately on logout and on any `401`.

**How to upgrade to HttpOnly cookies later:** move the token from the response
body into an `HttpOnly; Secure; SameSite=Strict` cookie. The browser then sends it
automatically, `localStorage` is no longer needed, and the backend only has to read
the token from the cookie instead of the `Authorization` header. The interceptor in
`api.js` is the only place that would have to change.

---

## 8. Project layout

```
RegLog_FrontendApp/
├── scripts/
│   └── e2e-test.ps1             # frontend <-> backend end-to-end test
├── src/
│   ├── components/
│   │   ├── Navbar.jsx
│   │   └── ProtectedRoute.jsx
│   ├── pages/
│   │   ├── Register.jsx
│   │   ├── Login.jsx
│   │   └── Home.jsx
│   ├── services/
│   │   ├── api.js
│   │   └── authService.js
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── styles/
│   │   ├── Register.css
│   │   ├── Login.css
│   │   └── Home.css
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── .env.example                 # template for the backend URL
├── .gitignore
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

---

## 9. Testing

With the backend running on `http://localhost:8080` and the dev server on
`http://localhost:5173`:

```bash
powershell -ExecutionPolicy Bypass -File scripts/e2e-test.ps1
```

The script checks the CORS pre-flight, the registration, the login, the JWT
contents, the protected endpoint (with and without a token) and that the dev
server serves every route.
