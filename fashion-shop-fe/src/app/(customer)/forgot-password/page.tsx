"use client";

import { useEffect, useState } from "react";
import { authService } from "@/services/auth.service";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const requestOtpSchema = z.object({
  target: z
    .string()
    .min(3, { message: "Vui lòng nhập email hoặc số điện thoại" }),
});

const resetPasswordSchema = z
  .object({
    code: z.string().length(6, { message: "Mã OTP gồm chính xác 6 chữ số" }),
    newPassword: z
      .string()
      .min(6, { message: "Mật khẩu phải có ít nhất 6 ký tự" }),
    confirmPassword: z
      .string()
      .min(6, { message: "Vui lòng nhập lại mật khẩu xác nhận" }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<
    "REQUEST_OTP" | "VERIFY_AND_RESET" | "SUCCESS"
  >("REQUEST_OTP");
  const [target, setTarget] = useState<string>("");
  const [channel, setChannel] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(0);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const requestForm = useForm<z.infer<typeof requestOtpSchema>>({
    resolver: zodResolver(requestOtpSchema),
    defaultValues: { target: "" },
  });

  const resetForm = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      code: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  async function onRequestOtp(values: z.infer<typeof requestOtpSchema>) {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      const res = await authService.sendOtp({
        target: values.target,
        type: "FORGOT_PASSWORD",
      });

      setTarget(values.target);
      setChannel(
        res.channel || (values.target.includes("@") ? "EMAIL" : "SMS"),
      );
      setStep("VERIFY_AND_RESET");
      setCountdown(60);
      setSuccess(
        `Mã OTP đã được gửi tới ${
          values.target.includes("@") ? "email" : "số điện thoại"
        } ${values.target}. Vui lòng kiểm tra hộp thư!`,
      );
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Có lỗi xảy ra khi gửi mã OTP. Vui lòng thử lại.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function onResendOtp() {
    if (countdown > 0 || !target) return;
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      await authService.sendOtp({
        target,
        type: "FORGOT_PASSWORD",
      });

      setCountdown(60);
      setSuccess("Mã OTP mới đã được gửi lại thành công!");
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Không thể gửi lại mã OTP. Vui lòng thử lại sau.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function onResetPassword(values: z.infer<typeof resetPasswordSchema>) {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      await authService.resetPassword({
        target,
        code: values.code,
        newPassword: values.newPassword,
      });

      setStep("SUCCESS");
      setSuccess(
        "Mật khẩu của bạn đã được thay đổi thành công. Vui lòng đăng nhập với mật khẩu mới.",
      );
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Mã OTP không hợp lệ hoặc đã hết hạn.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="min-h-[80vh] flex flex-col justify-center py-10">
      <div className="container mx-auto px-4 h-full">
        <div className="flex flex-col md:flex-row justify-center items-center h-full gap-10">
          <div className="w-full md:w-5/12 lg:w-1/2">
            <img
              src="https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-login-form/draw2.webp"
              className="w-full h-auto object-contain grayscale opacity-90"
              alt="Forgot Password graphic"
            />
          </div>
          <div className="w-full md:w-7/12 lg:w-5/12 xl:w-4/12 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
            {step === "SUCCESS" ? (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  ✓
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Đổi Mật Khẩu Thành Công!
                </h2>
                <p className="text-gray-600 mb-6 text-sm">
                  {success || "Mật khẩu của bạn đã được cập nhật an toàn."}
                </p>
                <Link href="/login">
                  <Button className="w-full h-12 text-base bg-[#007bff] hover:bg-blue-700 text-white rounded-md transition-colors shadow-md">
                    Đăng Nhập Ngay
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="flex flex-col items-center justify-center lg:items-start lg:justify-start mb-6">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
                    {step === "REQUEST_OTP" ? "Quên mật khẩu" : "Xác thực OTP"}
                  </h2>
                  <p className="text-gray-500 mt-2 text-sm text-center lg:text-left">
                    {step === "REQUEST_OTP"
                      ? "Nhập email hoặc số điện thoại để nhận mã xác thực OTP."
                      : `Mã OTP gồm 6 chữ số đã được gửi tới ${target}.`}
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm border border-red-200">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="bg-green-50 text-green-700 p-3 rounded-md mb-4 text-sm border border-green-200">
                    {success}
                  </div>
                )}

                {step === "REQUEST_OTP" && (
                  <Form {...requestForm}>
                    <form
                      onSubmit={requestForm.handleSubmit(onRequestOtp)}
                      className="space-y-5"
                    >
                      <FormField
                        control={requestForm.control}
                        name="target"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">
                              Email hoặc Số điện thoại
                            </FormLabel>
                            <FormControl>
                              <Input
                                className="h-12"
                                placeholder="Nhập email hoặc số điện thoại"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="pt-2">
                        <Button
                          type="submit"
                          disabled={isLoading}
                          className="w-full h-12 text-base bg-[#007bff] hover:bg-blue-700 text-white rounded-md transition-colors shadow-md"
                        >
                          {isLoading ? "Đang gửi..." : "Gửi Mã OTP"}
                        </Button>
                        <p className="text-sm font-semibold mt-4 text-gray-600 text-center lg:text-left">
                          Nhớ mật khẩu?{" "}
                          <Link
                            href="/login"
                            className="text-red-600 hover:text-red-700 hover:underline"
                          >
                            Đăng nhập ngay
                          </Link>
                        </p>
                      </div>
                    </form>
                  </Form>
                )}

                {step === "VERIFY_AND_RESET" && (
                  <Form {...resetForm}>
                    <form
                      onSubmit={resetForm.handleSubmit(onResetPassword)}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-between text-xs text-gray-500 bg-gray-50 p-2.5 rounded border border-gray-200">
                        <span>
                          Đang gửi tới:{" "}
                          <strong className="text-gray-800">{target}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setStep("REQUEST_OTP");
                            setError(null);
                            setSuccess(null);
                          }}
                          className="text-blue-600 hover:underline font-semibold"
                        >
                          Thay đổi
                        </button>
                      </div>

                      <FormField
                        control={resetForm.control}
                        name="code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">
                              Mã OTP (6 chữ số)
                            </FormLabel>
                            <FormControl>
                              <Input
                                className="h-12 text-center text-xl font-bold tracking-widest"
                                placeholder="123456"
                                maxLength={6}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={resetForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">
                              Mật khẩu mới
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                className="h-12"
                                placeholder="Nhập ít nhất 6 ký tự"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={resetForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">
                              Xác nhận mật khẩu mới
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                className="h-12"
                                placeholder="Nhập lại mật khẩu mới"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="pt-2 space-y-3">
                        <Button
                          type="submit"
                          disabled={isLoading}
                          className="w-full h-12 text-base bg-[#007bff] hover:bg-blue-700 text-white rounded-md transition-colors shadow-md"
                        >
                          {isLoading ? "Đang xử lý..." : "Đổi Mật Khẩu"}
                        </Button>

                        <div className="text-center text-xs text-gray-500">
                          {countdown > 0 ? (
                            <span>
                              Gửi lại mã OTP sau{" "}
                              <strong className="text-blue-600">
                                {countdown}s
                              </strong>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={onResendOtp}
                              disabled={isLoading}
                              className="text-blue-600 hover:underline font-semibold"
                            >
                              Gửi lại mã OTP ngay
                            </button>
                          )}
                        </div>
                      </div>
                    </form>
                  </Form>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
