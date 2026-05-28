import { useLocalStorage } from "./hooks/useLocalStorage";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";

export default function App() {
  const [auth, setAuth] = useLocalStorage("auth", false);

  return auth ? (
    <Dashboard onLogout={() => setAuth(false)} />
  ) : (
    <Login onLogin={() => setAuth(true)} />
  );
}
