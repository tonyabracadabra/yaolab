import { ReactNode } from "react";

interface DataTablePageLayoutProps {
  title: string;
  action: ReactNode;
  children: ReactNode;
  footerContent?: ReactNode;
}

export function DataTablePageLayout({
  title,
  action,
  children,
  footerContent,
}: DataTablePageLayoutProps) {
  return (
    <div className="h-full w-full p-6">
      <div className="flex flex-col h-full space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          {action}
        </div>

        {children}
      </div>
    </div>
  );
}
