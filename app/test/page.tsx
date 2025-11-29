export default function TestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Connection Successful!
        </h1>
        <p className="text-gray-600 text-lg mb-6">
          Your phone can reach the server!
        </p>
        <div className="bg-green-100 border-2 border-green-500 rounded-lg p-4 mb-6">
          <p className="text-green-800 font-semibold">
            ✓ Network: Connected
          </p>
          <p className="text-green-800 font-semibold">
            ✓ Server: Running
          </p>
          <p className="text-green-800 font-semibold">
            ✓ IP: 10.0.0.191
          </p>
        </div>
        <p className="text-sm text-gray-500">
          If you see this page, the QR code should work!
        </p>
        <div className="mt-6">
          <a
            href="/"
            className="inline-block px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition"
          >
            Go to Home
          </a>
        </div>
      </div>
    </div>
  );
}
