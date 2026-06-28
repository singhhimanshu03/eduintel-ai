import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <span className="text-6xl">🔍</span>
      <h1 className="text-2xl font-bold text-gray-800">404 — Page Not Found</h1>
      <p className="text-gray-500">The page you're looking for doesn't exist.</p>
      <button onClick={() => navigate(-1)} className="bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 transition text-sm">
        ← Go Back
      </button>
    </div>
  );
}
