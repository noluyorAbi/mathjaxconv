"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import NextImage from "next/image";
import {
  Download,
  Upload,
  Palette,
  Eye,
  EyeOff,
  X,
  Clipboard,
  Copy,
  Check,
  Image as ImageIcon,
  Sparkles,
  Zap,
  Wand2,
  ArrowRight,
  CheckCircle,
  Info,
} from "lucide-react";

// Interface for color range management
interface ColorRange {
  r: number; // Red component (0-255)
  g: number; // Green component (0-255)
  b: number; // Blue component (0-255)
  tolerance: number; // How similar colors should be (0-255)
}

export default function PixelColorRemover() {
  // State management
  const [originalImage, setOriginalImage] = useState<string | null>(null); // Original uploaded image as data URL
  const [processedImage, setProcessedImage] = useState<string | null>(null); // Processed image with transparency
  const [isProcessing, setIsProcessing] = useState(false); // Loading state during image processing
  const [showCopySuccess, setShowCopySuccess] = useState(false); // Success notification for copy operation
  const [processingProgress, setProcessingProgress] = useState(0); // Progress for processing animation
  const [isDragging, setIsDragging] = useState(false); // Drag state for drop zone

  // State for managing color ranges to remove
  const [selectedColors, setSelectedColors] = useState<ColorRange[]>([
    { r: 204, g: 204, b: 204, tolerance: 5 }, // Default: #CCC with tolerance
  ]);

  // Refs for DOM elements
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Add a new color range to the list
  const addColorRange = () => {
    setSelectedColors([
      ...selectedColors,
      { r: 204, g: 204, b: 204, tolerance: 5 },
    ]);
  };

  // Remove a color range from the list
  const removeColorRange = (index: number) => {
    if (selectedColors.length > 1) {
      setSelectedColors(selectedColors.filter((_, i) => i !== index));
    }
  };

  // Update a specific color range property
  const updateColorRange = (
    index: number,
    field: keyof ColorRange,
    value: number
  ) => {
    const newColors = [...selectedColors];
    newColors[index] = { ...newColors[index], [field]: value };
    setSelectedColors(newColors);
  };

  // Check if a pixel color falls within the tolerance range of a target color
  const isColorInRange = (
    r: number,
    g: number,
    b: number,
    targetColor: ColorRange
  ): boolean => {
    const deltaR = Math.abs(r - targetColor.r);
    const deltaG = Math.abs(g - targetColor.g);
    const deltaB = Math.abs(b - targetColor.b);
    return (
      deltaR <= targetColor.tolerance &&
      deltaG <= targetColor.tolerance &&
      deltaB <= targetColor.tolerance
    );
  };

  // Process the image to remove selected colors and make them transparent
  const processImage = useCallback(async () => {
    if (!originalImage || !canvasRef.current) return;

    setIsProcessing(true);
    setProcessingProgress(0);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // Set canvas dimensions to match image
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Get image data for pixel manipulation
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Process each pixel
      const totalPixels = data.length / 4;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Check if this pixel matches any of the selected colors
        const shouldMakeTransparent = selectedColors.some((color) =>
          isColorInRange(r, g, b, color)
        );

        if (shouldMakeTransparent) {
          // Make pixel transparent
          data[i + 3] = 0; // Alpha channel to 0
        }

        // Update progress
        if (i % (totalPixels / 100) === 0) {
          setProcessingProgress((i / data.length) * 100);
        }
      }

      // Put processed image data back to canvas
      ctx.putImageData(imageData, 0, 0);

      // Convert canvas to data URL for display and download
      const processedDataUrl = canvas.toDataURL("image/png");
      setProcessedImage(processedDataUrl);
      setProcessingProgress(100);
      setIsProcessing(false);
    };

    img.src = originalImage;
  }, [originalImage, selectedColors]);

  // Download the processed image
  const downloadImage = () => {
    if (!processedImage) return;

    const link = document.createElement("a");
    link.href = processedImage;
    link.download = "processed-image.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy the processed image to clipboard
  const copyToClipboard = async () => {
    if (!processedImage) return;

    try {
      // Convert data URL to blob
      const response = await fetch(processedImage);
      const blob = await response.blob();

      // Copy blob to clipboard
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ]);

      // Show success notification
      setShowCopySuccess(true);
      setTimeout(() => setShowCopySuccess(false), 3000); // Hide after 3 seconds
    } catch (error) {
      console.error("Failed to copy image to clipboard:", error);
    }
  };

  // Handle color picker changes
  const handleColorPickerChange = (index: number, color: string) => {
    // Convert hex to RGB
    const hex = color.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    updateColorRange(index, "r", r);
    updateColorRange(index, "g", g);
    updateColorRange(index, "b", b);
  };

  // Convert RGB values to hex color string
  const rgbToHex = (r: number, g: number, b: number): string => {
    const toHex = (n: number) => {
      const hex = n.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  // File upload handler
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setOriginalImage(result);
        setProcessedImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // Paste handler
  const handlePaste = (event: ClipboardEvent) => {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf("image") !== -1) {
        const blob = item.getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const result = e.target?.result as string;
            setOriginalImage(result);
            setProcessedImage(null);
          };
          reader.readAsDataURL(blob);
        }
      }
    }
  };

  // React drop zone:
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          setOriginalImage(result);
          setProcessedImage(null);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // React handlers:
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  // Global listeners:
  useEffect(() => {
    const handlePasteEvent = (e: Event) => handlePaste(e as ClipboardEvent);
    const handleDropEvent = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            const result = (ev.target as FileReader).result as string;
            setOriginalImage(result);
            setProcessedImage(null);
          };
          reader.readAsDataURL(file);
        }
      }
    };
    const handleDragOverEvent = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
    };
    const handleDragLeaveEvent = () => setIsDragging(false);

    document.addEventListener("paste", handlePasteEvent);
    document.addEventListener("drop", handleDropEvent);
    document.addEventListener("dragover", handleDragOverEvent);
    document.addEventListener("dragleave", handleDragLeaveEvent);

    return () => {
      document.removeEventListener("paste", handlePasteEvent);
      document.removeEventListener("drop", handleDropEvent);
      document.removeEventListener("dragover", handleDragOverEvent);
      document.removeEventListener("dragleave", handleDragLeaveEvent);
    };
  }, []);

  // Auto-process when image or colors change
  useEffect(() => {
    if (originalImage && selectedColors.length > 0) {
      processImage();
    }
  }, [originalImage, selectedColors, processImage]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gray-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/3 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-gray-800 to-gray-900 text-white px-4 py-2 rounded-full text-sm font-medium mb-4 border border-gray-700">
            <Sparkles className="w-4 h-4" />
            Pixel Color Remover
          </div>
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent mb-4">
            Remove Colors
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Upload an image and remove specific colors to create transparent
            backgrounds
          </p>
        </motion.div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* Left Panel - Controls */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            {/* Upload Section */}
            <Card className="bg-gradient-to-br from-gray-900 to-black/90 backdrop-blur-xl border-gray-800 shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl">
                    <Upload className="h-6 w-6 text-white" />
                  </div>
                  Upload Image
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Select an image to process or paste from clipboard
                </CardDescription>
              </CardHeader>
              <CardContent>
                <motion.div
                  ref={dropZoneRef}
                  className={cn(
                    "relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 group cursor-pointer",
                    isDragging
                      ? "border-emerald-400 bg-emerald-500/10"
                      : "border-gray-600 hover:border-emerald-400 hover:bg-emerald-500/5"
                  )}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <motion.div
                    className="space-y-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <motion.div
                      className="mx-auto w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center"
                      whileHover={{ rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <ImageIcon className="h-10 w-10 text-white" />
                    </motion.div>
                    <div>
                      <p className="text-gray-200 font-semibold text-lg">
                        Drag & drop image here
                      </p>
                      <p className="text-gray-400 text-sm mt-2">
                        or paste with Ctrl+V
                      </p>
                    </div>
                  </motion.div>
                </motion.div>

                <div className="flex gap-3 mt-6">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg"
                    size="lg"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Choose File
                  </Button>
                  <Button
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700/50 hover:border-emerald-400"
                    size="lg"
                    onClick={() => {
                      navigator.clipboard.read().then(async (items) => {
                        for (const item of items) {
                          if (
                            item.types.includes("image/png") ||
                            item.types.includes("image/jpeg")
                          ) {
                            const blob =
                              (await item.getType("image/png")) ||
                              (await item.getType("image/jpeg"));
                            if (blob) {
                              const reader = new FileReader();
                              reader.onload = (e) => {
                                const result = e.target?.result as string;
                                setOriginalImage(result);
                                setProcessedImage(null);
                              };
                              reader.readAsDataURL(blob);
                            }
                          }
                        }
                      });
                    }}
                  >
                    <Clipboard className="h-4 w-4 mr-2" />
                    Paste
                  </Button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <AnimatePresence>
                  {originalImage && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-3 text-emerald-400 bg-emerald-500/10 p-4 rounded-xl mt-4"
                    >
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">
                        Image loaded successfully
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>

            {/* Color Selection */}
            <Card className="bg-gradient-to-br from-gray-900 to-black/90 backdrop-blur-xl border-gray-800 shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-gray-800 rounded-xl">
                    <Palette className="h-6 w-6 text-white" />
                  </div>
                  Color Selection
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Select colors to remove (make transparent)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedColors.map((color, index) => (
                    <div
                      key={index}
                      className="flex flex-col md:flex-row md:items-center gap-4 bg-gray-800/70 rounded-xl p-4 border border-gray-700 focus-within:ring-2 focus-within:ring-white/30 transition"
                    >
                      {/* Color preview */}
                      <div className="flex items-center gap-3 min-w-[120px]">
                        <div
                          className="w-10 h-10 rounded-lg border-2 border-white/10 shadow"
                          style={{
                            backgroundColor: rgbToHex(
                              color.r,
                              color.g,
                              color.b
                            ),
                          }}
                          aria-label={`Preview of color ${rgbToHex(
                            color.r,
                            color.g,
                            color.b
                          )}`}
                        />
                        <div>
                          <div className="text-sm font-mono text-gray-200">
                            {rgbToHex(color.r, color.g, color.b)}
                          </div>
                          <div className="text-xs text-gray-400">
                            RGB({color.r}, {color.g}, {color.b})
                          </div>
                        </div>
                      </div>
                      {/* Color picker */}
                      <input
                        type="color"
                        defaultValue={rgbToHex(color.r, color.g, color.b)}
                        onChange={(e) =>
                          handleColorPickerChange(index, e.target.value)
                        }
                        className="w-10 h-10 rounded-lg border-2 border-gray-700 cursor-pointer hover:border-white focus:outline-none focus:ring-2 focus:ring-white/40 transition"
                        aria-label={`Pick color for range ${index + 1}`}
                      />
                      {/* Tolerance slider */}
                      <div className="flex flex-col gap-1 flex-1 min-w-[120px]">
                        <label
                          className="text-xs text-gray-400 mb-1"
                          htmlFor={`tolerance-slider-${index}`}
                        >
                          Tolerance
                        </label>
                        <input
                          id={`tolerance-slider-${index}`}
                          type="range"
                          min="0"
                          max="255"
                          value={color.tolerance}
                          onChange={(e) =>
                            updateColorRange(
                              index,
                              "tolerance",
                              parseInt(e.target.value)
                            )
                          }
                          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/40 slider-thumb"
                          aria-valuenow={color.tolerance}
                          aria-valuemin={0}
                          aria-valuemax={255}
                        />
                        <div className="flex justify-between text-[10px] text-gray-500">
                          <span>Exact</span>
                          <span>Similar</span>
                          <span>Any</span>
                        </div>
                      </div>
                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={() => removeColorRange(index)}
                        disabled={selectedColors.length === 1}
                        className="ml-auto p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-500/10 focus:outline-none focus:ring-2 focus:ring-red-500/40 disabled:opacity-40 disabled:cursor-not-allowed transition"
                        aria-label={`Remove color range ${index + 1}`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={addColorRange}
                      className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-600 rounded-lg text-gray-300 hover:border-white hover:text-white focus:outline-none focus:ring-2 focus:ring-white/40 transition"
                    >
                      <Palette className="w-4 h-4" /> Add Color Range
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Processing Status */}
            <AnimatePresence>
              {isProcessing && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  <Card className="bg-gradient-to-br from-gray-900 to-black/90 backdrop-blur-xl border-gray-800 shadow-2xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3 text-xl">
                        <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl">
                          <Zap className="h-6 w-6 text-white animate-pulse" />
                        </div>
                        Processing Image
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <Progress value={processingProgress} className="h-3" />
                        <p className="text-sm text-gray-300 text-center">
                          Removing selected colors...{" "}
                          {Math.round(processingProgress)}%
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action Buttons */}
            <AnimatePresence>
              {processedImage && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  <Card className="bg-gradient-to-br from-gray-900 to-black/90 backdrop-blur-xl border-gray-800 shadow-2xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3 text-xl">
                        <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
                          <Wand2 className="h-6 w-6 text-white" />
                        </div>
                        Download & Share
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <Button
                          onClick={downloadImage}
                          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg"
                          size="lg"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                        <Button
                          onClick={copyToClipboard}
                          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg"
                          size="lg"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Right Panel - Image Display */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="space-y-8"
          >
            {/* Original Image */}
            <AnimatePresence>
              {originalImage && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                >
                  <Card className="bg-gradient-to-br from-gray-900 to-black/90 backdrop-blur-xl border-gray-800 shadow-2xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3 text-xl">
                        <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
                          <Eye className="h-6 w-6 text-white" />
                        </div>
                        Original Image
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <motion.div
                        className="relative group"
                        whileHover={{ scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
                        <NextImage
                          src={originalImage}
                          alt="Original"
                          width={800}
                          height={600}
                          className="w-full h-auto rounded-2xl border border-gray-600/50 shadow-2xl"
                        />
                      </motion.div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Processed Image */}
            <AnimatePresence>
              {processedImage && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Card className="bg-gradient-to-br from-gray-900 to-black/90 backdrop-blur-xl border-gray-800 shadow-2xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3 text-xl">
                        <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                          <EyeOff className="h-6 w-6 text-white" />
                        </div>
                        Processed Image
                      </CardTitle>
                      <CardDescription className="text-gray-300">
                        Colors removed and made transparent
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <motion.div
                        className="relative"
                        whileHover={{ scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <div className="bg-checkerboard rounded-2xl p-8 border border-gray-600/50 shadow-2xl">
                          <NextImage
                            src={processedImage}
                            alt="Processed"
                            width={800}
                            height={600}
                            className="w-full h-auto rounded-xl"
                          />
                        </div>
                      </motion.div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Hidden Canvas for Processing */}
            <canvas ref={canvasRef} className="hidden" />
          </motion.div>
        </div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-16"
        >
          <Card className="bg-gradient-to-br from-gray-900 to-black/90 backdrop-blur-xl border-gray-800 shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl">
                  <Info className="h-6 w-6 text-white" />
                </div>
                How to Use
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-8">
                <motion.div
                  className="space-y-4"
                  whileHover={{ y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">1</span>
                    </div>
                    <h4 className="font-semibold text-emerald-400 text-lg">
                      Upload Image
                    </h4>
                  </div>
                  <div className="space-y-2 text-sm text-gray-300 pl-11">
                    <p className="flex items-center gap-2">
                      <ArrowRight className="w-3 h-3 text-emerald-400" />
                      Choose file or drag & drop
                    </p>
                    <p className="flex items-center gap-2">
                      <ArrowRight className="w-3 h-3 text-emerald-400" />
                      Paste with Ctrl+V
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  className="space-y-4"
                  whileHover={{ y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">2</span>
                    </div>
                    <h4 className="font-semibold text-purple-400 text-lg">
                      Select Colors
                    </h4>
                  </div>
                  <div className="space-y-2 text-sm text-gray-300 pl-11">
                    <p className="flex items-center gap-2">
                      <ArrowRight className="w-3 h-3 text-purple-400" />
                      Add color ranges to remove
                    </p>
                    <p className="flex items-center gap-2">
                      <ArrowRight className="w-3 h-3 text-purple-400" />
                      Adjust tolerance settings
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  className="space-y-4"
                  whileHover={{ y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">3</span>
                    </div>
                    <h4 className="font-semibold text-blue-400 text-lg">
                      Download Result
                    </h4>
                  </div>
                  <div className="space-y-2 text-sm text-gray-300 pl-11">
                    <p className="flex items-center gap-2">
                      <ArrowRight className="w-3 h-3 text-blue-400" />
                      Download processed image
                    </p>
                    <p className="flex items-center gap-2">
                      <ArrowRight className="w-3 h-3 text-blue-400" />
                      Copy to clipboard
                    </p>
                  </div>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Success notification */}
        <AnimatePresence>
          {showCopySuccess && (
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className="fixed top-6 right-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl z-50 border border-green-400/50 backdrop-blur-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <span className="font-semibold">
                  Image copied to clipboard!
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Custom CSS */}
      <style jsx>{`
        .bg-checkerboard {
          background-image: linear-gradient(45deg, #444 25%, transparent 25%),
            linear-gradient(-45deg, #444 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #444 75%),
            linear-gradient(-45deg, transparent 75%, #444 75%);
          background-size: 20px 20px;
          background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
        }

        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #8b5cf6, #ec4899);
          cursor: pointer;
          box-shadow: 0 4px 8px rgba(139, 92, 246, 0.3);
          border: 2px solid white;
          transition: all 0.2s ease;
        }

        .slider-thumb::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 12px rgba(139, 92, 246, 0.4);
        }

        .slider-thumb::-moz-range-thumb {
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #8b5cf6, #ec4899);
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 4px 8px rgba(139, 92, 246, 0.3);
        }
      `}</style>
      <style jsx>{`
        input[type="range"].slider-thumb::-webkit-slider-thumb {
          appearance: none;
          height: 18px;
          width: 18px;
          border-radius: 9999px;
          background: #fff;
          border: 2px solid #d1d5db;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
          transition: border 0.2s;
        }
        input[type="range"].slider-thumb:focus::-webkit-slider-thumb {
          border: 2px solid #fff;
        }
        input[type="range"].slider-thumb::-moz-range-thumb {
          height: 18px;
          width: 18px;
          border-radius: 9999px;
          background: #fff;
          border: 2px solid #d1d5db;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
          transition: border 0.2s;
        }
        input[type="range"].slider-thumb:focus::-moz-range-thumb {
          border: 2px solid #fff;
        }
      `}</style>
    </div>
  );
}
