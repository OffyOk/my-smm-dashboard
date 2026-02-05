import { cva } from "class-variance-authority";

export const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400 disabled:pointer-events-none disabled:opacity-50",
    {
        variants: {
            variant: {
                default:
                    "bg-slate-900 text-slate-100 hover:bg-slate-800 light:bg-slate-100 light:text-slate-900 light:hover:bg-slate-200",
                ghost: "hover:bg-slate-900/40 light:hover:bg-slate-100",
                outline:
                    "border border-slate-800 bg-transparent hover:bg-slate-900/40 light:border-slate-200 light:hover:bg-slate-100",
                subtle:
                    "bg-slate-900/60 text-slate-100 hover:bg-slate-900/90 light:bg-slate-100 light:text-slate-900 light:hover:bg-slate-200",
            },
            size: {
                default: "h-9 px-4 py-2",
                sm: "h-8 px-3 text-xs",
                lg: "h-10 px-6",
                icon: "h-9 w-9",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    },
);