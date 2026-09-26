"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth.store";
export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await authService.register(form);
      setAuth(result.accessToken, result.user);
      router.push("/books");
    } catch {
      setError("Không thể đăng ký tài khoản.");
    } finally {
      setLoading(false);
    }
  }
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <form
        onSubmit={submit}
        className="w-full max-w-md space-y-4 rounded-xl border bg-white p-8 shadow-sm"
      >
        <h1 className="text-2xl font-bold">Tạo tài khoản</h1>
        {error && (
          <p className="rounded-md bg-red-50 p-3 text-sm text-red-600">
            {error}
          </p>
        )}
        <input
          required
          placeholder="Họ"
          value={form.firstName}
          onChange={(e) => setForm({ ...form, firstName: e.target.value })}
          className="w-full rounded-md border px-3 py-2"
        />
        <input
          required
          placeholder="Tên"
          value={form.lastName}
          onChange={(e) => setForm({ ...form, lastName: e.target.value })}
          className="w-full rounded-md border px-3 py-2"
        />
        <input
          required
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full rounded-md border px-3 py-2"
        />
        <input
          required
          minLength={8}
          type="password"
          placeholder="Mật khẩu tối thiểu 8 ký tự"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full rounded-md border px-3 py-2"
        />
        <button
          disabled={loading}
          className="w-full rounded-md bg-orange-500 px-4 py-2 font-medium text-white hover:bg-orange-600 disabled:opacity-50"
        >
          {loading ? "Đang tạo..." : "Đăng ký"}
        </button>
        <p className="text-center text-sm text-slate-500">
          Đã có tài khoản?{" "}
          <Link href="/auth/login" className="text-orange-600">
            Đăng nhập
          </Link>
        </p>
      </form>
    </main>
  );
}
