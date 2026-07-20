import { Link } from "react-router-dom";

export function RegisterPage() {
  return (
    <section className="auth-panel">
      <h1>Register</h1>
      <form className="form-grid">
        <label>
          Email
          <input type="email" name="email" autoComplete="email" />
        </label>
        <label>
          Username
          <input type="text" name="username" autoComplete="username" />
        </label>
        <label>
          Password
          <input type="password" name="password" autoComplete="new-password" />
        </label>
        <button type="submit">Create account</button>
      </form>
      <p>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </section>
  );
}
