"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const router = useRouter();

  const handleSubmit = (e) => {
    e.preventDefault();
    router.push("/dashboard"); // Nee dashboard route `/` aithe `/` pettu
  };

  return (
    <div className="min-h-screen w-full lg:grid lg:grid-cols-2">
      {/* Left Side - Professional Branding */}
      <div className="hidden lg:flex bg-zinc-950 items-center justify-center p-12 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,59,92,0.15),transparent_50%)]"></div>
        <div className="relative z-10 max-w-md text-white">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF3B5C] to-[#ff1744] flex items-center justify-center text-xl font-bold shadow-lg shadow-[#FF3B5C]/30">
              S
            </div>
            <span className="text-2xl font-bold tracking-tight">SafeHer</span>
          </div>
          
          <h1 className="text-5xl font-bold leading-tight mb-6">
            Safety that<br/>stays with you
          </h1>
          
          <p className="text-zinc-400 text-lg leading-relaxed mb-12">
            Instant emergency response, fake calls, and 24/7 protection. 
            Your trusted safety companion.
          </p>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0">
                <span className="text-[#FF3B5C]">✓</span>
              </div>
              <div>
                <p className="font-semibold text-white">Instant SOS Alerts</p>
                <p className="text-zinc-500 text-sm mt-1">Notify contacts in under 2 seconds</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0">
                <span className="text-[#FF3B5C]">✓</span>
              </div>
              <div>
                <p className="font-semibold text-white">Smart Detection</p>
                <p className="text-zinc-500 text-sm mt-1">Shake detection & voice activation</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Clean Form */}
      <div className="flex items-center justify-center p-6 sm:p-12 bg-white min-h-screen">
        <div className="w-full max-w-sm">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF3B5C] to-[#ff1744] flex items-center justify-center text-white font-bold">
              S
            </div>
            <span className="text-xl font-bold text-zinc-900">SafeHer</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-zinc-900 mb-2 tracking-tight">
              {isLogin ? "Welcome back" : "Create account"}
            </h2>
            <p className="text-zinc-600">
              {isLogin 
                ? "Sign in to access your safety dashboard" 
                : "Start protecting yourself today"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div>
                <label className="block text-sm font-semibold text-zinc-900 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3.5 border border-zinc-300 rounded-xl text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-4 focus:ring-zinc-900/5 transition-all"
                  placeholder="Enter your name"
                  required
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-semibold text-zinc-900 mb-2">
                Email
              </label>
              <input
                type="email"
                className="w-full px-4 py-3.5 border border-zinc-300 rounded-xl text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-4 focus:ring-zinc-900/5 transition-all"
                placeholder="you@example.com"
                required
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-zinc-900">
                  Password
                </label>
                {isLogin && (
                  <button type="button" className="text-sm text-zinc-600 hover:text-zinc-900 font-medium">
                    Forgot password?
                  </button>
                )}
              </div>
              <input
                type="password"
                className="w-full px-4 py-3.5 border border-zinc-300 rounded-xl text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-4 focus:ring-zinc-900/5 transition-all"
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 active:scale-[0.98] shadow-lg shadow-zinc-900/10"
            >
              {isLogin ? "Sign In" : "Create Account"}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-zinc-600 text-sm">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-zinc-900 hover:text-[#FF3B5C] font-semibold"
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}