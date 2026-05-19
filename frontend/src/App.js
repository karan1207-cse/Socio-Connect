import Login from "./Login";
import Dashboard from "./Dashboard";
import ProtectedRoute from "./ProtectedRoute";
import Register from "./Register";
import { BrowserRouter ,Route, Routes } from "react-router-dom";

function App() {
  return (
    <div>
      
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
      
    </div>
  );
}

export default App;
