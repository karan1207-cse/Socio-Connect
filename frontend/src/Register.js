import { useState } from "react";
import {useNavigate,Link} from "react-router-dom";
import API from "./api";
import "./Login.css";

function Register() {
    const navigate=useNavigate();
    const [name,setName]=useState("");
    const [email,setEmail]=useState("");
    const [password,setPassword]=useState("");
    const [age,setAge]=useState("");
    const [areaInput, setAreaInput] = useState("");
const [areaSuggestions, setAreaSuggestions] = useState([]);
const [selectedArea, setSelectedArea] = useState("");

    const handleRegister=async()=>{
        if (!selectedArea) {
  alert("Please select a valid area from suggestions");
  return;
}
        try{
            await API.post("/auth/register",{
                name,
                email,
                password,
                area:selectedArea,
                age,
            });
            alert("Registration successful. Please login.");
            navigate("/");
        }
        catch(err){
            alert("Registration failed");
            console.error(err);
        }
    };
    const fetchAreas = async (value) => {
  try {
    const res = await API.get(`/areas?search=${value}`);
    setAreaSuggestions(res.data);
  } catch (err) {
    console.error("Error fetching areas:", err);
  }
};
    return(
        <div className="login-page">
        <div className="container">
      <h2>Register</h2>

      <input placeholder="Name" onChange={(e) => setName(e.target.value)} />
      <input placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
      <input placeholder="Password" type="password" onChange={(e) => setPassword(e.target.value)} />
<input
  placeholder="Select Area"
  value={areaInput}
  onChange={(e) => {
    const value = e.target.value;
    setAreaInput(value);
    fetchAreas(value);
  }}
/>

{areaSuggestions.length > 0 && (
  <ul className="area-suggestions">
    {areaSuggestions.map((area, index) => (
      <li
        key={index}
        onClick={() => {
          setSelectedArea(area.name);
          setAreaInput(area.name);
          setAreaSuggestions([]);
        }}
      >
        {area.name}
      </li>
    ))}
  </ul>
)}      <input placeholder="Age" onChange={(e) => setAge(e.target.value)} />

      <button onClick={handleRegister}>Register</button>
      <p> 
        Already have an account?{" "}
        <Link to="/">Login here</Link>
      </p>
    </div>
    </div>
  );
}

export default Register;
    