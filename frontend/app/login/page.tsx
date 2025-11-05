"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Home as HomeIcon, Mail, Phone } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

// Futuristic Background Component
const FuturisticBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Gradient Base */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900" />

      {/* Animated Grid */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(59, 130, 246, 0.3) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(59, 130, 246, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
          animation: "gridScroll 20s linear infinite",
        }}
      />

      {/* Secondary Grid */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(147, 197, 253, 0.5) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(147, 197, 253, 0.5) 1px, transparent 1px)
          `,
          backgroundSize: "100px 100px",
          animation: "gridScroll 30s linear infinite reverse",
        }}
      />

      {/* Floating Dots */}
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-blue-400"
          style={{
            width: Math.random() * 4 + 2 + "px",
            height: Math.random() * 4 + 2 + "px",
            left: Math.random() * 100 + "%",
            top: Math.random() * 100 + "%",
            animation: `float ${Math.random() * 10 + 10}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 5}s`,
            opacity: Math.random() * 0.5 + 0.2,
          }}
        />
      ))}

      {/* Glowing Orbs */}
      <div
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl opacity-20 animate-pulse"
        style={{ animationDuration: "4s" }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl opacity-20 animate-pulse"
        style={{ animationDuration: "6s", animationDelay: "2s" }}
      />

      {/* Scanline Effect */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            "linear-gradient(to bottom, transparent 50%, rgba(255, 255, 255, 0.1) 50%)",
          backgroundSize: "100% 4px",
          animation: "scanline 10s linear infinite",
        }}
      />
    </div>
  );
};

export default function LoginPage() {
  const { login } = useAuth();
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email");
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleMethodToggle = (method: "email" | "phone") => {
    setLoginMethod(method);
    setFormData({
      identifier: "",
      password: formData.password,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate phone number format if using phone login
    if (loginMethod === "phone" && formData.identifier) {
      const phoneRegex = /^\+3834\d{7}$/;
      if (!phoneRegex.test(formData.identifier)) {
        toast.error(
          "Numri i telefonit duhet të fillojë me +383 dhe të jetë në formatin +3834911122"
        );
        return;
      }
    }

    setIsLoading(true);

    try {
      const result = await login(
        formData.identifier,
        formData.password,
        loginMethod
      );

      if (!result.success) {
        toast.error(result.message || "Hyrja dështoi");
      } else {
        toast.success("Hyrja u krye me sukses! Duke ridrejtuar...");
      }
      // If successful, AuthContext will handle the redirect
    } catch (err) {
      toast.error("Dështoi lidhja me serverin. Ju lutemi provoni përsëri.");
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      {/* Add global styles for animations */}
      <style jsx global>{`
        @keyframes gridScroll {
          0% {
            transform: translate(0, 0);
          }
          100% {
            transform: translate(50px, 50px);
          }
        }

        @keyframes float {
          0%,
          100% {
            transform: translate(0, 0);
          }
          25% {
            transform: translate(10px, -10px);
          }
          50% {
            transform: translate(-5px, -20px);
          }
          75% {
            transform: translate(-10px, -10px);
          }
        }

        @keyframes scanline {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(100%);
          }
        }
      `}</style>

      {/* Futuristic Background */}
      <FuturisticBackground />

      {/* Content */}
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-flex justify-center items-center mb-4 gap-2 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <Image
              src="/favicon.svg"
              alt="BllokuSync"
              width={10}
              height={10}
              className="h-8 w-auto"
              priority
              style={{ filter: "brightness(100%) invert(1)" }}
            />
            <h1 className="font-bold text-xl text-white">BllokuSync</h1>
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">
            Mirë se vini përsëri
          </h1>
          <p className="text-blue-200">
            Hyni për të aksesuar portalin tuaj të apartamentit
          </p>
        </div>

        <Card className="border-blue-500/30 shadow-2xl bg-slate-900/80 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">Hyrje</CardTitle>
            <CardDescription className="text-blue-200">
              Vendosni kredencialet tuaja për të hyrë në llogarinë tuaj
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Login Method Toggle */}
            <div className="flex gap-2 mb-6">
              <Button
                type="button"
                variant={loginMethod === "email" ? "default" : "outline"}
                className={`flex-1 ${
                  loginMethod === "email"
                    ? "bg-blue-600 hover:bg-blue-700"
                    : ""
                }`}
                onClick={() => handleMethodToggle("email")}
                disabled={isLoading}
              >
                <Mail className="h-4 w-4 mr-2" />
                Email
              </Button>
              <Button
                type="button"
                variant={loginMethod === "phone" ? "default" : "outline"}
                className={`flex-1 ${
                  loginMethod === "phone"
                    ? "bg-blue-600 hover:bg-blue-700"
                    : ""
                }`}
                onClick={() => handleMethodToggle("phone")}
                disabled={isLoading}
              >
                <Phone className="h-4 w-4 mr-2" />
                Telefon
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="identifier" className="text-white">
                  {loginMethod === "email" ? "Email" : "Numri i Telefonit"}
                </Label>
                <Input
                  id="identifier"
                  name="identifier"
                  type={loginMethod === "email" ? "email" : "tel"}
                  placeholder={
                    loginMethod === "email"
                      ? "john.doe@example.com"
                      : "+3834911122"
                  }
                  value={formData.identifier}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  autoComplete={loginMethod === "email" ? "email" : "tel"}
                  className="bg-white text-slate-900"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">Fjalëkalimi</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                  className="bg-white text-slate-900"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                isLoading={isLoading}
              >
                Hyni
              </Button>

              <div className="text-center text-sm space-y-2">
                <div>
                  <span className="text-slate-300">Nuk keni një llogari? </span>
                  <Link
                    href="/register"
                    className="text-blue-400 hover:text-blue-300 font-medium"
                  >
                    Regjistrohuni këtu
                  </Link>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
