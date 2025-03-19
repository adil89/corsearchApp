import { Globe } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Globe className="h-8 w-8 text-blue-500" />
            <h1 className="ml-3 text-2xl font-bold text-gray-900">
              GeoDB Cities Explorer
            </h1>
          </div>
        </div>
      </div>
    </header>
  );
}