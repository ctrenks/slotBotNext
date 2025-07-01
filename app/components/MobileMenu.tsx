"use client";

import React from "react";
import Link from "next/link";
import SessionInfo from "./SessionInfo";
import SlotBotButton from "./SlotBotButton";
import EnableNotifications from "./EnableNotifications";

const MobileMenu = ({ items }: { items: { name: string; href: string }[] }) => {
  const handleClick = () => {
    const checkbox = document.getElementById("mobile-menu") as HTMLInputElement;
    if (checkbox) checkbox.checked = false;
  };

  return (
    <>
      <div className="flex items-center gap-2 md:hidden">
        <SlotBotButton className="!py-1.5 !px-3 text-sm" />
        <label htmlFor="mobile-menu" className="cursor-pointer z-50">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-blue-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </label>
      </div>
      <input type="checkbox" id="mobile-menu" className="hidden peer" />
      <div className="mobile-menu-overlay" onClick={handleClick}></div>
      <div className="mobile-menu-container peer-checked:translate-x-0">
        <nav className="mobile-menu-nav">
          <ul className="mobile-menu-list">
            <li>
              <Link href="/" className="mobile-menu-link" onClick={handleClick}>
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                Home
              </Link>
            </li>
            {items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={handleClick}
                  className="mobile-menu-link"
                >
                  {item.name}
                </Link>
              </li>
            ))}
            <li onClick={handleClick}>
              <div className="mobile-menu-button">
                <EnableNotifications context="mobile-menu" />
              </div>
            </li>
            <li onClick={handleClick} className="mt-4">
              <div className="mobile-menu-button">
                <SessionInfo />
              </div>
            </li>
          </ul>
        </nav>
      </div>
    </>
  );
};

export default MobileMenu;
