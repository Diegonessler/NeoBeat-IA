import { useState } from "react"
import Login from "./pages/login"
import Register from "./pages/Register"
import "./App.css"; 

function App() {

  const [page, setPage] = useState<"login" | "register">("login")

  return (
    <div>

      {page === "login" ? (
        <Login goToRegister={() => setPage("register")} />
      ) : (
        <Register goToLogin={() => setPage("login")} />
      )}

    </div>
  )
}

export default App
