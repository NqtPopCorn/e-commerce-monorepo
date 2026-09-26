"use client";

import { useState } from "react";
import { authService } from "@/services/auth.service";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

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
import Link from "next/link";

const formSchema = z.object({
  email: z.string().email({ message: "Email không hợp lệ" }),
});

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setError(null);
      setSuccess(null);

      await authService.forgotPassword(values.email);

      setSuccess("Yêu cầu đặt lại mật khẩu đã được gửi đến email của bạn.");
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Có lỗi xảy ra. Vui lòng thử lại sau.",
      );
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
            <div className="flex flex-col items-center justify-center lg:items-start lg:justify-start mb-6">
              <h2 className="text-3xl font-bold text-gray-800">
                Quên mật khẩu
              </h2>
              <p className="text-gray-500 mt-2 text-center lg:text-left">
                Vui lòng nhập địa chỉ email của bạn. Chúng tôi sẽ gửi một liên
                kết để tạo mật khẩu mới.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-500 p-3 rounded-md mb-4 text-sm border border-red-200">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 text-green-600 p-3 rounded-md mb-4 text-sm border border-green-200">
                {success}
              </div>
            )}

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-5"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">
                        Địa chỉ Email
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="h-12"
                          placeholder="Nhập email của bạn"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="mt-6 pt-2">
                  <Button
                    type="submit"
                    className="w-full lg:w-auto px-10 h-12 text-lg bg-[#007bff] hover:bg-blue-700 text-white rounded-md transition-colors shadow-md"
                  >
                    Gửi Yêu Cầu
                  </Button>
                  <p className="text-sm font-semibold mt-4 pt-1 mb-0 text-gray-600 text-center lg:text-left">
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
          </div>
        </div>
      </div>
    </section>
  );
}
