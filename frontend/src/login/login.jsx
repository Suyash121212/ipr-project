import { useState } from "react";
import { SignIn } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Smartphone, Lock, Mail, Eye, EyeOff, Loader2 } from "lucide-react";

const backend_url = import.meta.env.VITE_BACKEND_URL;

export default function Login() {
  const [activeTab, setActiveTab] = useState("client");
  const [adminData, setAdminData] = useState({ email: "", password: "" });
  const [totpCode, setTotpCode] = useState("");
  const [step, setStep] = useState(1); // 1 = email+password, 2 = TOTP code
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // ── Step 1: verify email + password ──────────────────────────────────────
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch(`${backend_url}/api/admin-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: adminData.email.trim(),
          password: adminData.password,
        }),
      });

      const data = await res.json();

      if (data.success && data.requireTotp) {
        setStep(2);
        setTotpCode("");
      } else {
        setError(data.message || "Invalid credentials.");
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step 2: verify TOTP code from Microsoft Authenticator ────────────────
  const handleTotpVerify = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch(`${backend_url}/api/verify-admin-totp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: adminData.email.trim(),
          token: totpCode.replace(/\s/g, ""),
        }),
      });

      const data = await res.json();

      if (data.success && data.token) {
        localStorage.setItem("adminToken", data.token);
        localStorage.setItem("adminSession", "true");
        localStorage.setItem(
          "adminInfo",
          JSON.stringify({ name: "Administrator", email: adminData.email })
        );
        navigate("/admin-dashboard");
      } else {
        setError(data.message || "Invalid code. Please try again.");
      }
    } catch {
      setError("Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Auto-submit when 6 digits are entered ────────────────────────────────
  const handleTotpInput = (e) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
    setTotpCode(val);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-32 w-80 h-80 rounded-full bg-purple-500 opacity-20 blur-3xl" />
        <div className="absolute -bottom-40 -left-32 w-80 h-80 rounded-full bg-blue-500 opacity-20 blur-3xl" />
      </div>

      <div className="relative w-full max-w-xl mt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full mb-4 shadow-lg">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-slate-400">Sign in to your account</p>
        </div>

        {/* Auth Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-10 shadow-2xl">

          {/* Tabs */}
          <div className="relative flex mb-8 p-1 bg-white/5 rounded-2xl border border-white/10">
            <div
              className={`absolute top-1 bottom-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl transition-all duration-300 ease-out ${
                activeTab === "client" ? "left-1 right-1/2 mr-0.5" : "right-1 left-1/2 ml-0.5"
              }`}
            />
            {["client", "admin"].map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setStep(1); setError(""); }}
                className={`relative flex-1 py-3 text-center font-semibold rounded-xl capitalize transition-all duration-300 ${
                  activeTab === tab ? "text-white" : "text-slate-300 hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* ── Client Login (Clerk) ── */}
          {activeTab === "client" && (
            <div className="flex justify-center">
              <div className="w-full max-w-md">
                <SignIn />
              </div>
            </div>
          )}

          {/* ── Admin Step 1: Email + Password ── */}
          {activeTab === "admin" && step === 1 && (
            <form onSubmit={handleAdminLogin} className="space-y-5">
              <div className="text-center mb-2">
                <p className="text-slate-300 text-sm">Enter your admin credentials</p>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-2">
                  Admin Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={adminData.email}
                    onChange={(e) => setAdminData({ ...adminData, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 text-white rounded-xl focus:border-purple-400 outline-none transition-all placeholder-slate-500"
                    placeholder="admin@example.com"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={adminData.password}
                    onChange={(e) => setAdminData({ ...adminData, password: e.target.value })}
                    className="w-full pl-10 pr-10 py-3 bg-white/10 border border-white/20 text-white rounded-xl focus:border-purple-400 outline-none transition-all placeholder-slate-500"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 text-white py-3 px-4 rounded-xl font-semibold shadow-lg transition-all duration-300"
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Verifying…</>
                ) : (
                  "Continue"
                )}
              </button>
            </form>
          )}

          {/* ── Admin Step 2: TOTP Code ── */}
          {activeTab === "admin" && step === 2 && (
            <form onSubmit={handleTotpVerify} className="space-y-6">
              {/* Icon + instructions */}
              <div className="text-center space-y-3">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-500/20 border border-indigo-500/30 rounded-2xl">
                  <Smartphone className="w-7 h-7 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">Authenticator Code</h3>
                  <p className="text-slate-400 text-sm mt-1">
                    Open <span className="text-white font-medium">Microsoft Authenticator</span> and enter the
                    6-digit code for <span className="text-indigo-300 font-medium">IPR Admin</span>
                  </p>
                </div>
              </div>

              {/* 6-digit code input */}
              <div>
                <input
                  type="text"
                  inputMode="numeric"
                  value={totpCode}
                  onChange={handleTotpInput}
                  maxLength={6}
                  placeholder="000000"
                  autoFocus
                  className="w-full text-center text-3xl tracking-[0.5em] font-mono bg-white/10 border border-white/20 text-white rounded-xl py-4 focus:border-indigo-400 outline-none transition-all placeholder-slate-600"
                />
                <p className="text-center text-xs text-slate-500 mt-2">
                  Code refreshes every 30 seconds
                </p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3 rounded-xl text-sm text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || totpCode.length !== 6}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 text-white py-3 px-4 rounded-xl font-semibold shadow-lg transition-all duration-300"
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Verifying…</>
                ) : (
                  <><ShieldCheck className="w-4 h-4" /> Verify & Sign In</>
                )}
              </button>

              <button
                type="button"
                onClick={() => { setStep(1); setError(""); setTotpCode(""); }}
                className="w-full text-slate-400 hover:text-white text-sm transition-colors py-1"
              >
                ← Back to credentials
              </button>
            </form>
          )}
        </div>

        <div className="text-center mt-6 text-slate-500 text-sm">
        </div>
      </div>
    </div>
  );
}
