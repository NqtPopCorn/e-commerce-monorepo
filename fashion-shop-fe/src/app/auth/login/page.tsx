"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth.store";
export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await authService.login({ email, password });
      setAuth(result.accessToken, result.user);
      router.push("/books");
    } catch {
      setError("Email hoặc mật khẩu không đúng.");
    } finally {
      setLoading(false);
    }
  }
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <form
        onSubmit={submit}
        className="w-full max-w-md space-y-5 rounded-xl border bg-white p-8 shadow-sm"
      >
        <div>
          <h1 className="text-2xl font-bold">Đăng nhập</h1>
          <p className="mt-1 text-sm text-slate-500">Đăng nhập vào Book Shop</p>
        </div>
        {error && (
          <p className="rounded-md bg-red-50 p-3 text-sm text-red-600">
            {error}
          </p>
        )}
        <input
          required
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-orange-400"
        />
        <input
          required
          minLength={8}
          type="password"
          placeholder="Mật khẩu"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-orange-400"
        />
        <button
          disabled={loading}
          className="w-full rounded-md bg-orange-500 px-4 py-2 font-medium text-white hover:bg-orange-600 disabled:opacity-50"
        >
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
        <p className="text-center text-sm text-slate-500">
          Chưa có tài khoản?{" "}
          <Link href="/auth/register" className="text-orange-600">
            Đăng ký
          </Link>
        </p>
      </form>
    </main>
  );
}
