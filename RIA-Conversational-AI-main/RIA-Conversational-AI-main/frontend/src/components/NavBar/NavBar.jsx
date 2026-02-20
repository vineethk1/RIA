/* @jsxRuntime classic */
import React from "react";
import { NavLink } from "react-router-dom";
import "./NavBar.css";

export default function NavBar() {
  return (
    <header className="nav">
      <div className="nav__brand">
        <NavLink to="/" className="logo">RIA</NavLink>
      </div>

      <nav className="nav__links">
        <NavLink to="/" end>
          Home
        </NavLink>
        <NavLink to="/health">
          MedTech Agent
        </NavLink>
      </nav>
    </header>
  );
}
