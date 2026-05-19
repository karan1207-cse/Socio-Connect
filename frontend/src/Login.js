import { useState } from "react";
import {useNavigate,Link} from "react-router-dom";
import API from "./api";

import "./Login.css";
function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await API.post("/auth/login", {
        email,
        password,
      });

      // Save token
      localStorage.setItem("token", res.data.token);

      navigate("/dashboard");


    } catch (err) {
      alert("Login failed");
      console.error(err);
    }
  };

  return (
  <div className="login-page">
  <div className="container">
    <h2>Login</h2>

    <input
      type="email"
      placeholder="Email"
      onChange={(e) => setEmail(e.target.value)}
    />

    <input
      type="password"
      placeholder="Password"
      onChange={(e) => setPassword(e.target.value)}
    />

    <button onClick={handleLogin}>Login</button>
    <p>
  Don't have an account?{" "}
  <Link to="/register">Register here</Link>
</p>

  </div>
  </div>
);
}

export default Login;
