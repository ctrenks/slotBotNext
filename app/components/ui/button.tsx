import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", ...props }, ref) => {
    const baseClasses = "px-4 py-2 rounded-md transition-colors duration-200";
    const variantClasses = {
      default: "bg-blue-500 text-white hover:bg-blue-600",
      outline:
        "border border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white",
    };

    return (
      <button
        ref={ref}
        className={`${baseClasses} ${variantClasses[variant]} ${className}`}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };
