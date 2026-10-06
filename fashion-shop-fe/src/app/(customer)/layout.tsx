import React from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { ChatWidget } from "@/components/chatbot";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[#f0f0f0]">
      <Header />

      {/* Main Content */}
      <main className="flex-1 w-full max-w-[1230px] mx-auto px-4 py-6">
        {children}
      </main>

      <Footer />

      {/* AI Stylist Chatbot Widget */}
      <ChatWidget />
    </div>
  );
}
