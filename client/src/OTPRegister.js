import React, { useState } from "react";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import app from "./firebase";

const auth = getAuth(app);

export default function OTPRegister() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);

  const setupRecaptcha = () => {
    window.recaptchaVerifier = new RecaptchaVerifier(
      "recaptcha-container",
      {
        size: "invisible",
        callback: () => {
          console.log("reCAPTCHA solved ✔️");
        },
      },
      auth
    );
  };

  const handleSendOtp = async () => {
    if (!phone || phone.length !== 10) {
      return alert("Enter a valid 10-digit phone number");
    }

    setupRecaptcha();
    const appVerifier = window.recaptchaVerifier;

    try {
      const result = await signInWithPhoneNumber(auth, `+91${phone}`, appVerifier);
      setConfirmationResult(result);
      setOtpSent(true);
      alert("OTP sent to your phone!");
    } catch (err) {
      console.error("Error sending OTP:", err);
      alert("Failed to send OTP");
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) return alert("Please enter OTP");

    try {
      await confirmationResult.confirm(otp);
      alert("✅ OTP verified successfully!");
    } catch (err) {
      console.error("Verification failed:", err);
      alert("❌ Invalid OTP");
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>📱 Register with Mobile Number</h2>
      <input
        type="text"
        placeholder="Phone (10 digits)"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <button onClick={handleSendOtp}>Send OTP</button>

      {otpSent && (
        <>
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
          <button onClick={handleVerifyOtp}>Verify OTP</button>
        </>
      )}

      <div id="recaptcha-container"></div>
    </div>
  );
}
