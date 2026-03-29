/**
 * Example: Student Login Component
 * Shows how to use the authentication service in your React app
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStudentAuth } from "../hooks/useAuth";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";

export const StudentLoginForm = () => {
  const navigate = useNavigate();
  const { login, isLoading, error } = useStudentAuth();
  
  const [formData, setFormData] = useState({
    roll_number: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // This will:
      // 1. Send roll_number + password to backend
      // 2. Backend verifies credentials
      // 3. If valid, creates JWT token
      // 4. Frontend stores token in localStorage
      // 5. User can now access protected routes
      await login(formData.roll_number, formData.password);
      
      // Redirect to dashboard on successful login
      navigate("/dashboard");
    } catch (err) {
      // Error is already captured in state
      console.error("Login failed:", err);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Student Login</h2>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Roll Number
          </label>
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
          <label className="block text-sm font-medium mb-1">Password</label>
          <Input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            required
            disabled={isLoading}
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? "Logging in..." : "Login"}
        </Button>
      </form>

      <p className="text-sm text-gray-600 mt-4 text-center">
        Don't have an account?{" "}
        <a href="/register" className="text-blue-600 hover:underline">
          Register here
        </a>
      </p>
    </Card>
  );
};

export default StudentLoginForm;