"use client";

import Header from "./components/Header";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { ArrowRight, Zap, Shield, FileText, Sparkles, CheckCircle } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();
  const goToApp = () => router.push("/app");
  const goToSignup = () => router.push("/sign-up");

  // Show loading state
  if (!isLoaded) {
    return (
      <>
        <Header />
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-violet-600/30 border-t-violet-600 rounded-full animate-spin" />
            <p className="text-gray-500">Loading...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      
      <main className="min-h-[calc(100vh-80px)] flex flex-col">
        {/* Hero Section */}
        <section className="flex-1 flex items-center justify-center px-4 py-12 md:py-20">
          <div className="max-w-6xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-50/80 border border-violet-200/50 mb-6 animate-float">
              <Sparkles className="w-4 h-4 text-violet-600" />
              <span className="text-sm font-medium text-violet-700">
                Grounded AI for Enterprise Knowledge
              </span>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                Enterprise
              </span>
              <br className="sm:hidden" />
              <span className="text-gray-900"> Knowledge Assistant</span>
            </h1>

            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              Upload documents and get grounded, accurate answers powered by AI.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={isSignedIn ? goToApp : goToSignup}
                className="group relative bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-8 py-4 rounded-full text-lg font-medium shadow-xl shadow-violet-500/30 hover:shadow-violet-500/50 transition-all hover:scale-105 flex items-center gap-2"
              >
                {isSignedIn ? "Go to Knowledge Base" : "Get Started"}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              
              {!isSignedIn && (
                <button
                  onClick={() => router.push("/sign-in")}
                  className="px-8 py-4 rounded-full text-lg font-medium text-gray-600 hover:bg-gray-100/80 hover:text-gray-900 transition-all duration-200"
                >
                  Sign In
                </button>
              )}
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-4xl mx-auto">
              <div className="glass-card rounded-2xl p-6 text-left hover:shadow-2xl hover:scale-105 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-violet-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Document Upload</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Upload PDF, DOCX, TXT, CSV, and Markdown files to build your knowledge base
                </p>
              </div>

              <div className="glass-card rounded-2xl p-6 text-left hover:shadow-2xl hover:scale-105 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Hybrid Retrieval</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Semantic search combined with keyword matching for accurate results
                </p>
              </div>

              <div className="glass-card rounded-2xl p-6 text-left hover:shadow-2xl hover:scale-105 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Grounded Answers</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  All responses include citations from your internal documents
                </p>
              </div>
            </div>

            {/* Trust indicators */}
            <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>Enterprise-grade security</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>Powered by Gemini AI</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>100% data privacy</span>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-gray-200/50 py-6 px-4 bg-white/50 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-500">
            <p>© {new Date().getFullYear()} Enterprise Knowledge Assistant. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-gray-900 transition-colors">Privacy</a>
              <a href="#" className="hover:text-gray-900 transition-colors">Terms</a>
              <a href="#" className="hover:text-gray-900 transition-colors">Support</a>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}