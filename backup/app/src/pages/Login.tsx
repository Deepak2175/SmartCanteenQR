import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router";
import { useEffect } from "react";
import { LogIn, UtensilsCrossed, ArrowLeft } from "lucide-react";

function getOAuthUrl() {
  const appID = import.meta.env.VITE_APP_ID;
  const authUrl = import.meta.env.VITE_KIMI_AUTH_URL;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${authUrl}/api/oauth/authorize`);
  url.searchParams.set("client_id", appID);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "profile");
  url.searchParams.set("state", state);

  return url.toString();
}

export default function Login() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/admin");
    }
  }, [isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <UtensilsCrossed className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold">Admin Login</h1>
            <p className="text-gray-500 text-sm mt-1">
              Canteen Management Dashboard
            </p>
          </div>

          {/* OAuth Login */}
          <a
            href={getOAuthUrl()}
            className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3.5 rounded-xl font-semibold active:scale-[0.98] transition-transform"
          >
            <LogIn className="h-4 w-4" />
            Login with Kimi
          </a>

          {import.meta.env.DEV && (
            <a
              href="/api/dev-login"
              className="w-full flex items-center justify-center gap-2 bg-gray-800 text-white py-3.5 rounded-xl font-semibold active:scale-[0.98] transition-transform mt-3"
            >
              Dev Admin Login (skip OAuth)
            </a>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate("/student-login")}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1 mx-auto"
            >
              <ArrowLeft className="h-3 w-3" />
              Student Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
