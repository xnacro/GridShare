import React from 'react';
import FaIcon from '../icons/FaIcon';
import Button from './Button';

export function LoadingState({
  title = 'Loading energy data...',
  message = 'Fetching real-time state from Supabase and microgrid nodes.',
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center bg-white/70 rounded-xl border border-slate-200/80 ${className}`}>
      <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg mb-3 shadow-inner">
        <FaIcon name="refresh" spin />
      </div>
      <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
      {message && <p className="text-xs text-slate-500 mt-1 max-w-sm">{message}</p>}
    </div>
  );
}

export function EmptyState({
  title = 'No records found',
  message = 'No active entries or telemetry data available at this time.',
  icon = 'inbox',
  actionLabel,
  onAction,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center bg-white rounded-xl border border-slate-200/80 ${className}`}>
      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-xl mb-3">
        <FaIcon name={icon || 'inbox'} />
      </div>
      <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
      {message && <p className="text-xs text-slate-500 mt-1 max-w-sm">{message}</p>}
      {actionLabel && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction} className="mt-4">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export function ErrorState({
  title = 'Failed to load data',
  message = 'An unexpected error occurred while communicating with the backend API.',
  onRetry,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center bg-rose-50/40 rounded-xl border border-rose-200/80 ${className}`}>
      <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-lg mb-3">
        <FaIcon name="warning" />
      </div>
      <h4 className="text-sm font-semibold text-rose-900">{title}</h4>
      {message && <p className="text-xs text-rose-700/80 mt-1 max-w-sm">{message}</p>}
      {onRetry && (
        <Button variant="danger" size="sm" onClick={onRetry} className="mt-4" icon={<FaIcon name="refresh" />}>
          Retry Connection
        </Button>
      )}
    </div>
  );
}

export function OfflineState({
  title = 'Backend Offline',
  message = 'Unable to connect to Flask API on localhost:5000.',
  onRetry,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center bg-amber-50/50 rounded-xl border border-amber-200/80 ${className}`}>
      <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-lg mb-3">
        <FaIcon name="wifi" />
      </div>
      <h4 className="text-sm font-semibold text-amber-900">{title}</h4>
      {message && <p className="text-xs text-amber-700/80 mt-1 max-w-sm">{message}</p>}
      {onRetry && (
        <Button variant="warning" size="sm" onClick={onRetry} className="mt-4" icon={<FaIcon name="refresh" />}>
          Check Server
        </Button>
      )}
    </div>
  );
}
