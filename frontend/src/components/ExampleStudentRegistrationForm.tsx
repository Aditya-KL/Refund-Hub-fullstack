/**
 * Example: Student Registration Component
 * Shows how to use the registration service
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStudentAuth } from "../hooks/useAuth";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";

export const StudentRegistrationForm = () => {
  const navigate = useNavigate();
  const { register, isLoading, error } = useStudentAuth();

  const [formData, setFormData] = useState({
    roll_number: "",
    email: "",
    full_name: "",
    phone: "",
    account_number: "",
    ifsc_code: "",
    bank_name: "",
    password: "",
    confirm_password: "",
  });

  const [validationError, setValidationError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setValidationError(null);
  };

  const validateForm = (): boolean => {
    // Client-side validation before sending to backend
    
    if (formData.password !== formData.confirm_password) {
      setValidationError("Passwords do not match");
      return false;
    }

    if (formData.password.length < 6) {
      setValidationError("Password must be at least 6 characters");
      return false;
    }

    if (!formData.email.includes("@")) {
      setValidationError("Please enter a valid email");
      return false;
    }

    if (formData.phone.length < 10) {
      setValidationError("Phone number must be at least 10 digits");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      // Backend will:
      // 1. Check all required fields are present
      // 2. Check rollNumber and email uniqueness
      // 3. Hash the password
      // 4. Insert student record in database
      const { confirm_password, ...dataToSend } = formData;
      
      await register(dataToSend);

      // After successful registration, redirect to login
      navigate("/login", {
        state: { message: "Registration successful! Please login." },
      });
    } catch (err) {
      console.error("Registration failed:", err);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Student Registration</h2>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {validationError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{validationError}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Personal Information */}
          <div>
            <label className="block text-sm font-medium mb-1">Roll Number</label>
            <Input
              type="text"
              name="roll_number"
              value={formData.roll_number}
              onChange={handleChange}
              placeholder="e.g., 23BCS001"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <Input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              required
              disabled={isLoading}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <Input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="John Doe"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <Input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="9876543210"
              required
              disabled={isLoading}
            />
          </div>

          {/* Banking Information */}
          <div>
            <label className="block text-sm font-medium mb-1">Account Number</label>
            <Input
              type="text"
              name="account_number"
              value={formData.account_number}
              onChange={handleChange}
              placeholder="1234567890123456"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">IFSC Code</label>
            <Input
              type="text"
              name="ifsc_code"
              value={formData.ifsc_code}
              onChange={handleChange}
              placeholder="SBIN0001234"
              required
              disabled={isLoading}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Bank Name</label>
            <Input
              type="text"
              name="bank_name"
              value={formData.bank_name}
              onChange={handleChange}
              placeholder="State Bank of India"
              required
              disabled={isLoading}
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <Input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Minimum 6 characters"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Confirm Password
            </label>
            <Input
              type="password"
              name="confirm_password"
              value={formData.confirm_password}
              onChange={handleChange}
              placeholder="Re-enter password"
              required
              disabled={isLoading}
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? "Registering..." : "Register"}
        </Button>
      </form>

      <p className="text-sm text-gray-600 mt-4 text-center">
        Already have an account?{" "}
        <a href="/login" className="text-blue-600 hover:underline">
          Login here
        </a>
      </p>
    </Card>
  );
};

export default StudentRegistrationForm;
