import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function PageNotFound({ onGoHome }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-subtle">
      <div className="text-center">
        <AlertTriangle className="mx-auto h-24 w-24 text-peacock-500 opacity-50" />
        <h1 className="mt-4 text-6xl font-extrabold text-peacock-600">404</h1>
        <p className="mt-2 text-2xl font-bold text-primary tracking-tight sm:text-3xl">Page not found</p>
        <p className="mt-4 text-base text-secondary">Sorry, we couldn't find the evidence you're looking for.</p>
        <div className="mt-8">
          <button
            onClick={onGoHome}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-peacock-600 hover:bg-peacock-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-peacock-500"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}