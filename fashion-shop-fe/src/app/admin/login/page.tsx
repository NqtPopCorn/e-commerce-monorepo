"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  Loader2,
  AlertCircle,
  KeyRound,
} from "lucide-react";

import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth.store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const formSchema = z.object({
  email: z.string().email({ message: "Email không đúng định dạng" }),
  password: z.string().min(6, { message: "Mật khẩu tối thiểu 6 ký tự" }),
});

type FormValues = z.infer<typeof formSchema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Nếu đã đăng nhập với vai trò ADMIN thì chuyển thẳng vào /admin
  useEffect(() => {
    if (hasHydrated && user && user.role === "ADMIN") {
      router.replace("/admin");
    }
  }, [hasHydrated, user, router]);

  async function onSubmit(values: FormValues) {
    setLoading(true);
    setError(null);

    try {
      const result = await authService.login({
        email: values.email,
        password: values.password,
      });

      // Kiểm tra quyền hạn: chỉ cho phép tài khoản ADMIN đăng nhập
      if (result.user.role !== "ADMIN") {
        setError("Tài khoản của bạn không có quyền truy cập trang quản trị!");
        return;
      }

      setAuth(result.accessToken, result.user);
      router.push("/admin");
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError("Email hoặc mật khẩu quản trị không chính xác.");
      } else {
        setError(
          err.response?.data?.message ||
            "Không thể kết nối đến máy chủ. Vui lòng thử lại sau.",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  const fillAdminCredentials = () => {
    form.setValue("email", "admin@fashionshop.com");
    form.setValue("password", "admin123");
    setError(null);
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center p-4 sm:p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-zinc-900 relative overflow-hidden select-none">
      {/* Background Decorative Blurs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Center Card */}
      <div className="w-full max-w-[440px] z-10">
        {/* Link back to public shop */}
        <div className="mb-5 flex justify-between items-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-300 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Về trang bán hàng</span>
          </Link>

          <span className="text-xs text-slate-400 bg-slate-800/80 border border-slate-700/60 px-2.5 py-1 rounded-full flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Bảo mật SSL
          </span>
        </div>

        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/40 border border-white/20 p-7 sm:p-9 text-slate-900">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/25 mb-3.5">
              <KeyRound className="w-7 h-7 text-rose-500" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-950 flex items-center justify-center gap-1">
              <span>FASHION</span>
              <span className="text-rose-600">SHOP</span>
            </h1>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mt-1">
              Admin Portal
            </p>
            <p className="text-sm text-slate-600 mt-2">
              Đăng nhập để quản lý đơn hàng, sản phẩm & kho
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
              <span className="leading-snug">{error}</span>
            </div>
          )}

          {/* Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Email Quản trị
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <Input
                          placeholder="admin@fashionshop.com"
                          type="email"
                          autoComplete="email"
                          className="pl-10 h-11 bg-slate-50 border-slate-200 rounded-xl focus-visible:ring-slate-900"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Mật khẩu
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <Input
                          placeholder="••••••••"
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          className="pl-10 pr-10 h-11 bg-slate-50 border-slate-200 rounded-xl focus-visible:ring-slate-900"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                          tabIndex={-1}
                          aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-slate-950 hover:bg-slate-800 text-white font-semibold rounded-xl shadow-md transition-all duration-150 flex items-center justify-center gap-2 active:scale-[0.99] cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang xác thực...</span>
                    </>
                  ) : (
                    <span>Đăng nhập Quản trị</span>
                  )}
                </Button>
              </div>
            </form>
          </Form>

          {/* Quick Demo Fill Helper */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <button
              type="button"
              onClick={fillAdminCredentials}
              className="w-full py-2 px-3 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1.5 border border-slate-200/60"
            >
              <KeyRound className="w-3.5 h-3.5 text-rose-500" />
              <span>Điền nhanh tài khoản Admin mẫu</span>
            </button>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-400 mt-5">
          &copy; {new Date().getFullYear()} Fashion Shop — All rights reserved.
        </p>
      </div>
    </div>
  );
}
