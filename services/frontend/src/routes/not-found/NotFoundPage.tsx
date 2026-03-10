import { Link } from 'wouter';

export function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-gray-300 px-6 py-16 text-center">
      <p className="text-sm uppercase tracking-[0.2em] text-gray-500">404</p>
      <h1 className="text-3xl font-semibold text-gray-900">Page not found</h1>
      <p className="text-gray-600">The route you requested does not exist in the refactored application shell.</p>
      <Link className="text-sm font-medium text-indigo-600" href="/">
        Return to backtests
      </Link>
    </div>
  );
}