import { trpc } from "@/providers/trpc";
import { useState } from "react";
import { useNavigate } from "react-router";
import { Eye, EyeOff, LogIn, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";

export default function StudentLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = trpc.studentAuth.login.useMutation({
    onSuccess: (data) => {
      localStorage.setItem("student_token", data.token);
      toast.success("Login successful!");
      window.location.href = "/";
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="max-w-lg mx-auto min-h-screen flex flex-col items-center justify-center px-6 bg-gray-50">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <UtensilsCrossed className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold">Welcome Back!</h1>
        <p className="text-gray-500 text-sm mt-1">Login to order food</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="w-full space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loginMutation.isPending}
          className="w-full bg-green-600 text-white py-3.5 rounded-xl font-semibold active:scale-[0.98] transition-transform disabled:opacity-70 flex items-center justify-center gap-2"
        >
          {loginMutation.isPending ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <LogIn className="h-4 w-4" />
          )}
          {loginMutation.isPending ? "Logging in..." : "Login"}
        </button>
      </form>

      <p className="mt-6 text-sm text-gray-500">
        Don&apos;t have an account?{" "}
        <button
          onClick={() => navigate("/student-register")}
          className="text-green-600 font-semibold"
        >
          Register
        </button>
      </p>

      {/* Admin link */}
      <button
        onClick={() => navigate("/login")}
        className="mt-4 text-xs text-gray-400 hover:text-gray-600"
      >
        Admin Login
      </button>
    </div>
  );
}
