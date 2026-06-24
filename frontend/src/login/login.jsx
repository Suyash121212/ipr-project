import { useState } from "react";
import { SignIn } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
const backend_url = import.meta.env.VITE_BACKEND_URL;
export default function Login() {
  const [activeTab, setActiveTab] = useState("client");
  const [adminData, setAdminData] = useState({
    email: '',
    password: '',
  });
  const [otpData, setOtpData] = useState("");
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // ✅ Temporary admin credentials check
  // const adminApiHandler = async (credentials) => {
  //   const envUsername = import.meta.env.VITE_ADMIN_EMAIL;
  //   const envPassword = import.meta.env.VITE_ADMIN_PASSWORD;
  //   if (
  //     credentials.username === envUsername &&
  //     credentials.password === envPassword
  //   ) {
  //     return { ok: true, message: "Login successful" };
  //   }
  //   return { ok: false, message: "Invalid username or password" };
  // };

  // ✅ Step 1: Handle Admin Login + Send Twilio OTP
  const handleAdminLogin = async (e) => {
    e.preventDefault();

    setError("");
    setIsLoading(true);

    try {
      const loginRes = await fetch(`${backend_url}/api/admin-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: adminData.email,
          password: adminData.password,
        }),
      });

      const loginData = await loginRes.json();

      if (!loginData.success) {
        setError(loginData.message);
        return;
      }

      const otpRes = await fetch(`${backend_url}/api/send-admin-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: adminData.email,
        }),
      });

      const otpData = await otpRes.json();

      if (otpData.success) {
        setStep(2);
      } else {
        setError(otpData.message);
      }
    } catch (error) {
      console.error("Admin login error:", error);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Step 2: Handle OTP Verification
  const handleOtpVerify = async (e) => {
    e.preventDefault();

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(`${backend_url}/api/verify-admin-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: adminData.email,
          code: otpData,
        }),
      });

      const data = await res.json();

      // Backend returns { success: true, token, message }
      if (data.success && data.token) {
        // Store the JWT token so admin API calls can include it
        localStorage.setItem("adminToken", data.token);
        localStorage.setItem("adminSession", "true");
        localStorage.setItem(
          "adminInfo",
          JSON.stringify({
            name: "Administrator",
            email: adminData.email,
          })
        );

        navigate("/admin-dashboard");
      } else {
        setError(data.message || "Invalid OTP. Please try again.");
      }
    } catch (error) {
      console.error("OTP verify error:", error);
      setError("Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 rounded-full bg-purple-500 opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-32 w-80 h-80 rounded-full bg-blue-500 opacity-20 blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-xl mt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full mb-4 shadow-lg">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-slate-400">Sign in to your account</p>
        </div>

        {/* Auth Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-10 shadow-2xl">
          {/* Tabs */}
          <div className="relative flex mb-8 p-1 bg-white/5 rounded-2xl border border-white/10">
            <div
              className={`absolute top-1 bottom-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl transition-all duration-300 ease-out ${activeTab === "client"
                  ? "left-1 right-1/2 mr-0.5"
                  : "right-1 left-1/2 ml-0.5"
                }`}
            />
            <button
              className={`relative flex-1 py-3 text-center font-semibold rounded-xl transition-all duration-300 ${activeTab === "client"
                  ? "text-white"
                  : "text-slate-300 hover:text-white"
                }`}
              onClick={() => setActiveTab("client")}
            >
              Client
            </button>
            <button
              className={`relative flex-1 py-3 text-center font-semibold rounded-xl transition-all duration-300 ${activeTab === "admin"
                  ? "text-white"
                  : "text-slate-300 hover:text-white"
                }`}
              onClick={() => setActiveTab("admin")}
            >
              Admin
            </button>
          </div>

          {/* Client Login */}
          {activeTab === "client" && (
            <div className="animate-fadeIn flex justify-center">
              <div className="w-full max-w-md">
                <SignIn />
              </div>
            </div>
          )}

          {/* Admin Login Step 1 */}
          {activeTab === "admin" && step === 1 && (
            <div className="animate-fadeIn">
              <form onSubmit={handleAdminLogin} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-200 mb-2">
                      Admin Email
                    </label>
                    <input
                      type="email"
                      value={adminData.email}
                      onChange={(e) =>
                        setAdminData({
                          ...adminData,
                          email: e.target.value,
                        })
                      }
                      className="w-full pl-4 pr-4 py-3 bg-white/10 border border-white/20 text-white rounded-xl focus:border-purple-400 outline-none transition-all"
                      placeholder="Enter your admin email"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-200 mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      value={adminData.password}
                      onChange={(e) =>
                        setAdminData({
                          ...adminData,
                          password: e.target.value,
                        })
                      }
                      className="w-full pl-4 pr-4 py-3 bg-white/10 border border-white/20 text-white rounded-xl focus:border-purple-400 outline-none transition-all"
                      placeholder="Enter your password"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3 rounded-xl backdrop-blur-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 px-4 rounded-xl font-semibold shadow-lg transition-all duration-300"
                >
                  {isLoading ? "Sending OTP..." : "Admin Login"}
                </button>
              </form>
            </div>
          )}

          {/* Admin OTP Verification Step 2 */}
          {activeTab === "admin" && step === 2 && (
            <div className="animate-fadeIn space-y-6">
              <p className="text-slate-200 text-center">
                A 6-digit verification code has been sent to your Email.
              </p>

              <form onSubmit={handleOtpVerify} className="space-y-4">
                <input
                  type="text"
                  value={otpData}
                  onChange={(e) => setOtpData(e.target.value)}
                  maxLength={6}
                  placeholder="Enter OTP"
                  className="w-full text-center text-xl tracking-widest bg-white/10 border border-white/20 text-white rounded-xl py-3 focus:border-purple-400 outline-none transition-all"
                />

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3 rounded-xl text-center">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 px-4 rounded-xl font-semibold shadow-lg transition-all duration-300"
                >
                  {isLoading ? "Verifying..." : "Verify OTP"}
                </button>
              </form>
            </div>
          )}
        </div>

        <div className="text-center mt-6 text-slate-400">
          <p className="text-sm">
            Secure login powered by Two-Factor Authentication
          </p>
        </div>
      </div>
    </div>
  );
}