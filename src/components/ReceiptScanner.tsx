"use client";

import { useState, useRef, useCallback } from "react";
import {
  Upload,
  FileImage,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Receipt,
  Calendar,
  CreditCard,
  Tag,
  MapPin,
  Clock,
  DollarSign,
  X,
} from "lucide-react";

interface LineItem {
  description: string;
  price: number;
}

interface ReceiptData {
  merchant_name: string | null;
  merchant_address: string | null;
  receipt_date: string | null;
  receipt_time: string | null;
  line_items: LineItem[] | null;
  subtotal: number | null;
  tax: number | null;
  tip: number | null;
  total: number | null;
  currency: string | null;
  payment_method: string | null;
  card_last_four: string | null;
  country: string | null;
  expense_category: string;
  expense_subcategory: string | null;
  confidence_score: number;
  classification_reasoning: string;
}

interface ScanResult {
  success: boolean;
  duplicate?: boolean;
  receipt?: ReceiptData;
  storage?: {
    fileName: string;
    driveFileId: string;
  };
  needsReview?: boolean;
  error?: string;
  message?: string;
}

type Status = "idle" | "uploading" | "processing" | "success" | "error";

const WEBHOOK_URL = process.env.NEXT_PUBLIC_WEBHOOK_URL || "";

export default function ReceiptScanner() {
  const [status, setStatus] = useState<Status>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((selectedFile: File) => {
    const validTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/heic",
      "image/heif",
    ];

    if (!validTypes.includes(selectedFile.type)) {
      setError("Please upload a PDF, JPG, PNG, or HEIC file");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      return;
    }

    setFile(selectedFile);
    setError(null);
    setResult(null);

    // Create preview for images
    if (selectedFile.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFile(e.dataTransfer.files[0]);
      }
    },
    [handleFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      if (e.target.files && e.target.files[0]) {
        handleFile(e.target.files[0]);
      }
    },
    [handleFile]
  );

  const handleSubmit = async () => {
    if (!file) return;

    if (!WEBHOOK_URL) {
      setError("Webhook URL not configured. Please set NEXT_PUBLIC_WEBHOOK_URL");
      return;
    }

    setStatus("uploading");
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      setStatus("processing");

      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        body: formData,
      });

      const data: ScanResult = await response.json();

      if (data.success) {
        setResult(data);
        setStatus("success");
      } else {
        setError(data.error || "Failed to process receipt");
        setStatus("error");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect to server");
      setStatus("error");
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setStatus("idle");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const formatCurrency = (amount: number | null, currency: string | null) => {
    if (amount === null) return "—";
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: currency || "CAD",
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      {status === "idle" || status === "error" ? (
        <div
          className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 ${
            dragActive
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
              : file
              ? "border-green-500 bg-green-50 dark:bg-green-900/20"
              : "border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.heic,.heif,image/*,application/pdf"
            onChange={handleChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />

          <div className="text-center">
            {file ? (
              <div className="space-y-4">
                <div className="flex justify-center">
                  {preview ? (
                    <div className="relative">
                      <img
                        src={preview}
                        alt="Receipt preview"
                        className="max-h-48 rounded-lg shadow-md"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          reset();
                        }}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="w-32 h-40 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                        <FileText className="w-12 h-12 text-red-500" />
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          reset();
                        }}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {file.name}
                </p>
                <p className="text-xs text-slate-500">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-full">
                    <Upload className="w-8 h-8 text-slate-500 dark:text-slate-400" />
                  </div>
                </div>
                <div>
                  <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
                    Drop your receipt here
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    or click to browse
                  </p>
                </div>
                <div className="flex justify-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <FileImage className="w-4 h-4" /> JPG, PNG, HEIC
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="w-4 h-4" /> PDF
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Processing State */}
      {(status === "uploading" || status === "processing") && (
        <div className="text-center py-12 space-y-4">
          <div className="flex justify-center">
            <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          </div>
          <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
            {status === "uploading" ? "Uploading..." : "Processing receipt with AI..."}
          </p>
          <p className="text-sm text-slate-500">This may take a few seconds</p>
        </div>
      )}

      {/* Results */}
      {status === "success" && result?.receipt && (
        <div className="space-y-6">
          {/* Success Header */}
          <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
            <div>
              <p className="font-medium text-green-700 dark:text-green-300">
                {result.duplicate ? "Receipt already exists" : "Receipt processed successfully"}
              </p>
              {result.needsReview && (
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  Flagged for review (low confidence)
                </p>
              )}
            </div>
          </div>

          {/* Receipt Card */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 dark:from-slate-700 dark:to-slate-600 p-6 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold">
                    {result.receipt.merchant_name || "Unknown Merchant"}
                  </h2>
                  {result.receipt.merchant_address && (
                    <p className="text-slate-300 text-sm mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {result.receipt.merchant_address}
                    </p>
                  )}
                </div>
                <span className="px-3 py-1 bg-white/10 rounded-full text-sm">
                  {result.receipt.expense_category}
                </span>
              </div>
            </div>

            {/* Details */}
            <div className="p-6 space-y-6">
              {/* Date & Time */}
              <div className="flex flex-wrap gap-4">
                {result.receipt.receipt_date && (
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Calendar className="w-4 h-4" />
                    <span>{result.receipt.receipt_date}</span>
                  </div>
                )}
                {result.receipt.receipt_time && (
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Clock className="w-4 h-4" />
                    <span>{result.receipt.receipt_time}</span>
                  </div>
                )}
              </div>

              {/* Line Items */}
              {result.receipt.line_items && result.receipt.line_items.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
                    Items
                  </h3>
                  <div className="space-y-2">
                    {result.receipt.line_items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between text-sm py-2 border-b border-slate-100 dark:border-slate-700 last:border-0"
                      >
                        <span className="text-slate-700 dark:text-slate-300">
                          {item.description}
                        </span>
                        <span className="text-slate-600 dark:text-slate-400 font-mono">
                          {formatCurrency(item.price, result.receipt?.currency || null)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Totals */}
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 space-y-2">
                {result.receipt.subtotal !== null && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Subtotal</span>
                    <span className="font-mono">
                      {formatCurrency(result.receipt.subtotal, result.receipt.currency)}
                    </span>
                  </div>
                )}
                {result.receipt.tax !== null && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Tax</span>
                    <span className="font-mono">
                      {formatCurrency(result.receipt.tax, result.receipt.currency)}
                    </span>
                  </div>
                )}
                {result.receipt.tip !== null && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Tip</span>
                    <span className="font-mono">
                      {formatCurrency(result.receipt.tip, result.receipt.currency)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-200 dark:border-slate-600">
                  <span>Total</span>
                  <span className="text-green-600 dark:text-green-400">
                    {formatCurrency(result.receipt.total, result.receipt.currency)}
                  </span>
                </div>
              </div>

              {/* Payment Info */}
              {result.receipt.payment_method && (
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <CreditCard className="w-4 h-4" />
                  <span>
                    {result.receipt.payment_method}
                    {result.receipt.card_last_four && ` •••• ${result.receipt.card_last_four}`}
                  </span>
                </div>
              )}

              {/* Confidence */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">AI Confidence</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        result.receipt.confidence_score >= 0.8
                          ? "bg-green-500"
                          : result.receipt.confidence_score >= 0.6
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${result.receipt.confidence_score * 100}%` }}
                    />
                  </div>
                  <span className="font-mono text-xs">
                    {Math.round(result.receipt.confidence_score * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Scan Another Button */}
          <button
            onClick={reset}
            className="w-full py-3 px-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Receipt className="w-5 h-5" />
            Scan Another Receipt
          </button>
        </div>
      )}

      {/* Submit Button */}
      {file && status === "idle" && (
        <button
          onClick={handleSubmit}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Receipt className="w-5 h-5" />
          Scan Receipt
        </button>
      )}

      {/* Try Again Button */}
      {status === "error" && (
        <div className="flex gap-3">
          <button
            onClick={reset}
            className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-medium rounded-lg transition-colors"
          >
            Choose Different File
          </button>
          {file && (
            <button
              onClick={handleSubmit}
              className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      )}
    </div>
  );
}
