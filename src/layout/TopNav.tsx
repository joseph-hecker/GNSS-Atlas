import { NavLink } from 'react-router-dom';

const linkBase =
  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors';

export default function TopNav() {
  return (
    <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-3">
          <div className="text-lg font-semibold tracking-tight">
            <span className="text-sky-400">GNSS</span> Atlas
          </div>
        </div>
        <nav className="flex items-center gap-1">
          <NavLink
            to="/sky"
            className={({ isActive }) =>
              `${linkBase} ${
                isActive
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              }`
            }
          >
            GNSS Sky
          </NavLink>
          <NavLink
            to="/compare"
            className={({ isActive }) =>
              `${linkBase} ${
                isActive
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              }`
            }
          >
            Projection Comparer
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
