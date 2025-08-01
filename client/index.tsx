import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./components/App";
import "./styles/tailwind.css";
<<<<<<< HEAD
import { Toaster } from 'react-hot-toast';
ReactDOM.createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <App />
    <Toaster position="top-right" />
=======

ReactDOM.createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <App />
>>>>>>> af4fd1d5 (Add/ React router route to Project Hub)
  </BrowserRouter>
);
