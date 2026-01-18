import * as React from "react";
import { cn } from "@/lib/utils";

interface ScentButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export function ScentButton({
  children,
  variant = "primary",
  size = "md",
  isLoading,
  className,
  disabled,
  ...props
}: ScentButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-sans uppercase tracking-wider transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed border";

  const variants = {
    primary: "bg-black text-white border-black hover:bg-white hover:text-black",
    secondary: "bg-white text-black border-gray-200 hover:border-black",
    outline: "bg-transparent border-black text-black hover:bg-black hover:text-white",
    ghost: "bg-transparent border-transparent text-gray-500 hover:text-black",
  };

  const sizes = {
    sm: "px-6 py-2 text-[10px]",
    md: "px-8 py-3 text-xs",
    lg: "px-10 py-4 text-xs font-medium",
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center">
          <svg
            className="animate-spin -ml-1 mr-3 h-3 w-3"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          PROCESSING
        </span>
      ) : (
        children
      )}
    </button>
  );
}
