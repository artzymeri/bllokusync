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
import { Home as HomeIcon, Mail, Phone, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Futuristic Background Component
const FuturisticBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Gradient Base - Light Theme */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-slate-50" />

      {/* Animated Grid */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(59, 130, 246, 0.2) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(59, 130, 246, 0.2) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
          animation: "gridScroll 20s linear infinite",
        }}
      />

      {/* Secondary Grid */}
      <div
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(147, 51, 234, 0.3) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(147, 51, 234, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: "100px 100px",
          animation: "gridScroll 30s linear infinite reverse",
        }}
      />

      {/* Glowing Orbs */}
      <div
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-300 rounded-full filter blur-3xl opacity-20 animate-pulse"
        style={{ animationDuration: "4s" }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-300 rounded-full filter blur-3xl opacity-20 animate-pulse"
        style={{ animationDuration: "6s", animationDelay: "2s" }}
      />

      {/* Scanline Effect */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            "linear-gradient(to bottom, transparent 50%, rgba(59, 130, 246, 0.1) 50%)",
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
  const [contactOpen, setContactOpen] = useState(false);

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
              style={{ filter: "brightness(0%)" }}
            />
            <h1 className="font-bold text-xl text-slate-900">BllokuSync</h1>
          </Link>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Mirë se vini përsëri
          </h1>
        </div>

        <Card className="border-blue-200 shadow-2xl bg-white/90 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-slate-900">Hyrje</CardTitle>
            <CardDescription className="text-slate-600">
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
                <Label htmlFor="identifier" className="text-slate-900">
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
                <Label htmlFor="password" className="text-slate-900">Fjalëkalimi</Label>
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
                  <span className="text-slate-600">Nuk keni një llogari? </span>
                  <Link
                    href="/register"
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Regjistrohuni këtu
                  </Link>
                </div>
                <div>
                  <Link
                    href="/forgot-password"
                    className="text-slate-600 hover:text-slate-700"
                  >
                    Keni harruar fjalëkalimin?
                  </Link>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Help Button */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => setContactOpen(true)}
            className="cursor-pointer group relative px-6 py-3 rounded-xl bg-gradient-to-r from-blue-100 to-purple-100 border border-blue-300 hover:border-blue-400 backdrop-blur-sm transition-all duration-300 hover:scale-105 shadow-lg"
          >
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-200/0 to-purple-200/0 group-hover:from-blue-200/30 group-hover:to-purple-200/30 transition-all duration-300" />
            <div className="relative flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-blue-600 group-hover:text-blue-700 transition-colors" />
              <span className="text-slate-900 font-medium">Ju duhet ndihmë?</span>
            </div>
          </button>
        </div>
      </div>

      {/* Contact Modal */}
      <Dialog open={contactOpen} onOpenChange={setContactOpen}>
        <DialogContent className="sm:max-w-[400px] bg-gradient-to-br from-slate-900 to-slate-800 text-white border-white/10">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Kontaktoni
            </DialogTitle>
            <DialogDescription className="text-gray-300 pt-4">
              Lidhuni me ekipin tonë
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Numri i Telefonit</p>
                <a
                  href="tel:+38346131908"
                  className="text-lg font-semibold text-white hover:text-purple-400 transition-colors"
                >
                  +383 46 131 908
                </a>
              </div>
            </div>
            <p className="text-sm text-gray-400 text-center">
              Ekipi ynë i mbështetjes është i disponueshëm për t'ju ndihmuar me çdo pyetje apo shqetësim.
            </p>
          </div>
          <div className="flex justify-end pt-2">
            <Button
              onClick={() => setContactOpen(false)}
              className="bg-white text-black hover:bg-gray-100"
            >
              Mbyll
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
