import "./App.css";
import { BrowserRouter as Router, Routes } from 'react-router-dom'
import RoutesConf from "./routes/RoutesConf";
import { getCurrentWindow } from "@tauri-apps/api/window";

function App() {
  getCurrentWindow().setContentProtected(true);
  return (
    <Router>
      <Routes>
        {RoutesConf}
      </Routes>
    </Router>
  );
}

export default App;
