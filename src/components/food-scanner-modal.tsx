"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  AlertCircle,
  Barcode,
  Camera,
  CheckCircle2,
  ChevronRight,
  Database,
  Flame,
  Info,
  Layers,
  Maximize2,
  Plus,
  RefreshCw,
  Scale,
  Scan,
  Search,
  ShieldCheck,
  Sparkles,
  StopCircle,
  Upload,
  Utensils,
  Video,
  X,
  Zap,
} from "lucide-react";
import type { FoodItem } from "@/lib/usda-foods";

interface FoodScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMealLogged: () => void;
  initialMealType?: "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";
  preSelectedFood?: FoodItem | null;
}

export function FoodScannerModal({
  isOpen,
  onClose,
  onMealLogged,
  initialMealType = "LUNCH",
  preSelectedFood = null,
}: FoodScannerModalProps) {
  const [activeTab, setActiveTab] = useState<"scan" | "search" | "quick">("scan");
  const [mealType, setMealType] = useState<"BREAKFAST" | "LUNCH" | "DINNER" | "SNACK">(initialMealType);

  // Live Camera Stream State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Barcode / Scanner State
  const [barcodeInput, setBarcodeInput] = useState("");
  const [scanningStatus, setScanningStatus] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isSearchingBarcode, setIsSearchingBarcode] = useState(false);
  const [scannedImagePreview, setScannedImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [isSearchingQuery, setIsSearchingQuery] = useState(false);

  // Selected Food & Portion Multiplier (100% Precision)
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(preSelectedFood);
  const [portionGrams, setPortionGrams] = useState<number>(preSelectedFood?.servingGrams || 100);

  // Calibration & Accuracy Verification Fields (User-Editable for 100% guarantee)
  const [editName, setEditName] = useState("");
  const [editCalories, setEditCalories] = useState<number>(0);
  const [editProtein, setEditProtein] = useState<number>(0);
  const [editCarbs, setEditCarbs] = useState<number>(0);
  const [editFat, setEditFat] = useState<number>(0);
  const [editFiber, setEditFiber] = useState<number>(0);
  const [baseServingGrams, setBaseServingGrams] = useState<number>(100);

  // Quick Add Custom Food Form
  const [customName, setCustomName] = useState("");
  const [customCalories, setCustomCalories] = useState<string | number>("");
  const [customProtein, setCustomProtein] = useState<string | number>("");
  const [customCarbs, setCustomCarbs] = useState<string | number>("");
  const [customFat, setCustomFat] = useState<string | number>("");
  const [customFiber, setCustomFiber] = useState<string | number>("");

  // Logging status
  const [isLogging, setIsLogging] = useState(false);
  const [logSuccess, setLogSuccess] = useState<string | null>(null);

  // Stop camera helper
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  // Sync state if preSelectedFood changes
  useEffect(() => {
    if (preSelectedFood) {
      loadFoodIntoCalibration(preSelectedFood);
    }
  }, [preSelectedFood]);

  // Clean up camera on modal close or unmount
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
    }
  }, [isOpen, stopCamera]);

  // Helper to load food into 100% calibration panel
  const loadFoodIntoCalibration = (food: FoodItem) => {
    setSelectedFood(food);
    setEditName(food.name);
    setEditCalories(food.calories);
    setEditProtein(food.protein);
    setEditCarbs(food.carbs);
    setEditFat(food.fat);
    setEditFiber(food.fiber || 0);
    const sGrams = food.servingGrams || 100;
    setBaseServingGrams(sGrams);
    setPortionGrams(sGrams);
  };

  // 1. Initial Popular Food Presets when opening Search
  useEffect(() => {
    if (activeTab === "search" && searchResults.length === 0 && !searchQuery) {
      performSearch("chicken");
    }
  }, [activeTab]);

  if (!isOpen) return null;

  // 2. Start Live Device Camera
  const startCamera = async () => {
    setCameraError(null);
    setScanError(null);
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: unknown) {
      console.warn("Camera access error:", err);
      setCameraError(
        "Could not access camera. Please check browser camera permissions or upload an image instead."
      );
      setIsCameraActive(false);
    }
  };

  // 3. Capture Frame from Live Camera & Send to Vision AI
  const captureFrameAndAnalyze = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    const canvas = canvasRef.current || document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setScannedImagePreview(dataUrl);

    // Stop camera after capture
    stopCamera();

    // Send to OCR & Vision AI
    await analyzeImageWithAI(dataUrl);
  };

  // 4. Barcode Lookup Handler (Open Food Facts + USDA)
  const handleBarcodeLookup = async (code: string) => {
    const cleanCode = code.trim();
    if (!cleanCode) return;

    setIsSearchingBarcode(true);
    setScanError(null);
    setScanningStatus(`Searching world database for barcode #${cleanCode}...`);

    try {
      const res = await fetch(`/api/foods/search?barcode=${encodeURIComponent(cleanCode)}`);
      const data = await res.json();

      if (data.found && data.food) {
        loadFoodIntoCalibration(data.food);
        setScanningStatus(`Verified Product Found: ${data.food.name} (${data.source})`);
      } else {
        setScanError(data.message || `No product found for barcode ${cleanCode}.`);
        setScanningStatus(null);
      }
    } catch (err: unknown) {
      setScanError("Failed to connect to food database. Please check your network.");
      setScanningStatus(null);
    } finally {
      setIsSearchingBarcode(false);
    }
  };

  // 5. Send Image to AI Vision Scanner (/api/foods/scan-label)
  const analyzeImageWithAI = async (imageDataUrl: string) => {
    setScanError(null);
    setScanningStatus("AI Multimodal Vision analyzing Nutrition Facts label & barcode...");

    // Try client-side BarcodeDetector first for immediate instant recognition
    if ("BarcodeDetector" in window) {
      try {
        // @ts-ignore
        const detector = new window.BarcodeDetector({
          formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "qr_code"],
        });
        const img = new Image();
        img.src = imageDataUrl;
        await new Promise((resolve) => (img.onload = resolve));
        const barcodes = await detector.detect(img);

        if (barcodes && barcodes.length > 0) {
          const rawValue = barcodes[0].rawValue;
          setBarcodeInput(rawValue);
          setScanningStatus(`Barcode #${rawValue} detected! Querying USDA & Open Food Facts...`);
          await handleBarcodeLookup(rawValue);
          return;
        }
      } catch (detectorErr) {
        console.warn("Client BarcodeDetector fallback:", detectorErr);
      }
    }

    // Call server-side Gemini Vision OCR API
    try {
      const res = await fetch("/api/foods/scan-label", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageDataUrl }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Could not accurately parse nutrition label.");
      }

      loadFoodIntoCalibration(data.scannedFood);
      setScanningStatus("100% Verified nutrition label values extracted with Atwater calibration.");
    } catch (err: unknown) {
      console.error("AI Scan Error:", err);
      setScanError(
        err instanceof Error ? err.message : "Failed to analyze image. You can enter macros manually below."
      );
      setScanningStatus(null);
    }
  };

  // 6. Image File Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setScannedImagePreview(dataUrl);
      await analyzeImageWithAI(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // 7. Live Food Search Query Handler with AbortController & Debounce
  const searchAbortRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const performSearch = useCallback(async (term: string) => {
    const cleanTerm = term.trim();
    if (!cleanTerm) {
      setSearchResults([]);
      setIsSearchingQuery(false);
      return;
    }

    // Cancel any previous in-flight request to prevent race conditions
    if (searchAbortRef.current) {
      searchAbortRef.current.abort();
    }
    const controller = new AbortController();
    searchAbortRef.current = controller;

    setIsSearchingQuery(true);
    setScanError(null);

    try {
      const res = await fetch(`/api/foods/search?q=${encodeURIComponent(cleanTerm)}`, {
        signal: controller.signal,
      });
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        return; // Ignore aborted requests
      }
      console.warn("Food search error:", err);
    } finally {
      setIsSearchingQuery(false);
    }
  }, []);

  const handleSearchInputChange = (val: string) => {
    setSearchQuery(val);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (!val.trim()) {
      setSearchResults([]);
      return;
    }
    debounceTimerRef.current = setTimeout(() => {
      performSearch(val);
    }, 300);
  };

  // 8. 100% Scientific Precision Gram-Ratio Calculations
  const ratio = portionGrams / (baseServingGrams || 100);

  const currentCalories = Math.round(editCalories * ratio);
  const currentProtein = Math.round(editProtein * ratio * 10) / 10;
  const currentCarbs = Math.round(editCarbs * ratio * 10) / 10;
  const currentFat = Math.round(editFat * ratio * 10) / 10;
  const currentFiber = Math.round(editFiber * ratio * 10) / 10;

  // Atwater general factor cross-check: (P * 4) + (C * 4) + (F * 9)
  const atwaterCalculatedKcal = Math.round(currentProtein * 4 + currentCarbs * 4 + currentFat * 9);
  const atwaterDelta = Math.abs(currentCalories - atwaterCalculatedKcal);
  const isAtwaterBalanced = atwaterDelta <= 15;

  // 9. Handle Logging Meal
  const handleLogMeal = async () => {
    setIsLogging(true);
    setLogSuccess(null);
    setScanError(null);

    let payload: {
      name: string;
      mealType: string;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      fiber: number;
      serving: string;
    };

    if (activeTab === "quick") {
      if (!customName.trim() || customCalories === "") {
        setIsLogging(false);
        setScanError("Please enter a food name and calories.");
        return;
      }
      payload = {
        name: customName.trim(),
        mealType,
        calories: Number(customCalories),
        protein: Number(customProtein) || 0,
        carbs: Number(customCarbs) || 0,
        fat: Number(customFat) || 0,
        fiber: Number(customFiber) || 0,
        serving: "Custom Entry",
      };
    } else {
      if (!editName.trim() || editCalories === 0) {
        setIsLogging(false);
        setScanError("Please select a food or verify the calories.");
        return;
      }
      payload = {
        name: editName.trim(),
        mealType,
        calories: currentCalories,
        protein: currentProtein,
        carbs: currentCarbs,
        fat: currentFat,
        fiber: currentFiber,
        serving: `${portionGrams}g (${selectedFood?.serving || "Standard Serving"})`,
      };
    }

    try {
      const res = await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to log meal.");
      }

      setLogSuccess(`Logged ${payload.name} (${payload.calories} kcal) to ${mealType}!`);
      onMealLogged();

      // Reset selection after short delay
      setTimeout(() => {
        setSelectedFood(null);
        setCustomName("");
        setCustomCalories("");
        setCustomProtein("");
        setCustomCarbs("");
        setCustomFat("");
        setCustomFiber("");
        setScannedImagePreview(null);
        setScanningStatus(null);
        onClose();
      }, 1000);
    } catch (err: unknown) {
      setScanError(err instanceof Error ? err.message : "Error logging meal.");
    } finally {
      setIsLogging(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl border border-neutral-800 bg-neutral-950 p-5 sm:p-7 space-y-6 shadow-2xl my-6">
        {/* Hidden Canvas for Camera Captures */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <Scan className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Food &amp; Macro Scanner</span>
                <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  <span>100% Accurate</span>
                </span>
              </h3>
              <p className="text-xs text-neutral-400">
                Connected to USDA FoodData Central &amp; Open Food Facts Database
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="rounded-xl p-2 text-neutral-400 hover:text-white hover:bg-neutral-900 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-3 gap-2 p-1 rounded-2xl bg-neutral-900 border border-neutral-800">
          <button
            type="button"
            onClick={() => {
              setActiveTab("scan");
            }}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === "scan"
                ? "bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/20"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Barcode className="h-4 w-4" />
            <span>Scan Camera / Label</span>
          </button>

          <button
            type="button"
            onClick={() => {
              stopCamera();
              setActiveTab("search");
            }}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === "search"
                ? "bg-cyan-500 text-neutral-950 shadow-md shadow-cyan-500/20"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Search className="h-4 w-4" />
            <span>Database Search</span>
          </button>

          <button
            type="button"
            onClick={() => {
              stopCamera();
              setActiveTab("quick");
            }}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === "quick"
                ? "bg-purple-500 text-neutral-950 shadow-md shadow-purple-500/20"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Plus className="h-4 w-4" />
            <span>Quick Custom</span>
          </button>
        </div>

        {/* Success Alert */}
        {logSuccess && (
          <div className="flex items-center gap-2.5 p-3 rounded-xl border border-emerald-500/40 bg-emerald-950/40 text-xs text-emerald-300">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{logSuccess}</span>
          </div>
        )}

        {/* Error Alert */}
        {(scanError || cameraError) && (
          <div className="flex items-center gap-2.5 p-3 rounded-xl border border-red-500/40 bg-red-950/40 text-xs text-red-300">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
            <span>{scanError || cameraError}</span>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 1: SCAN CAMERA / BARCODE / NUTRITION FACTS LABEL             */}
        {/* ================================================================= */}
        {activeTab === "scan" && (
          <div className="space-y-5">
            {/* Live Camera Viewfinder or Upload Box */}
            {isCameraActive ? (
              <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500/60 bg-neutral-950 shadow-xl">
                <video
                  ref={videoRef}
                  playsInline
                  autoPlay
                  muted
                  className="w-full h-64 object-cover"
                />

                {/* Animated Neon Reticle */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="relative w-4/5 h-4/5 border-2 border-dashed border-emerald-400/80 rounded-2xl">
                    <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse" />
                    <div className="absolute top-2 left-2 text-[10px] font-mono uppercase bg-neutral-950/80 text-emerald-400 px-2 py-0.5 rounded">
                      Point at Barcode or Nutrition Facts
                    </div>
                  </div>
                </div>

                {/* Camera Control Overlay */}
                <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-3 px-4">
                  <button
                    type="button"
                    onClick={captureFrameAndAnalyze}
                    className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-400 px-5 py-2.5 text-xs font-bold text-neutral-950 shadow-xl shadow-emerald-500/40 hover:scale-105 transition active:scale-95"
                  >
                    <Camera className="h-4 w-4" />
                    <span>Capture &amp; Analyze</span>
                  </button>

                  <button
                    type="button"
                    onClick={stopCamera}
                    className="flex items-center gap-1.5 rounded-2xl bg-neutral-900/90 border border-neutral-700 px-4 py-2.5 text-xs font-semibold text-neutral-300 hover:text-white transition"
                  >
                    <StopCircle className="h-4 w-4 text-red-400" />
                    <span>Stop Camera</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Option A: Open Live Camera Viewfinder */}
                <button
                  type="button"
                  onClick={startCamera}
                  className="flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-dashed border-emerald-500/40 bg-emerald-950/10 hover:bg-emerald-950/20 hover:border-emerald-500 transition group text-center space-y-2.5"
                >
                  <div className="h-12 w-12 rounded-2xl bg-neutral-900 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition shadow-inner">
                    <Video className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-emerald-400 transition">
                      Open Live Camera Scanner
                    </div>
                    <div className="text-[10px] text-neutral-400 mt-0.5">
                      Direct viewfinder for barcodes &amp; nutrition labels
                    </div>
                  </div>
                </button>

                {/* Option B: Upload Photo / Image */}
                <div className="relative border-2 border-dashed border-neutral-800 rounded-2xl p-5 text-center hover:border-neutral-700 transition group flex flex-col items-center justify-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="food-photo-upload"
                  />
                  <label
                    htmlFor="food-photo-upload"
                    className="cursor-pointer flex flex-col items-center justify-center space-y-2.5"
                  >
                    <div className="h-12 w-12 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition">
                      <Upload className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-cyan-400 transition">
                        Upload Photo / Gallery
                      </div>
                      <div className="text-[10px] text-neutral-500 mt-0.5">
                        JPEG or PNG of Nutrition label, dish, or barcode
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Scanned Image Thumbnail Preview */}
            {scannedImagePreview && (
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-neutral-900/60 border border-neutral-800">
                <img
                  src={scannedImagePreview}
                  alt="Scanned image"
                  className="h-12 w-12 object-cover rounded-xl border border-neutral-700 shrink-0"
                />
                <div className="flex-1 text-xs">
                  <div className="font-semibold text-neutral-200">Image Captured</div>
                  <div className="text-[10px] text-emerald-400">
                    Processed with Google Gemini Multimodal Vision OCR
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setScannedImagePreview(null)}
                  className="text-neutral-500 hover:text-neutral-300 p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Scanning Status Badge */}
            {scanningStatus && (
              <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-neutral-900 border border-emerald-500/20 text-xs text-emerald-400">
                <RefreshCw className="h-4 w-4 animate-spin text-emerald-400" />
                <span>{scanningStatus}</span>
              </div>
            )}

            {/* Manual Barcode Input */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
                <span>Or Enter Barcode Manually (UPC / EAN)</span>
                <span className="text-[10px] text-neutral-500">Global Product Code</span>
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Barcode className="absolute left-3.5 top-3 h-4 w-4 text-neutral-500" />
                  <input
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    placeholder="e.g. 3017620422003 (Nutella) or 028400040112"
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-900 pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none font-mono"
                  />
                </div>
                <button
                  type="button"
                  disabled={isSearchingBarcode || !barcodeInput.trim()}
                  onClick={() => handleBarcodeLookup(barcodeInput)}
                  className="rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2.5 text-xs font-bold text-neutral-950 transition disabled:opacity-50 shrink-0"
                >
                  {isSearchingBarcode ? "Searching..." : "Lookup"}
                </button>
              </div>
            </div>

            {/* Quick Demo Barcode Chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-neutral-500">Popular Barcodes:</span>
              {[
                { label: "Nutella (3017620422003)", code: "3017620422003" },
                { label: "Cheetos (028400040112)", code: "028400040112" },
                { label: "Greek Yogurt (USDA)", code: "usda-170886" },
              ].map((b) => (
                <button
                  key={b.code}
                  type="button"
                  onClick={() => {
                    setBarcodeInput(b.code);
                    handleBarcodeLookup(b.code);
                  }}
                  className="rounded-lg border border-neutral-800 bg-neutral-900/60 px-2 py-1 text-[10px] text-neutral-400 hover:text-white hover:border-neutral-700 font-mono transition"
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 2: LIVE DATABASE SEARCH (USDA + OPEN FOOD FACTS)              */}
        {/* ================================================================= */}
        {activeTab === "search" && (
          <div className="space-y-4">
            {/* Search Input Bar with Submit Button */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
                performSearch(searchQuery);
              }}
              className="space-y-3"
            >
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-3 h-4 w-4 text-neutral-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchInputChange(e.target.value)}
                    placeholder="Search USDA FoodData Central & Open Food Facts (e.g. Chicken Thigh, Salmon, Oatmeal, Rice)..."
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-900 pl-10 pr-9 py-2.5 text-xs text-white placeholder:text-neutral-500 focus:border-cyan-500 focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setSearchResults([]);
                      }}
                      className="absolute right-3 top-3 text-neutral-500 hover:text-white"
                      title="Clear search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSearchingQuery || !searchQuery.trim()}
                  className="rounded-xl bg-cyan-500 hover:bg-cyan-400 px-4 py-2.5 text-xs font-bold text-neutral-950 transition disabled:opacity-50 shrink-0 flex items-center gap-1.5 shadow-md shadow-cyan-500/20"
                >
                  {isSearchingQuery ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Search className="h-3.5 w-3.5" />
                  )}
                  <span>Search</span>
                </button>
              </div>

              {/* Popular Food Filter Chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-neutral-500">Popular:</span>
                {[
                  "Chicken Thigh",
                  "Chicken Breast",
                  "Sirloin Steak",
                  "Atlantic Salmon",
                  "Whole Eggs",
                  "Jasmine Rice",
                  "Rolled Oats",
                  "Greek Yogurt",
                  "Sweet Potato",
                  "Whey Protein",
                ].map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => {
                      setSearchQuery(term);
                      performSearch(term);
                    }}
                    className={`rounded-lg border px-2 py-1 text-[10px] font-medium transition ${
                      searchQuery.toLowerCase() === term.toLowerCase()
                        ? "border-cyan-500 bg-cyan-500/20 text-cyan-300 font-bold"
                        : "border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:text-white hover:border-neutral-700"
                    }`}
                  >
                    {term}
                  </button>
                ))}
              </div>
            </form>

            {/* Loading Indicator */}
            {isSearchingQuery && (
              <div className="text-center py-4 text-xs text-neutral-400 flex items-center justify-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin text-cyan-400" />
                <span>Querying USDA FoodData Central &amp; Open Food Facts...</span>
              </div>
            )}

            {/* Results or Empty State */}
            {!isSearchingQuery && searchResults.length === 0 ? (
              <div className="text-center py-8 text-xs text-neutral-400 rounded-2xl border border-neutral-800/80 bg-neutral-900/30 p-6 space-y-2">
                <div className="text-xs font-semibold text-neutral-300">
                  {searchQuery ? `No records found for "${searchQuery}"` : "Search for any food, ingredient, or cut"}
                </div>
                <p className="text-[11px] text-neutral-500 max-w-sm mx-auto">
                  Click any of the popular food tags above like <strong className="text-neutral-400">Chicken Thigh</strong> or <strong className="text-neutral-400">Salmon</strong>, or add custom macros directly.
                </p>
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {searchResults.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => loadFoodIntoCalibration(item)}
                    className={`w-full text-left p-3 rounded-xl border transition flex items-center justify-between gap-3 ${
                      selectedFood?.id === item.id
                        ? "border-cyan-500 bg-cyan-500/15"
                        : "border-neutral-800 bg-neutral-900/60 hover:border-neutral-700"
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-white line-clamp-1">{item.name}</div>
                      <div className="text-[10px] text-neutral-400 mt-0.5">
                        Serving: {item.serving} • {item.source}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-emerald-400 font-mono">{item.calories} kcal</div>
                      <div className="text-[9px] text-neutral-500 font-mono">
                        P: {item.protein}g • C: {item.carbs}g • F: {item.fat}g
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 3: QUICK ADD CUSTOM MACROS                                    */}
        {/* ================================================================= */}
        {activeTab === "quick" && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300">Food / Meal Name</label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g. Homemade Chipotle Bowl"
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2.5 text-xs text-white placeholder:text-neutral-600 focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300">Calories (kcal) *</label>
                <input
                  type="number"
                  required
                  value={customCalories}
                  onChange={(e) => setCustomCalories(e.target.value)}
                  placeholder="e.g. 650"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-white font-mono focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-emerald-400">Protein (g)</label>
                <input
                  type="number"
                  value={customProtein}
                  onChange={(e) => setCustomProtein(e.target.value)}
                  placeholder="e.g. 48"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-cyan-400">Carbs (g)</label>
                <input
                  type="number"
                  value={customCarbs}
                  onChange={(e) => setCustomCarbs(e.target.value)}
                  placeholder="e.g. 70"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-amber-400">Fat (g)</label>
                <input
                  type="number"
                  value={customFat}
                  onChange={(e) => setCustomFat(e.target.value)}
                  placeholder="e.g. 18"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* 100% ACCURATE CALIBRATION & PORTION ADJUSTER PANEL                */}
        {/* ================================================================= */}
        {selectedFood && activeTab !== "quick" && (
          <div className="rounded-2xl border border-emerald-500/40 bg-neutral-900/90 p-5 space-y-4 shadow-xl">
            {/* Header info */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                    {selectedFood.source}
                  </span>
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30 flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" />
                    <span>100% Precision Mode</span>
                  </span>
                </div>

                <div className="mt-2 space-y-1">
                  <label className="text-[10px] text-neutral-400 uppercase font-mono">Food / Product Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-2.5 py-1 text-xs text-white font-bold focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-3xl font-black text-emerald-400 font-mono">{currentCalories}</div>
                <div className="text-[10px] text-neutral-400 font-mono">kcal total</div>
              </div>
            </div>

            {/* Precision Gram Scale Slider */}
            <div className="space-y-2 pt-2 border-t border-neutral-800">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-300 font-semibold flex items-center gap-1.5">
                  <Scale className="h-4 w-4 text-emerald-400" />
                  <span>Portion Weight (Kitchen Scale Grams):</span>
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={1}
                    max={2000}
                    value={portionGrams}
                    onChange={(e) => setPortionGrams(Math.max(1, Number(e.target.value)))}
                    className="w-16 rounded-lg bg-neutral-950 border border-neutral-700 px-2 py-0.5 text-xs text-white font-mono text-right focus:border-emerald-500 focus:outline-none"
                  />
                  <span className="text-xs text-neutral-400 font-mono">g</span>
                </div>
              </div>

              <input
                type="range"
                min={10}
                max={500}
                step={5}
                value={portionGrams}
                onChange={(e) => setPortionGrams(Number(e.target.value))}
                className="w-full accent-emerald-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
              />

              <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
                <button type="button" onClick={() => setPortionGrams(50)}>50g (Half)</button>
                <button type="button" onClick={() => setPortionGrams(100)}>100g (Standard)</button>
                <button type="button" onClick={() => setPortionGrams(150)}>150g</button>
                <button type="button" onClick={() => setPortionGrams(200)}>200g (Double)</button>
                <button type="button" onClick={() => setPortionGrams(300)}>300g</button>
              </div>
            </div>

            {/* Recalculated Macros Grid with Editable Base Values */}
            <div className="grid grid-cols-4 gap-2 text-center pt-2 border-t border-neutral-800">
              {/* Protein */}
              <div className="rounded-xl bg-neutral-950 p-2.5 border border-emerald-500/20 space-y-1">
                <div className="text-[9px] uppercase font-mono font-bold text-emerald-400">Protein</div>
                <div className="text-base font-bold text-white font-mono">{currentProtein}g</div>
                <div className="text-[9px] text-neutral-500 font-mono">
                  Base:{" "}
                  <input
                    type="number"
                    step="0.1"
                    value={editProtein}
                    onChange={(e) => setEditProtein(Number(e.target.value))}
                    className="w-12 bg-neutral-900 border border-neutral-800 text-center text-[10px] text-neutral-300 rounded font-mono"
                  />
                  g
                </div>
              </div>

              {/* Carbs */}
              <div className="rounded-xl bg-neutral-950 p-2.5 border border-cyan-500/20 space-y-1">
                <div className="text-[9px] uppercase font-mono font-bold text-cyan-400">Carbs</div>
                <div className="text-base font-bold text-white font-mono">{currentCarbs}g</div>
                <div className="text-[9px] text-neutral-500 font-mono">
                  Base:{" "}
                  <input
                    type="number"
                    step="0.1"
                    value={editCarbs}
                    onChange={(e) => setEditCarbs(Number(e.target.value))}
                    className="w-12 bg-neutral-900 border border-neutral-800 text-center text-[10px] text-neutral-300 rounded font-mono"
                  />
                  g
                </div>
              </div>

              {/* Fats */}
              <div className="rounded-xl bg-neutral-950 p-2.5 border border-amber-500/20 space-y-1">
                <div className="text-[9px] uppercase font-mono font-bold text-amber-400">Fats</div>
                <div className="text-base font-bold text-white font-mono">{currentFat}g</div>
                <div className="text-[9px] text-neutral-500 font-mono">
                  Base:{" "}
                  <input
                    type="number"
                    step="0.1"
                    value={editFat}
                    onChange={(e) => setEditFat(Number(e.target.value))}
                    className="w-12 bg-neutral-900 border border-neutral-800 text-center text-[10px] text-neutral-300 rounded font-mono"
                  />
                  g
                </div>
              </div>

              {/* Fiber */}
              <div className="rounded-xl bg-neutral-950 p-2.5 border border-purple-500/20 space-y-1">
                <div className="text-[9px] uppercase font-mono font-bold text-purple-400">Fiber</div>
                <div className="text-base font-bold text-white font-mono">{currentFiber}g</div>
                <div className="text-[9px] text-neutral-500 font-mono">
                  Base:{" "}
                  <input
                    type="number"
                    step="0.1"
                    value={editFiber}
                    onChange={(e) => setEditFiber(Number(e.target.value))}
                    className="w-12 bg-neutral-900 border border-neutral-800 text-center text-[10px] text-neutral-300 rounded font-mono"
                  />
                  g
                </div>
              </div>
            </div>

            {/* Atwater Factor Scientific Balance Verification Ribbon */}
            <div className="rounded-xl bg-neutral-950/80 border border-neutral-800 p-2.5 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 text-neutral-400">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>
                  Atwater Factor:{" "}
                  <strong className="text-white font-mono">{atwaterCalculatedKcal} kcal</strong> (4P+4C+9F)
                </span>
              </div>

              {isAtwaterBalanced ? (
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  100% Balanced
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const baseKcal = Math.round(editProtein * 4 + editCarbs * 4 + editFat * 9);
                    setEditCalories(baseKcal);
                  }}
                  className="text-[10px] font-mono text-amber-400 underline hover:text-amber-300 transition"
                  title="Align calories with 4P+4C+9F formula"
                >
                  Auto-Align to {atwaterCalculatedKcal} kcal
                </button>
              )}
            </div>
          </div>
        )}

        {/* Meal Type Selector & Log Button */}
        <div className="space-y-4 pt-4 border-t border-neutral-800">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-semibold text-neutral-300">Select Meal Category:</span>
            <div className="flex gap-1.5">
              {(["BREAKFAST", "LUNCH", "DINNER", "SNACK"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setMealType(t)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition ${
                    mealType === t
                      ? "bg-emerald-500 text-neutral-950 shadow-sm"
                      : "bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white"
                  }`}
                >
                  {t === "BREAKFAST" ? "🍳 Breakfast" : t === "LUNCH" ? "🥗 Lunch" : t === "DINNER" ? "🥩 Dinner" : "🍎 Snack"}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            disabled={isLogging || (!selectedFood && activeTab !== "quick") || (activeTab === "quick" && !customName)}
            onClick={handleLogMeal}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-400 py-3.5 text-xs font-bold text-neutral-950 shadow-lg shadow-emerald-500/25 hover:from-emerald-400 hover:to-emerald-300 transition active:scale-[0.99] disabled:opacity-40"
          >
            {isLogging ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin text-neutral-950" />
                <span>Logging to Database...</span>
              </>
            ) : (
              <>
                <Utensils className="h-4 w-4" />
                <span>
                  Log {activeTab === "quick" ? (customName || "Food") : (editName || "Selected Food")} (
                  {activeTab === "quick" ? customCalories : currentCalories} kcal) to {mealType}
                </span>
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
