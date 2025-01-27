import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="bg-gradient-to-r from-[#f9d90a] via-[#f4c003] to-[#dc7d11] text-gray-900 p-4 mt-auto">
      <div className="max-w-[1280px] mx-auto text-center">
        <p>
          &copy; {new Date().getFullYear()} AFC MEDIA LLC. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
