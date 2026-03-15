import { useNavigate } from 'react-router-dom'

/**
 * NotFound - 404 error page
 */
function NotFound() {
  const navigate = useNavigate()

  const handleGoHome = () => {
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* 404 Icon */}
        <div className="mb-8">
          <div className="text-9xl font-bold text-white mb-4">404</div>
          <div className="text-2xl font-semibold text-gray-300 mb-2">Page Not Found</div>
          <p className="text-gray-400">
            Oops! The page you're looking for doesn't exist.
          </p>
        </div>

        {/* Illustration */}
        <div className="mb-8">
          <svg
            className="w-64 h-64 mx-auto text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        {/* Action Button */}
        <button
          onClick={handleGoHome}
          className="w-full px-8 py-4 bg-white text-gray-900 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors shadow-lg"
        >
          Go Back to Home
        </button>

        {/* Additional Info */}
        <p className="mt-6 text-sm text-gray-500">
          Looking for a game? Enter your game code on the home page to join.
        </p>
      </div>
    </div>
  )
}

export default NotFound
