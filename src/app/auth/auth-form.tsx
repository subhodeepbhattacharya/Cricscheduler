"use client";

import { useState } from "react";
import { sendOtp, verifyPhoneOtp, sendEmailOtp, verifyEmailOtp } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { executeRecaptcha } from "@/lib/recaptcha-client";

/**
 * Phone delivery options:
 * false      — phone sign-in disabled.
 * "whatsapp" — WhatsApp button (OTP delivered via the MSG91 Send SMS Hook).
 *
 * SMS is intentionally not offered as a user-facing sign-in option. (The
 * server still asks Supabase for the "sms" channel in production purely to fire
 * the hook, which delivers over WhatsApp — that's internal, not an SMS choice.)
 */
type PhoneMode = false | "whatsapp";

type AuthMethods = {
  email: boolean;
  phone: PhoneMode;
};

type Method = "email" | "phone";

type Mode = "signin" | "signup";

export function AuthForm({
  next,
  initialMode = "signin",
  methods = { email: true, phone: "whatsapp" },
}: {
  next?: string;
  initialMode?: Mode;
  methods?: AuthMethods;
}) {
  const emailEnabled = methods.email;
  const phoneMode = methods.phone;
  const phoneEnabled = phoneMode !== false;
  const showMethodToggle = emailEnabled && phoneEnabled;

  const [mode, setMode] = useState<Mode>(initialMode);
  // Phone (WhatsApp) is the preferred method; email is a quieter fallback.
  const [method, setMethod] = useState<Method>(phoneEnabled ? "phone" : "email");
  const [step, setStep] = useState<"request" | "verify">("request");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [identifierType, setIdentifierType] = useState<Method>("email");
  const [sentTo, setSentTo] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function requireName(): boolean {
    if (mode === "signup" && !name.trim()) {
      setError("Please enter your name to create an account.");
      return false;
    }
    return true;
  }

  async function sendPhoneCode() {
    setError(null);
    setMessage(null);
    if (!requireName()) return;

    setLoading(true);
    const token = await executeRecaptcha("send_otp");
    const fd = new FormData();
    fd.set("phone", phone);
    if (mode === "signup" && name.trim()) fd.set("name", name.trim());
    fd.set("channel", "whatsapp");
    if (token) fd.set("recaptchaToken", token);
    if (next) fd.set("next", next);

    const result = await sendOtp(fd);
    if (!result.ok) {
      setError(result.error ?? "Could not send the code. Please try again.");
      setLoading(false);
      return;
    }

    setIdentifierType("phone");
    setSentTo(result.phone);
    setStep("verify");
    setMessage(`We sent a code on WhatsApp to ${result.phone}.`);
    setLoading(false);
  }

  async function sendEmailCode() {
    setError(null);
    setMessage(null);
    if (!requireName()) return;

    setLoading(true);
    const token = await executeRecaptcha("send_otp");
    const fd = new FormData();
    fd.set("email", email);
    if (mode === "signup" && name.trim()) fd.set("name", name.trim());
    if (token) fd.set("recaptchaToken", token);
    if (next) fd.set("next", next);

    const result = await sendEmailOtp(fd);
    if (!result.ok) {
      setError(result.error ?? "Could not send the code. Please try again.");
      setLoading(false);
      return;
    }

    setIdentifierType("email");
    setSentTo(result.email);
    setStep("verify");
    setMessage(`We sent a code to ${result.email}.`);
    setLoading(false);
  }

  function resend() {
    if (identifierType === "email") {
      sendEmailCode();
    } else {
      sendPhoneCode();
    }
  }

  async function verify() {
    setLoading(true);
    setError(null);

    const fd = new FormData();
    fd.set("token", code);
    if (next) fd.set("next", next);

    let result: { error?: string } | undefined;
    if (identifierType === "email") {
      fd.set("email", sentTo);
      result = await verifyEmailOtp(fd);
    } else {
      fd.set("phone", sentTo);
      result = await verifyPhoneOtp(fd);
    }

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
    // On success the action redirects, so no further handling needed.
  }

  if (step === "verify") {
    return (
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Enter your code</h2>
        <p className="mt-1 text-sm text-gray-500">
          Enter the 6-digit code sent to <span className="font-medium">{sentTo}</span>.
        </p>

        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            verify();
          }}
        >
          <Input
            label="Verification code"
            name="token"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={8}
            required
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          />

          {message && (
            <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">{message}</div>
          )}
          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}

          <Button type="submit" size="lg" loading={loading}>
            Verify &amp; continue
          </Button>
        </form>

        <div className="mt-4 flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={resend}
            disabled={loading}
            className="font-medium text-emerald-700 hover:text-emerald-800 disabled:opacity-50"
          >
            Resend code
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("request");
              setCode("");
              setError(null);
              setMessage(null);
            }}
            className="font-medium text-gray-500 hover:text-gray-700"
          >
            {identifierType === "email" ? "Change email" : "Change number"}
          </button>
        </div>
      </div>
    );
  }

  function switchMode(nextMode: Mode) {
    setMode(nextMode);
    setError(null);
    setMessage(null);
  }

  function switchMethod(nextMethod: Method) {
    setMethod(nextMethod);
    setError(null);
    setMessage(null);
  }

  const usingEmail = method === "email";

  return (
    <div>
      <div className="mb-5 grid grid-cols-2 gap-1 rounded-lg bg-gray-100 p-1">
        <button
          type="button"
          onClick={() => switchMode("signin")}
          className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            mode === "signin" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => switchMode("signup")}
          className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            mode === "signup" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Sign up
        </button>
      </div>

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (usingEmail) {
            sendEmailCode();
          } else {
            sendPhoneCode();
          }
        }}
      >
        {mode === "signup" && (
          <Input
            label="Name"
            name="name"
            type="text"
            required
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        )}

        {usingEmail ? (
          <Input
            label="Email address"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        ) : (
          <Input
            label="Phone number"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            placeholder="+91 98765 43210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        )}

        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        <Button type="submit" size="lg" loading={loading}>
          {usingEmail ? "Send code" : "Send code on WhatsApp"}
        </Button>
      </form>

      {showMethodToggle && (
        <p className="mt-4 text-center text-xs text-gray-400">
          {usingEmail ? (
            <>
              Prefer WhatsApp?{" "}
              <button
                type="button"
                onClick={() => switchMethod("phone")}
                className="font-medium text-gray-500 underline hover:text-gray-700"
              >
                Use your phone instead
              </button>
            </>
          ) : (
            <>
              No WhatsApp?{" "}
              <button
                type="button"
                onClick={() => switchMethod("email")}
                className="font-medium text-gray-500 underline hover:text-gray-700"
              >
                Sign in with email instead
              </button>
            </>
          )}
        </p>
      )}

      <p className="mt-3 text-center text-xs text-gray-400">
        {mode === "signup"
          ? "We'll send a one-time code to create your account."
          : "We'll send a one-time code to sign in to your account."}
      </p>
    </div>
  );
}
