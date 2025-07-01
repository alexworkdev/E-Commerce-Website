import { useState } from 'react';
import './Login.css';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    if (username.trim() === '' || password.trim() === '') {
      setError("All fields are required");
      return;
    }

    if (isSignup) {
      localStorage.setItem('user', JSON.stringify({ username, password }));
      alert("✅ Account created successfully!");
      onLogin();
    } else {
      const savedUser = JSON.parse(localStorage.getItem('user'));
      if (savedUser && savedUser.username === username && savedUser.password === password) {
        alert("✅ Login successful!");
        onLogin();
      } else {
        setError("Invalid credentials");
      }
    }
  };

  return (
    <div className="login-container">
      <h2>{isSignup ? "Create Account" : "Sign In"}</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <p className="error">{error}</p>}

        <button type="submit">
          {isSignup ? "Sign Up" : "Login"}
        </button>
      </form>

      <p style={{ marginTop: '15px' }}>
        {isSignup ? "Already have an account?" : "New to Surakshit Store?"}{" "}
        <span
          className="toggle-link"
          onClick={() => {
            setIsSignup(!isSignup);
            setError('');
          }}
        >
          {isSignup ? "Login here" : "Create an account"}
        </span>
      </p>
    </div>
  );
}

export default Login;
