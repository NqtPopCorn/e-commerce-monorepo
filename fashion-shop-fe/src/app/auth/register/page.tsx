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
    phone: "",
    gender: "FEMALE" as "MALE" | "FEMALE" | "OTHER",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await authService.register({
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone.trim() || undefined,
        gender: form.gender,
      });
      setAuth(result.accessToken, result.user);
      router.push("/products");
    } catch (err: any) {
      const msg = err.response?.data?.message || "Không thể đăng ký tài khoản.";
      setError(msg);
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
        <div>
          <h1 className="text-2xl font-bold">Tạo tài khoản</h1>
          <p className="mt-1 text-sm text-slate-500">
            Đăng ký để mua sắm và nhận ưu đãi từ Fashion Shop
          </p>
        </div>
        {error && (
          <p className="rounded-md bg-red-50 p-3 text-sm text-red-600">
            {error}
          </p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-700 block mb-1">
              Họ
            </label>
            <input
              required
              placeholder="Nguyễn"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-700 block mb-1">
              Tên
            </label>
            <input
              required
              placeholder="Văn An"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-700 block mb-1">
              Số điện thoại
            </label>
            <input
              type="tel"
              placeholder="0901234567"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full rounded-md border px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-700 block mb-1">
              Giới tính
            </label>
            <select
              value={form.gender}
              onChange={(e) =>
                setForm({
                  ...form,
                  gender: e.target.value as "MALE" | "FEMALE" | "OTHER",
                })
              }
              className="w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="FEMALE">Nữ</option>
              <option value="MALE">Nam</option>
              <option value="OTHER">Khác</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-700 block mb-1">
            Email
          </label>
          <input
            required
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-700 block mb-1">
            Mật khẩu
          </label>
          <input
            required
            minLength={6}
            type="password"
            placeholder="Tối thiểu 6 ký tự"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {loading ? "Đang tạo tài khoản..." : "Đăng ký"}
        </button>
        <p className="text-center text-sm text-slate-500">
          Đã có tài khoản?{" "}
          <Link
            href="/auth/login"
            className="text-primary hover:underline font-medium"
          >
            Đăng nhập
          </Link>
        </p>
      </form>
    </main>
  );
}
