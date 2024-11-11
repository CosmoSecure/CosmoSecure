// import { useState } from "react";
// import reactLogo from "./assets/react.svg";
// import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import { BrowserRouter as Router, Routes } from 'react-router-dom'
import RoutesConf from "./routes/RoutesConf";
import { getCurrentWindow } from "@tauri-apps/api/window";

function App() {
  // const [greetMsg, setGreetMsg] = useState("");
  // const [name, setName] = useState("");

  // async function greet() {
  //   // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
  //   setGreetMsg(await invoke("greet", { name }));
  // }

  return (
    getCurrentWindow().setContentProtected(true),
    <Router>
      <Routes>
        {RoutesConf}
      </Routes>
    </Router>
  );
}

export default App;
