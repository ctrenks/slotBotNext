import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", ...props }, ref) => {
    const baseClasses = "px-4 py-2 rounded-md transition-colors duration-200";
    const variantClasses = {
      default: "bg-emerald-500 text-white hover:bg-emerald-600",
      outline:
        "border border-emerald-500 text-emerald-500 hover:bg-emerald-500 hover:text-white",
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
