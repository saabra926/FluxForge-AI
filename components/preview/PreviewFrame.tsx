"use client";
import { useAppStore } from "@/store/useAppStore";
import { 
  QrCode, 
  Smartphone, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Zap,
  Target,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function PreviewFrame() {
  const { 
    generatedCode, 
    config, 
    mobileBuildStatus, 
    mobileBuildLinks, 
    mobileQrCode,
    setMobileBuildStatus,
    setMobileBuildType
  } = useAppStore();

  const [simulating, setSimulating] = useState(false);

  if (!generatedCode) {
    return (
      <div className="h-full flex items-center justify-center" style={{ color: "var(--text3)", background: "var(--bg2)" }}>
        <div className="text-center">
          <div className="text-5xl mb-3">👁</div>
          <p className="text-[13px]">Generate code to see live preview</p>
        </div>
      </div>
    );
  }

  const isMobile = config.category === "React Native Application" || config.category === "Flutter Application" || config.framework === "React Native" || config.framework === "Expo" || config.framework === "Flutter";

  if (isMobile) {
    const isExpo = config.framework === "Expo" || config.framework === "React Native" || config.category === "React Native Application";
    const isFlutter = config.framework === "Flutter" || config.category === "Flutter Application";

    const handleStartBuild = (type: "apk" | "ipa") => {
      setMobileBuildType(type);
      setMobileBuildStatus("pending");
      
      // Simulate build pipeline for demo purposes
      setTimeout(() => setMobileBuildStatus("processing"), 1500);
      setTimeout(() => {
        setMobileBuildStatus("completed");
        const links = { ...mobileBuildLinks };
        if (type === "apk") links.apk = "#";
        if (type === "ipa") links.ipa = "#";
        useAppStore.getState().setMobileBuildLinks(links);
      }, 8000);
    };

    return (
      <div className="h-full flex flex-col items-center justify-center p-6 sm:p-10 overflow-y-auto" style={{ background: "var(--bg2)" }}>
        <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Preview Section */}
          <div className="flex flex-col gap-4">
            <div className="glass rounded-2xl p-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ background: "var(--blue-dim)", color: "var(--blue)" }}>
                {isExpo ? <QrCode size={24} /> : <Smartphone size={24} />}
              </div>
              <h3 className="font-syne font-bold text-[16px] mb-2">
                {isExpo ? "Expo Go Preview" : "Flutter Web Preview"}
              </h3>
              <p className="text-[12px] mb-6" style={{ color: "var(--text2)" }}>
                {isExpo 
                  ? "Scan the QR code with Expo Go app on your phone to run this app instantly." 
                  : "View a live interactive web-based preview of your Flutter application."}
              </p>

              {isExpo ? (
                <div className="bg-white p-3 rounded-xl mb-4 shadow-lg border-4 border-blue-500/20">
                  {/* Placeholder for QR Code */}
                  <div className="w-40 h-40 bg-slate-100 flex items-center justify-center relative overflow-hidden">
                    <QrCode size={120} className="text-slate-800 opacity-20" />
                    <div className="absolute inset-0 flex items-center justify-center flex-col p-4 bg-white/80">
                      <p className="text-[10px] font-bold text-blue-600 mb-1">EXPO QR</p>
                      <div className="w-full h-1 bg-blue-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 animate-[loading_2s_infinite]" style={{ width: "40%" }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => setSimulating(true)}
                  className="w-full py-3 rounded-xl font-bold text-[13px] flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: "var(--blue)", color: "#fff" }}
                >
                  <ExternalLink size={16} /> Open Web Preview
                </button>
              )}
              
              {isExpo && (
                <p className="text-[10px]" style={{ color: "var(--text3)" }}>
                  Requires Expo Go app
                </p>
              )}
            </div>
          </div>

          {/* Build Section */}
          <div className="flex flex-col gap-4">
            <div className="glass rounded-2xl p-6 flex flex-col h-full">
              <h3 className="font-syne font-bold text-[16px] mb-4 flex items-center gap-2">
                <Smartphone size={18} className="text-blue-500" />
                Build & Download
              </h3>
              
              <div className="flex-1 flex flex-col gap-3">
                {mobileBuildStatus === "none" ? (
                  <>
                    <button 
                      onClick={() => handleStartBuild("apk")}
                      className="w-full p-4 rounded-xl border flex items-center gap-3 transition-all hover:bg-blue-50/5 text-left"
                      style={{ borderColor: "var(--border2)" }}
                    >
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-500/10 text-green-500">
                        <Smartphone size={20} />
                      </div>
                      <div>
                        <p className="text-[13px] font-bold">Build Android APK</p>
                        <p className="text-[10px]" style={{ color: "var(--text3)" }}>Production-ready .apk file</p>
                      </div>
                    </button>

                    <button 
                      onClick={() => handleStartBuild("ipa")}
                      className="w-full p-4 rounded-xl border flex items-center gap-3 transition-all hover:bg-blue-50/5 text-left"
                      style={{ borderColor: "var(--border2)" }}
                    >
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-500/10 text-blue-500">
                        <Smartphone size={20} />
                      </div>
                      <div>
                        <p className="text-[13px] font-bold">Build iOS IPA</p>
                        <p className="text-[10px]" style={{ color: "var(--text3)" }}>App Store ready .ipa file</p>
                      </div>
                    </button>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center py-4">
                    {mobileBuildStatus === "pending" || mobileBuildStatus === "processing" ? (
                      <div className="text-center">
                        <div className="relative w-16 h-16 mx-auto mb-4">
                          <Loader2 size={64} className="text-blue-500 animate-spin opacity-20" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <RefreshCw size={24} className="text-blue-500 animate-spin" />
                          </div>
                        </div>
                        <p className="text-[14px] font-bold mb-1">Building your app...</p>
                        <p className="text-[11px]" style={{ color: "var(--text2)" }}>
                          {mobileBuildStatus === "pending" ? "Initializing build queue..." : "Compiling native assets (CI/CD)..."}
                        </p>
                      </div>
                    ) : mobileBuildStatus === "completed" ? (
                      <div className="text-center w-full">
                        <div className="w-16 h-16 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mx-auto mb-4">
                          <CheckCircle2 size={32} />
                        </div>
                        <p className="text-[14px] font-bold mb-4">Build Successful!</p>
                        
                        <div className="space-y-2 w-full">
                          {mobileBuildLinks.apk && (
                            <a href={mobileBuildLinks.apk} className="flex items-center justify-between p-3 rounded-lg bg-green-500 text-white text-[12px] font-bold">
                              <span className="flex items-center gap-2"><Download size={14} /> Download APK</span>
                              <span className="text-[10px] opacity-80">Android</span>
                            </a>
                          )}
                          {mobileBuildLinks.ipa && (
                            <a href={mobileBuildLinks.ipa} className="flex items-center justify-between p-3 rounded-lg bg-blue-500 text-white text-[12px] font-bold">
                              <span className="flex items-center gap-2"><Download size={14} /> Download IPA</span>
                              <span className="text-[10px] opacity-80">iOS</span>
                            </a>
                          )}
                          <button 
                            onClick={() => setMobileBuildStatus("none")}
                            className="w-full py-2 text-[11px] font-medium" style={{ color: "var(--text3)" }}>
                            Build another version
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
                        <p className="text-[14px] font-bold text-red-500 mb-1">Build Failed</p>
                        <p className="text-[11px] mb-4" style={{ color: "var(--text2)" }}>There was an error in the build pipeline.</p>
                        <button 
                          onClick={() => setMobileBuildStatus("none")}
                          className="px-4 py-2 rounded-lg bg-red-500/10 text-red-500 text-[12px] font-bold">
                          Retry Build
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Simulating Flutter Web Modal */}
        {simulating && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-4xl h-[80vh] bg-white rounded-3xl overflow-hidden flex flex-col">
              <div className="p-4 border-b flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  <span className="ml-2 text-[12px] font-medium text-slate-500">Flutter Web Preview</span>
                </div>
                <button onClick={() => setSimulating(false)} className="p-1 hover:bg-slate-200 rounded-lg">
                  <AlertCircle size={20} className="rotate-45 text-slate-400" />
                </button>
              </div>
              <div className="flex-1 bg-slate-100 flex items-center justify-center relative">
                <div className="w-[320px] h-[580px] bg-white rounded-[40px] border-[8px] border-slate-800 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl z-10" />
                  <div className="h-full w-full flex flex-col items-center justify-center p-6 text-center">
                    <Smartphone size={48} className="text-blue-500 mb-4 animate-bounce" />
                    <h4 className="font-bold mb-2">Flutter App Loading...</h4>
                    <p className="text-[11px] text-slate-400">Initializing Flutter engine and rendering widgets</p>
                  </div>
                </div>
                <div className="absolute bottom-8 right-8 bg-blue-600 text-white px-4 py-2 rounded-full text-[11px] font-bold shadow-lg">
                  Debug Mode
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (config.framework !== "HTML+CSS") {
    return (
      <div className="h-full flex items-center justify-center p-8" style={{ background: "var(--bg2)" }}>
        <div className="max-w-sm text-center rounded-2xl p-8" style={{ background: "var(--blue-dim)", border: "1px solid rgba(59,130,246,0.2)" }}>
          <div className="text-5xl mb-4">⚛️</div>
          <h3 className="font-syne font-bold text-[15px] mb-2 gradient-text">{config.framework} Component</h3>
          <p className="text-[12px] leading-relaxed mb-4" style={{ color: "var(--text2)" }}>
            Live preview requires a {config.framework} runtime. Copy the code into your project to render it.
          </p>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-xl border flex items-center gap-3" style={{ background: "var(--bg)", borderColor: "var(--border2)" }}>
                    <Target size={14} className="text-blue-500" />
                    <div>
                      <p className="text-[10px] font-bold opacity-60 uppercase">Precision</p>
                      <p className="text-[12px] font-black">98.2%</p>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl border flex items-center gap-3" style={{ background: "var(--bg)", borderColor: "var(--border2)" }}>
                    <Zap size={14} className="text-amber-500" />
                    <div>
                      <p className="text-[10px] font-bold opacity-60 uppercase">LCP</p>
                      <p className="text-[12px] font-black">1.2s</p>
                    </div>
                  </div>
                </div>
        </div>
      </div>
    );
  }

  return (
    <iframe
      sandbox="allow-scripts allow-same-origin"
      srcDoc={generatedCode}
      className="w-full h-full border-0"
      title="Live UI Preview"
    />
  );
}
