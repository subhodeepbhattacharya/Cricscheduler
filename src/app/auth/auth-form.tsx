"use client";

import { useState } from "react";
import { sendOtp, verifyPhoneOtp } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { executeRecaptcha } from "@/lib/recaptcha-client";

type Channel = "whatsapp" | "sms";

export function AuthForm({ next }: { next?: string }) {
  const [step, setStep] = useState<"request" | "verify">("request");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [normalizedPhone, setNormalizedPhone] = useState("");
  const [channel, setChannel] = useState<Channel>("whatsapp");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function sendCode(viaChannel: Channel) {
    setLoading(true);
    setError(null);
    setMessage(null);

    const token = await executeRecaptcha("send_otp");
    const fd = new FormData();
    fd.set("phone", phone);
    if (name) fd.set("name", name);
    fd.set("channel", viaChannel);
    if (token) fd.set("recaptchaToken", token);
    if (next) fd.set("next", next);

    const result = await sendOtp(fd);
    if (!result.ok) {
      setError(result.error ?? "Could not send the code. Please try again.");
      setLoading(false);
      return;
    }

    setNormalizedPhone(result.phone);
    setChannel(viaChannel);
    setStep("verify");
    setMessage(
      `We sent a code via ${viaChannel === "sms" ? "SMS" : "WhatsApp"} to ${result.phone}.`
    );
    setLoading(false);
  }

  async function verify() {
    setLoading(true);
    setError(null);

    const fd = new FormData();
    fd.set("phone", normalizedPhone);
    fd.set("token", code);
    if (next) fd.set("next", next);

    const result = await verifyPhoneOtp(fd);
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
          Enter the 6-digit code sent to <span className="font-medium">{normalizedPhone}</span>.
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
            onClick={() => sendCode(channel)}
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
            Change number
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          sendCode("whatsapp");
        }}
      >
        <Input
          label="Name"
          name="name"
          type="text"
          placeholder="Your name (new accounts)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
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

        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        <Button type="submit" size="lg" loading={loading}>
          Send code on WhatsApp
        </Button>
      </form>

      <button
        type="button"
        onClick={() => sendCode("sms")}
        disabled={loading}
        className="mt-3 w-full text-center text-sm font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50"
      >
        Use SMS instead
      </button>

      <p className="mt-4 text-center text-xs text-gray-400">
        We&apos;ll text you a one-time code to sign in. New numbers create an account automatically.
      </p>
    </div>
  );
}
