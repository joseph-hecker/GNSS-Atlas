import { type ReactNode } from 'react';
import TopNav from './TopNav';
import Sidebar from './Sidebar';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-full flex flex-col">
      <TopNav />
      <div className="flex-1 grid grid-cols-[320px,minmax(0,1fr)] min-h-0">
        <aside className="border-r border-slate-800 bg-slate-900/40 overflow-y-auto">
          <Sidebar />
        </aside>
        <main className="min-w-0 min-h-0 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
