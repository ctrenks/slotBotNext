import React, { Suspense } from "react";
import Link from "next/link";
import SessionInfo from "./SessionInfo";
import dynamic from "next/dynamic";

const MobileMenu = dynamic(() => import("./MobileMenu"), {});

const Header: React.FC = () => {
  return (
    <header className="custom-gradient text-black p-4 sticky top-0 z-50 w-full">
      <div className="max-w-[1280px] mx-auto flex justify-between items-center">
        <h1 className="text-4xl font-bold emerald-text tracking-wider">NDCG</h1>
        <nav className="hidden md:block">
          <ul className="flex space-x-4 items-center">
            <li>
              <Link href="/" className="hover:underline flex items-center">
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
            <li className="relative group">
              <span className="hover:underline cursor-pointer flex items-center">
                Casinos
                <svg
                  className="w-4 h-4 ml-1 transform group-hover:rotate-180 transition-transform duration-200"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </span>
              <ul className="dropdown-menu">
                <li>
                  <Link href="/no-deposit-casinos" className="dropdown-item">
                    No Deposit Casinos
                  </Link>
                </li>
                <li>
                  <Link href="/free-spin-casinos" className="dropdown-item">
                    Free Spin Casinos
                  </Link>
                </li>
                <li>
                  <Link href="/deposit-bonuses" className="dropdown-item">
                    Deposit Bonuses
                  </Link>
                </li>
              </ul>
            </li>
            <li className="relative group">
              <span className="hover:underline cursor-pointer flex items-center">
                Software
                <svg
                  className="w-4 h-4 ml-1 transform group-hover:rotate-180 transition-transform duration-200"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </span>
              <ul className="dropdown-menu">
                <li>
                  <Link href="/software/rtg" className="dropdown-item">
                    RTG
                  </Link>
                </li>
                <li>
                  <Link href="/software/microgaming" className="dropdown-item">
                    Microgaming
                  </Link>
                </li>
                <li>
                  <Link href="/software/betsoft" className="dropdown-item">
                    Betsoft
                  </Link>
                </li>
                <li>
                  <Link href="/software/rival" className="dropdown-item">
                    Rival
                  </Link>
                </li>
                <li>
                  <Link href="/software/hacksaw" className="dropdown-item">
                    Hacksaw
                  </Link>
                </li>
              </ul>
            </li>
            <li>
              <Link href="/about" className="hover:underline">
                About
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:underline">
                Contact
              </Link>
            </li>
            <li className="ml-4">
              <SessionInfo />
            </li>
          </ul>
        </nav>
        <Suspense fallback={<div className="md:hidden w-6 h-6" />}>
          <MobileMenu />
        </Suspense>
      </div>
    </header>
  );
};

export default Header;
