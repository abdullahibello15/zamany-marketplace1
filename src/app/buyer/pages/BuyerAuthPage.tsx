import { useState } from "react"
import { Eye, ShieldCheck } from "lucide-react"
import { useNavigate, useSearchParams } from "react-router"
import { AppErrorState } from "../../shared/components/AppStates"
import { AppField, appInputClass } from "../../shared/components/AppForm"
import { ApiError } from "../../api"
import { useBuyer } from "../lib/BuyerContext"

type Mode = "login" | "register" | "reset" | "verify"

export function BuyerAuthPage() {
  const [params] = useSearchParams()
  const [mode, setMode] = useState<Mode>((params.get("mode") as Mode) || "login")
  const [form, setForm] = useState({ email: "", password: "", confirmPassword: "", code: "" })
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const { login, register, verifyAccount } = useBuyer()
  const navigate = useNavigate()

  const set = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }))

  const validateRegistration = () => {
    const next: Record<string, string> = {}
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = "Enter a valid email address."
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) next.password = "Use an uppercase letter, lowercase letter, and a number."
    if (form.password !== form.confirmPassword) next.confirmPassword = "Passwords do not match."
    setFieldErrors(next)
    return Object.keys(next).length === 0
  }

  const showApiError = (err: unknown) => {
    if (err instanceof ApiError && err.status === 401) {
      setError("Invalid email or password.")
      return
    }
    if (err instanceof ApiError && err.status === 403) {
      setError("Account is not active — contact support.")
      return
    }
    if (err instanceof ApiError && err.status < 500 && err.body && typeof err.body === "object" && "message" in err.body) {
      const messages = Array.isArray(err.body.message) ? err.body.message.map(String) : [String(err.body.message)]
      const next: Record<string, string> = {}
      messages.forEach((entry) => {
        const lower = entry.toLowerCase()
        if (lower.includes("email")) next.email = entry
        else if (lower.includes("password")) next.password = entry
      })
      setFieldErrors(next)
      setError(Object.keys(next).length ? "Please correct the highlighted fields." : messages.join(" "))
      return
    }
    setError("We could not create your account. Please check your connection and try again.")
  }

  const validateLogin = () => {
    const next: Record<string, string> = {}
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = "Enter a valid email address."
    if (!form.password) next.password = "Enter your password."
    setFieldErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = async () => {
    try {
      setLoading(true)
      setError("")
      setMessage("")
      setFieldErrors({})
      if (mode === "login") {
        if (!validateLogin()) return
        const role = await login(form.email, form.password)
        navigate(role === "VENDOR" ? "/seller-dashboard" : role === "ADMIN" ? "/admin" : "/dashboard")
      } else if (mode === "register") {
        if (!validateRegistration()) return
        await register({ email: form.email, password: form.password })
        navigate("/dashboard")
      } else if (mode === "verify") {
        await verifyAccount(form.code)
        navigate("/dashboard")
      } else {
        setMessage("Password reset request submitted. Backend email/SMS delivery is not configured in this workspace.")
      }
    } catch (err) {
      showApiError(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto grid min-h-[calc(100vh-74px)] max-w-7xl px-4 py-6 lg:grid-cols-[1fr_480px]">
      <section className="hidden overflow-hidden rounded-xl bg-green-800 text-white lg:block">
        <div className="flex h-full flex-col justify-end bg-[url('https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?w=1000&h=900&fit=crop&auto=format')] bg-cover bg-center">
          <div className="bg-green-950/70 p-8">
            <ShieldCheck className="mb-4 h-10 w-10 text-amber-300" />
            <h1 className="text-4xl font-black">Secure buyer access</h1>
            <p className="mt-3 max-w-lg text-green-100">Manage orders, saved addresses, payment options, favorites, and reviews from one buyer workspace.</p>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center">
        <div className="w-full max-w-md rounded-xl border border-green-100 bg-white p-6">
          <h1 className="text-2xl font-black text-gray-900">
            {mode === "login" && "Welcome back"}
            {mode === "register" && "Create buyer account"}
            {mode === "reset" && "Reset password"}
            {mode === "verify" && "Verify account"}
          </h1>
          <p className="mt-1 text-sm text-gray-500">Buyer access for ZAMANI NG MARKET HUB.</p>
          {error && <div className="mt-4"><AppErrorState body={error} /></div>}
          {message && <div className="mt-4 rounded-xl border border-green-100 bg-green-50 p-3 text-sm font-semibold text-green-700">{message}</div>}

          <div className="mt-5 space-y-4">
            {mode !== "verify" && <AppField label="Email"><input type="email" autoComplete="email" value={form.email} onChange={(event) => set("email", event.target.value)} className={appInputClass} />{fieldErrors.email && <p className="mt-1 text-xs font-semibold text-red-600">{fieldErrors.email}</p>}</AppField>}
            {(mode === "login" || mode === "register") && (
              <AppField label="Password">
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} autoComplete={mode === "register" ? "new-password" : "current-password"} value={form.password} onChange={(event) => set("password", event.target.value)} className={`${appInputClass} pr-10`} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><Eye size={16} /></button>
                </div>
              </AppField>
            )}
            {mode === "login" && fieldErrors.password && <p className="-mt-2 text-xs font-semibold text-red-600">{fieldErrors.password}</p>}
            {mode === "register" && <AppField label="Confirm password"><input type={showPassword ? "text" : "password"} autoComplete="new-password" value={form.confirmPassword} onChange={(event) => set("confirmPassword", event.target.value)} className={appInputClass} />{fieldErrors.password && <p className="mt-1 text-xs font-semibold text-red-600">{fieldErrors.password}</p>}{fieldErrors.confirmPassword && <p className="mt-1 text-xs font-semibold text-red-600">{fieldErrors.confirmPassword}</p>}<p className="mt-1 text-xs text-gray-500">Use uppercase, lowercase, and a number.</p></AppField>}
            {mode === "verify" && <AppField label="Verification code"><input value={form.code} onChange={(event) => set("code", event.target.value)} className={appInputClass} placeholder="4-6 digit code" /></AppField>}
            <button onClick={() => void submit()} disabled={loading} className="w-full rounded-xl bg-green-700 px-4 py-3 font-black text-white hover:bg-green-800 disabled:opacity-50">
              {loading ? "Please wait..." : mode === "login" ? "Login" : mode === "register" ? "Create account" : mode === "verify" ? "Verify account" : "Send reset link"}
            </button>
          </div>

          <div className="mt-5 flex flex-wrap justify-center gap-3 text-sm font-semibold">
            {mode !== "login" && <button onClick={() => setMode("login")} className="text-green-700">Login</button>}
            {mode !== "register" && <button onClick={() => setMode("register")} className="text-green-700">Register</button>}
            {mode !== "reset" && <button onClick={() => setMode("reset")} className="text-green-700">Forgot password</button>}
          </div>
        </div>
      </section>
    </div>
  )
}
