import { Link } from "react-router-dom";

export function LoginPage() {
  return (
    <section className="auth-panel">
      <h1>Log in</h1>
      <form className="form-grid">
        <label>
          Email
          <input type="email" name="email" autoComplete="email" />
        </label>
        <label>
          Password
          <input type="password" name="password" autoComplete="current-password" />
        </label>
        <button type="submit">Log in</button>
      </form>
      <p>
        Need an account? <Link to="/register">Register</Link>
      </p>
    </section>
  );
}
