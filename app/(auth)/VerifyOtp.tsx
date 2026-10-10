"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import { Loader2 } from "lucide-react";
import Button from "@/components/Button";
import Link from "next/link";
import { useAuth } from "@/providers/AuthProvider";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

const VerifyOtp: React.FC = () => {
  const [otp, setOtp] = useState("");
  const [resendCooldown, setResendCooldown] = useState(30);
  const { authState, verifyOTP, resendOtp, verify2FALogin, resend2FALoginOtp, loading } = useAuth();

  const searchParams = useSearchParams();
  const queryFrom = searchParams.get("from");
  const currentFrom = queryFrom || authState?.from || "signup";
  const isForgotPassword = currentFrom === "forgotPassword";
  const isLogin2FA = currentFrom === "login2fa";

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Verify OTP handler
  const handleOtpVerify = async () => {
    if (otp.trim().length !== 6) {
      toast.error("Please enter the complete 6-digit OTP code.");
      return;
    }
    
    if (isLogin2FA) {
      await verify2FALogin(otp);
    } else {
      await verifyOTP(otp, currentFrom);
    }
  };

  // Resend OTP handler
  const handleResend = async () => {
    if (!authState?.email) {
      toast.error("Email not found. Please try again.");
      return;
    }
    setResendCooldown(30);
    
    if (isLogin2FA) {
      await resend2FALoginOtp();
    } else {
      await resendOtp(authState.email, currentFrom);
    }
  };

  // Get page title based on context
  const getTitle = () => {
    if (isLogin2FA) return "Two-Factor Authentication";
    if (isForgotPassword) return "Verify OTP";
    return "Verify Email";
  };

  // Get description based on context
  const getDescription = () => {
    const emailText = authState?.email || "your email";
    if (isLogin2FA) {
      return `Please enter the 6-digit verification code sent to ${emailText} to complete your login.`;
    }
    if (isForgotPassword) {
      return `Please enter the 6-digit verification code sent to ${emailText} to reset your password.`;
    }
    return `Please enter the 6-digit verification code sent to ${emailText}.`;
  };

  // Get button text based on context
  const getButtonText = () => {
    if (loading) return "Verifying...";
    if (isLogin2FA) return "Verify & Login";
    if (isForgotPassword) return "Verify OTP";
    return "Verify Email";
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-white">
      <div className="flex flex-col justify-center px-6 lg:px-40 py-10 space-y-6">
        <Link href="/">
          <Image
            src={"/logo/BANCre.png"}
            alt={'logo'}
            width={150}
            height={50}
            className='hidden lg:flex'
          />
        </Link>

        <h2 className="text-3xl font-semibold">
          {getTitle()}
        </h2>

        <p className="text-sm text-gray-600">
          {getDescription()}
        </p>

        <div className="flex flex-col justify-center items-center gap-4 mt-8">
          <InputOTP
            maxLength={6}
            pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
            value={otp}
            onChange={(value) => setOtp(value)}
          >
            <InputOTPGroup className="gap-5">
              <InputOTPSlot className="w-14 h-14 rounded-lg border border-[#bdb9b9] data-[active=true]:border-3 data-[active=true]:border-blue-600 data-[active=true]:ring-0" index={0} />
              <InputOTPSlot className="w-14 h-14 rounded-lg border border-[#bdb9b9] data-[active=true]:border-3 data-[active=true]:border-blue-600 data-[active=true]:ring-0" index={1} />
              <InputOTPSlot className="w-14 h-14 rounded-lg border border-[#bdb9b9] data-[active=true]:border-3 data-[active=true]:border-blue-600 data-[active=true]:ring-0" index={2} />
              <InputOTPSlot className="w-14 h-14 rounded-lg border border-[#bdb9b9] data-[active=true]:border-3 data-[active=true]:border-blue-600 data-[active=true]:ring-0" index={3} />
              <InputOTPSlot className="w-14 h-14 rounded-lg border border-[#bdb9b9] data-[active=true]:border-3 data-[active=true]:border-blue-600 data-[active=true]:ring-0" index={4} />
              <InputOTPSlot className="w-14 h-14 rounded-lg border border-[#bdb9b9] data-[active=true]:border-3 data-[active=true]:border-blue-600 data-[active=true]:ring-0" index={5} />
            </InputOTPGroup>
          </InputOTP>

          {/* Verify Button */}
          <div className="w-full flex justify-center mt-8">
            <Button
              type="button"
              isDisabled={loading || otp.trim().length !== 6}
              text={getButtonText()}
              onClick={handleOtpVerify}
              className="button-primary w-full md:w-[593px] h-14"
            />
          </div>
        </div>

        <div className="mt-8 text-center">
          <span className="text-lg text-gray-700">Didn&apos;t receive a code? </span>
          <button
            type="button"
            className={`cursor-pointer text-blue-600 font-medium inline-flex items-center gap-2 ${
              loading || resendCooldown > 0
                ? "opacity-50 cursor-not-allowed"
                : "hover:underline"
            }`}
            onClick={handleResend}
            disabled={loading || resendCooldown > 0}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend"}
          </button>
        </div>
      </div>

      <div className="relative w-full h-full hidden md:block">
        <Image
          src="/images/Auth_Images/verify_email.jpg"
          alt="buildings"
          fill
          className="object-cover"
        />
      </div>
    </div>
  );
};

export default VerifyOtp;