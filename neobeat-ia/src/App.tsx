import { useState } from "react";
import Login from "./pages/login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import "./App.css";


function App() {
  const [page, setPage] = useState<"login" | "register" | "home">("home");(() => {
    return "home";
  });

  return (  
    <div>
      {page === "login" && (
        <Login
          goToRegister={() => setPage("register")}
          goToHome={() => setPage("home")}
        />
      )}
      {page === "register" && (
        <Register
          goToLogin={() => setPage("login")}
        />
      )}
      {page === "home" && <Home
    goToLogin={() => setPage("login")}
    goToRegister={() => setPage("register")}
      />}
      
    </div>
  );
}

export default App;