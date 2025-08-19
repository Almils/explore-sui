'use client';
import clsx from 'clsx';
import React, { ReactElement, ReactNode, cloneElement, isValidElement } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md';

export default function Button({
  children,
  onClick,
  disabled,
  variant = 'primary',
  size = 'md',
  title,
  type = 'button',
  asChild = false,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: Variant;
  size?: Size;
  title?: string;
  type?: 'button' | 'submit';
  asChild?: boolean;         // <- new
  className?: string;        // <- allow additional classes
}) {
  const base =
    'inline-flex items-center justify-center rounded-xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
  }[size];

  const variants = {
    primary: 'bg-brand-gradient text-black font-medium shadow-brand hover:opacity-95 active:opacity-90',
    secondary: 'border border-white/15 text-foreground bg-white/5 hover:bg-white/10',
    ghost: 'text-foreground hover:bg-white/5',
  }[variant];

  const classes = clsx(base, sizes, variants, className);

  if (asChild && isValidElement(children)) {
    // Clone the child (e.g., a <button> from ConnectButton) and attach our classes.
    const el = children as ReactElement<any>;
    return cloneElement(el, {
      className: clsx(classes, el.props.className),
      disabled: disabled ?? el.props.disabled,
      title: title ?? el.props.title,
      // don't override child's onClick/type; ConnectButton needs its own
    });
  }

  return (
    <button type={type} title={title} onClick={onClick} disabled={disabled} className={classes}>
      {children}
    </button>
  );
}
