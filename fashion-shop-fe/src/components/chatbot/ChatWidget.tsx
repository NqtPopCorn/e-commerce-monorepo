"use client";

import React, { useState, useEffect } from "react";
import { useChatbotStore } from "@/stores/chatbot.store";
import { ChatTriggerButton } from "./ChatTriggerButton";
import { ChatWindow } from "./ChatWindow";

export const ChatWidget: React.FC = () => {
  const { isOpen, hasUnread, toggleOpen, setOpen } = useChatbotStore();
  const [mounted, setMounted] = useState(false);

  // Prevent SSR hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <>
      <ChatTriggerButton
        isOpen={isOpen}
        hasUnread={hasUnread}
        onClick={toggleOpen}
      />
      {isOpen && <ChatWindow onClose={() => setOpen(false)} />}
    </>
  );
};
