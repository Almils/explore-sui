import { ReactNode } from 'react';
import clsx from 'clsx';

export default function Card({
  children,
  className,
}: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx('rounded-3xl border border-border bg-surface p-5', className)}>
      {children}
    </div>
  );
}
