import { useState } from "react";
import Login from "./pages/login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import "./App.css";

function App() {

  const [page, setPage] = useState<"login" | "register" | "home">("login");

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

      {page === "home" && <Home />}

    </div>
  );
}

export default App;