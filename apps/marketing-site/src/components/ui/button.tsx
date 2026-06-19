import {
  type ComponentType,
  type ReactElement,
  type ReactNode,
  cloneElement,
  isValidElement,
} from "react";
import { Link } from "react-router-dom";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

/** The single CTA source of truth — replaces 11 inline reimplementations across
 *  5 divergent paddings. Sharp corners; navy-filled primary, hairline secondary,
 *  text-link ghost. Renders <button>, a react-router <Link> (pass `to`), an <a>
 *  (pass `href`), or wraps an arbitrary child (`asChild`). The trailing arrow is
 *  ALWAYS static — there is no animateIcon prop, by design. */
const button = cva(
  "group inline-flex items-center justify-center gap-2 font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-navy-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-navy-700 text-white hover:bg-navy-800",
        secondary:
          "border border-line-strong bg-transparent text-navy-800 hover:border-copper-500 hover:text-copper-700",
        ghost:
          "bg-transparent text-navy-700 hover:text-copper-700 underline-offset-4 hover:underline",
      },
      size: {
        sm: "px-5 py-3 text-sm",
        md: "px-6 py-3.5 text-sm",
        lg: "px-8 py-4 text-base",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: { variant: "primary", size: "md", fullWidth: false },
  },
);

type ButtonBaseProps = VariantProps<typeof button> & {
  /** lucide-react icon component rendered static at the trailing edge. */
  trailingIcon?: ComponentType<{ className?: string }>;
  className?: string;
  children: ReactNode;
};

type ButtonProps = ButtonBaseProps &
  (
    | { asChild: true; to?: never; href?: never; type?: never; onClick?: never; disabled?: never }
    | { asChild?: false; to: string; href?: never; type?: never; onClick?: never; disabled?: never }
    | { asChild?: false; to?: never; href: string; type?: never; onClick?: never; disabled?: never }
    | {
        asChild?: false;
        to?: never;
        href?: never;
        type?: "button" | "submit" | "reset";
        onClick?: () => void;
        disabled?: boolean;
      }
  );

export function Button(props: ButtonProps) {
  const {
    variant,
    size,
    fullWidth,
    trailingIcon: Icon,
    className,
    children,
    ...rest
  } = props;

  const classes = cn(button({ variant, size, fullWidth }), className);
  const inner = (
    <>
      {children}
      {Icon ? <Icon className="h-4 w-4" /> : null}
    </>
  );

  // asChild: merge classes onto a single caller-provided element (Slot pattern),
  // so the same button styling backs e.g. an <a> from a parent without nesting.
  if ("asChild" in rest && rest.asChild) {
    if (!isValidElement(children)) {
      throw new Error("Button: asChild requires a single valid React element child.");
    }
    const child = children as ReactElement<{ className?: string; children?: ReactNode }>;
    return cloneElement(child, {
      className: cn(classes, child.props.className),
      children: (
        <>
          {child.props.children}
          {Icon ? <Icon className="h-4 w-4" /> : null}
        </>
      ),
    });
  }

  if ("to" in rest && rest.to) {
    return (
      <Link to={rest.to} className={classes}>
        {inner}
      </Link>
    );
  }

  if ("href" in rest && rest.href) {
    return (
      <a href={rest.href} className={classes}>
        {inner}
      </a>
    );
  }

  const { type = "button", onClick, disabled } = rest as {
    type?: "button" | "submit" | "reset";
    onClick?: () => void;
    disabled?: boolean;
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={classes}>
      {inner}
    </button>
  );
}
