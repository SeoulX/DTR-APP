import React, { useState, useEffect } from "react";
import axios from "axios";

function App() {
  const [interns, setInterns] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:5000/attendance").then((response) => {
      setInterns(response.data);
    });
  }, []);

  const handleCheckIn = () => {
    axios.post("http://localhost:5000/check-in", { intern_id: "12345" }).then(() => {
      alert("Checked in successfully!");
    });
  };

  return (
    <div>
      <h1>Daily Time Record (DTR)</h1>
      <button onClick={handleCheckIn}>Check In</button>
      <h2>Attendance:</h2>
      <ul>
        {interns.map((intern, index) => (
          <li key={index}>{intern.intern_id} - {intern.status}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;
