import "./App.css";
import { BrowserRouter as Router, Routes } from 'react-router-dom';
import RoutesConf from "./routes/RoutesConf";
import { getCurrentWindow } from "@tauri-apps/api/window";
import React from "react";

function App() {
  React.useEffect(() => {
    if ((window as any).__TAURI__) {
      getCurrentWindow().setContentProtected(true).catch(console.error);
    }
  }, []);

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {RoutesConf}
      </Routes>
    </Router>
  );
}

export default App;
