"use client";

import React from "react";
import Link from "next/link";
import SessionInfo from "./SessionInfo";

const MobileMenu: React.FC = () => {
  const handleClick = () => {
    const checkbox = document.getElementById("mobile-menu") as HTMLInputElement;
    if (checkbox) checkbox.checked = false;
  };

  return (
    <>
      <label htmlFor="mobile-menu" className="md:hidden cursor-pointer z-50">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 menu-icon"
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
      <input
        type="checkbox"
        id="mobile-menu"
        className="hidden mobile-menu-toggle peer"
      />
      <label
        htmlFor="mobile-menu"
        className="fixed inset-0 bg-black bg-opacity-50 hidden peer-checked:block md:hidden cursor-pointer"
      ></label>
      <div className="mobile-menu">
        <nav className="max-w-[1280px] mx-auto px-4 py-3">
          <ul className="flex flex-col space-y-3">
            <li>
              <Link
                href="/"
                className="block hover:underline flex items-center"
                onClick={handleClick}
              >
                <svg
                  className="w-5 h-5 mr-1"
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
            <li className="mobile-submenu">
              <span className="block font-bold mb-2">Casinos</span>
              <ul className="pl-4 space-y-2">
                <li>
                  <Link
                    href="/no-deposit-casinos"
                    className="block hover:underline"
                    onClick={handleClick}
                  >
                    No Deposit Casinos
                  </Link>
                </li>
                <li>
                  <Link
                    href="/free-spin-casinos"
                    className="block hover:underline"
                    onClick={handleClick}
                  >
                    Free Spin Casinos
                  </Link>
                </li>
                <li>
                  <Link
                    href="/deposit-bonuses"
                    className="block hover:underline"
                    onClick={handleClick}
                  >
                    Deposit Bonuses
                  </Link>
                </li>
              </ul>
            </li>
            <li className="mobile-submenu">
              <span className="block font-bold mb-2">Software</span>
              <ul className="pl-4 space-y-2">
                <li>
                  <Link
                    href="/software/rtg"
                    className="block hover:underline"
                    onClick={handleClick}
                  >
                    RTG
                  </Link>
                </li>
                <li>
                  <Link
                    href="/software/microgaming"
                    className="block hover:underline"
                    onClick={handleClick}
                  >
                    Microgaming
                  </Link>
                </li>
                <li>
                  <Link
                    href="/software/betsoft"
                    className="block hover:underline"
                    onClick={handleClick}
                  >
                    Betsoft
                  </Link>
                </li>
                <li>
                  <Link
                    href="/software/rival"
                    className="block hover:underline"
                    onClick={handleClick}
                  >
                    Rival
                  </Link>
                </li>
                <li>
                  <Link
                    href="/software/hacksaw"
                    className="block hover:underline"
                    onClick={handleClick}
                  >
                    Hacksaw
                  </Link>
                </li>
              </ul>
            </li>
            <li>
              <Link
                href="/about"
                className="block hover:underline"
                onClick={handleClick}
              >
                About
              </Link>
            </li>
            <li>
              <Link
                href="/contact"
                className="block hover:underline"
                onClick={handleClick}
              >
                Contact
              </Link>
            </li>
            <li onClick={handleClick}>
              <SessionInfo />
            </li>
          </ul>
        </nav>
      </div>
    </>
  );
};

export default MobileMenu;
