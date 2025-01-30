"use client";

import React from "react";
import Link from "next/link";
import SessionInfo from "./SessionInfo";
import SlotBotButton from "./SlotBotButton";

const MobileMenu = ({ items }: { items: { name: string; href: string }[] }) => {
  const handleClick = () => {
    const checkbox = document.getElementById("mobile-menu") as HTMLInputElement;
    if (checkbox) checkbox.checked = false;
  };

  return (
    <>
      <label htmlFor="mobile-menu" className="md:hidden cursor-pointer z-50">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-emerald-500"
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
        className="fixed inset-0 bg-black bg-opacity-80 hidden peer-checked:block md:hidden cursor-pointer z-40"
      ></label>
      <div className="fixed right-0 top-0 h-full w-full sm:w-96 bg-zinc-950 shadow-lg transform translate-x-full peer-checked:translate-x-0 transition-transform duration-200 ease-in-out md:hidden z-50">
        <nav className="p-6">
          <ul className="flex flex-col space-y-4">
            <li>
              <Link
                href="/"
                className="flex items-center text-white hover:text-emerald-500 transition-colors"
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
            {items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={handleClick}
                  className="block w-full py-3 px-4 text-lg font-medium text-white hover:bg-emerald-500/10 hover:text-emerald-500 rounded-lg transition-colors"
                >
                  {item.name}
                </Link>
              </li>
            ))}
            <li>
              <SlotBotButton className="w-full justify-center" />
            </li>
            <li onClick={handleClick} className="mt-4">
              <SessionInfo />
            </li>
          </ul>
        </nav>
      </div>
    </>
  );
};

export default MobileMenu;
