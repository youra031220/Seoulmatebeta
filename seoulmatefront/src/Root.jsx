// src/Root.jsx
import { useState } from "react";
import App from "./App";
import LandingPage from "./components/LandingPage/LandingPage";

export default function Root() {
  const [showPlanner, setShowPlanner] = useState(false);

  if (showPlanner) {
    return <App />;
  }

  return <LandingPage onFinish={() => setShowPlanner(true)} />;
}
