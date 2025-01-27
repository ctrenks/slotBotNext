"use client";

import React from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";

const SessionInfo: React.FC = () => {
  const { data: session } = useSession();

  if (session) {
    return (
      <div className="flex items-center space-x-2">
        <Link 
          href="/myprofile" 
          className="relative w-8 h-8 rounded-full overflow-hidden hover:ring-2 hover:ring-emerald-500 transition-all duration-200"
        >
          <Image
            src={session.user?.image || "/img/defaultuser.png"}
            alt="User profile"
            fill
            className="object-cover"
            sizes="32px"
          />
        </Link>
        <button
          onClick={() => signOut()}
          className="emerald-button"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn()}
      className="emerald-button"
    >
      Sign in
    </button>
  );
};

export default SessionInfo;
