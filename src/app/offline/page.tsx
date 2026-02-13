"use client";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="text-center px-6 py-12 max-w-md">
        <div className="mb-8">
          <svg
            className="w-24 h-24 mx-auto text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
            />
          </svg>
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-4">
          Tidak Ada Koneksi
        </h1>
        
        <p className="text-slate-300 mb-8">
          Anda sedang offline. Beberapa fitur mungkin tidak tersedia hingga koneksi internet dipulihkan.
        </p>
        
        <div className="space-y-4">
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Coba Lagi
          </button>
          
          <button
            onClick={() => window.history.back()}
            className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Kembali
          </button>
        </div>
        
        <div className="mt-8 text-sm text-slate-400">
          <p>Tips: Halaman yang sudah pernah Anda kunjungi mungkin masih dapat diakses.</p>
        </div>
      </div>
    </div>
  );
}
