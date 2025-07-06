"use client";

// React imports for state management, refs, and effects
import React, { useState, useRef, useCallback, useEffect } from "react";
import NextImage from "next/image";

// UI Components from shadcn/ui
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Lucide React icons for UI elements
import {
  Download,
  Upload,
  Palette,
  Eye,
  EyeOff,
  X,
  Clipboard,
  Image as ImageIcon,
} from "lucide-react";

/**
 * Interface defining the structure of a color range for removal
 * Each color range consists of RGB values and a tolerance level
 */
interface ColorRange {
  r: number; // Red component (0-255)
  g: number; // Green component (0-255)
  b: number; // Blue component (0-255)
  tolerance: number; // How similar colors should be (0-255)
}

/**
 * Main component for the Pixel Color Remover application
 * Handles image upload, color selection, and image processing
 */
export default function PixelColorRemover() {
  // State for managing images
  const [originalImage, setOriginalImage] = useState<string | null>(null); // Original uploaded image as data URL
  const [processedImage, setProcessedImage] = useState<string | null>(null); // Processed image with transparency
  const [isProcessing, setIsProcessing] = useState(false); // Loading state during image processing

  // State for managing color ranges to remove
  const [selectedColors, setSelectedColors] = useState<ColorRange[]>([
    { r: 204, g: 204, b: 204, tolerance: 20 }, // Default: #CCC with 20 tolerance
  ]);

  // Refs for DOM elements
  const fileInputRef = useRef<HTMLInputElement>(null); // Hidden file input for uploads
  const canvasRef = useRef<HTMLCanvasElement>(null); // Hidden canvas for image processing
  const dropZoneRef = useRef<HTMLDivElement>(null); // Drop zone for drag & drop

  /**
   * Handles file upload from the file input
   * Converts the uploaded file to a data URL for display and processing
   */
  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Use FileReader to convert file to data URL
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setOriginalImage(result); // Store the image data URL
        setProcessedImage(null); // Clear any previous processed image
      };
      reader.readAsDataURL(file); // Convert file to base64 data URL
    },
    [] // Empty dependency array since this function doesn't depend on any state
  );

  /**
   * Adds a new color range to the list
   * Creates a new color range with default values (#CCC with 20 tolerance)
   */
  const addColorRange = () => {
    setSelectedColors([
      ...selectedColors, // Spread existing colors
      { r: 204, g: 204, b: 204, tolerance: 20 }, // Add new default color range
    ]);
  };

  /**
   * Removes a color range at the specified index
   * @param index - The index of the color range to remove
   */
  const removeColorRange = (index: number) => {
    setSelectedColors(selectedColors.filter((_, i) => i !== index)); // Filter out the specified index
  };

  /**
   * Updates a specific field of a color range
   * @param index - The index of the color range to update
   * @param field - The field to update (r, g, b, or tolerance)
   * @param value - The new value for the field
   */
  const updateColorRange = (
    index: number,
    field: keyof ColorRange,
    value: number
  ) => {
    const newColors = [...selectedColors]; // Create a copy of the colors array
    newColors[index] = { ...newColors[index], [field]: value }; // Update the specific field
    setSelectedColors(newColors); // Update state with the new array
  };

  /**
   * Checks if a pixel color falls within the tolerance range of a target color
   * @param r - Red component of the pixel (0-255)
   * @param g - Green component of the pixel (0-255)
   * @param b - Blue component of the pixel (0-255)
   * @param targetColor - The target color range to check against
   * @returns true if the pixel color is within tolerance of the target color
   */
  const isColorInRange = (
    r: number,
    g: number,
    b: number,
    targetColor: ColorRange
  ): boolean => {
    // Calculate the absolute difference for each color component
    const deltaR = Math.abs(r - targetColor.r);
    const deltaG = Math.abs(g - targetColor.g);
    const deltaB = Math.abs(b - targetColor.b);

    // Check if all components are within the tolerance range
    return (
      deltaR <= targetColor.tolerance &&
      deltaG <= targetColor.tolerance &&
      deltaB <= targetColor.tolerance
    );
  };

  /**
   * Processes the original image to remove selected colors and make them transparent
   * Uses HTML5 Canvas to manipulate pixel data
   */
  const processImage = useCallback(async () => {
    if (!originalImage || !canvasRef.current) return;

    setIsProcessing(true); // Start loading state

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Create a new image element to load the original image
    const img = new Image();
    img.onload = () => {
      // Set canvas dimensions to match the image
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw the original image onto the canvas
      ctx.drawImage(img, 0, 0);

      // Get the pixel data from the canvas (RGBA format)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data; // Array of pixel values [r, g, b, a, r, g, b, a, ...]

      // Process each pixel (every 4 values = 1 pixel: r, g, b, a)
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]; // Red component
        const g = data[i + 1]; // Green component
        const b = data[i + 2]; // Blue component
        // data[i + 3] is the alpha component (transparency)

        // Check if this pixel matches any of the selected colors to remove
        const shouldMakeTransparent = selectedColors.some((colorRange) =>
          isColorInRange(r, g, b, colorRange)
        );

        if (shouldMakeTransparent) {
          data[i + 3] = 0; // Set alpha to 0 (fully transparent)
        }
      }

      // Put the modified pixel data back onto the canvas
      ctx.putImageData(imageData, 0, 0);

      // Convert the canvas to a data URL (PNG format with transparency)
      const processedDataUrl = canvas.toDataURL("image/png");
      setProcessedImage(processedDataUrl); // Store the processed image
      setIsProcessing(false); // End loading state
    };

    img.src = originalImage; // Load the image
  }, [originalImage, selectedColors]); // Dependencies for the callback

  /**
   * Downloads the processed image as a PNG file
   * Creates a temporary link element to trigger the download
   */
  const downloadImage = () => {
    if (!processedImage) return;

    // Create a temporary anchor element for download
    const link = document.createElement("a");
    link.download = "processed-image.png"; // Set the filename
    link.href = processedImage; // Set the data URL as the source
    link.click(); // Trigger the download
  };

  /**
   * Handles color picker changes and updates the color range
   * Converts hex color to RGB values and updates the state
   * @param index - The index of the color range to update
   * @param color - The hex color string (e.g., "#ff0000")
   */
  const handleColorPickerChange = (index: number, color: string) => {
    const hex = color.replace("#", ""); // Remove the # from hex color
    const r = parseInt(hex.substring(0, 2), 16); // Parse red component
    const g = parseInt(hex.substring(2, 4), 16); // Parse green component
    const b = parseInt(hex.substring(4, 6), 16); // Parse blue component

    // Update the color range with new RGB values
    const newColors = [...selectedColors];
    newColors[index] = { ...newColors[index], r, g, b };
    setSelectedColors(newColors);
  };

  /**
   * Converts RGB values to a hex color string
   * @param r - Red component (0-255)
   * @param g - Green component (0-255)
   * @param b - Blue component (0-255)
   * @returns Hex color string (e.g., "#ff0000")
   */
  const rgbToHex = (r: number, g: number, b: number): string => {
    const toHex = (n: number) => {
      const hex = n.toString(16); // Convert to base 16
      return hex.length === 1 ? "0" + hex : hex; // Pad with leading zero if needed
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`; // Combine into hex color string
  };

  /**
   * Handles paste events (Ctrl+V) to load images from clipboard
   * Checks for image data in the clipboard and loads it if found
   */
  const handlePaste = useCallback((event: ClipboardEvent) => {
    const items = event.clipboardData?.items;
    if (!items) return;

    // Loop through clipboard items to find image data
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          // Convert the clipboard image to a data URL
          const reader = new FileReader();
          reader.onload = (e) => {
            const result = e.target?.result as string;
            setOriginalImage(result); // Store the pasted image
            setProcessedImage(null); // Clear any previous processed image
          };
          reader.readAsDataURL(file);
        }
        break; // Exit after finding the first image
      }
    }
  }, []); // Empty dependency array since this function doesn't depend on any state

  /**
   * Handles drag and drop events to load images
   * Prevents default browser behavior and loads the dropped image file
   */
  const handleDrop = useCallback((event: DragEvent) => {
    event.preventDefault(); // Prevent default browser drop behavior
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0]; // Get the first dropped file
      if (file.type.startsWith("image/")) {
        // Convert the dropped image to a data URL
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          setOriginalImage(result); // Store the dropped image
          setProcessedImage(null); // Clear any previous processed image
        };
        reader.readAsDataURL(file);
      }
    }
  }, []); // Empty dependency array since this function doesn't depend on any state

  /**
   * Handles drag over events to enable drop functionality
   * Prevents default browser behavior to allow dropping
   */
  const handleDragOver = useCallback((event: DragEvent) => {
    event.preventDefault(); // Allow dropping by preventing default behavior
  }, []); // Empty dependency array since this function doesn't depend on any state

  /**
   * Sets up global event listeners for paste and drag/drop functionality
   * Adds listeners when component mounts and removes them when unmounting
   */
  useEffect(() => {
    // Type-safe event handlers that cast events to the correct type
    const handlePasteEvent = (e: Event) => handlePaste(e as ClipboardEvent);
    const handleDropEvent = (e: Event) => handleDrop(e as DragEvent);
    const handleDragOverEvent = (e: Event) => handleDragOver(e as DragEvent);

    // Add global event listeners
    document.addEventListener("paste", handlePasteEvent);
    document.addEventListener("drop", handleDropEvent);
    document.addEventListener("dragover", handleDragOverEvent);

    // Cleanup function to remove event listeners when component unmounts
    return () => {
      document.removeEventListener("paste", handlePasteEvent);
      document.removeEventListener("drop", handleDropEvent);
      document.removeEventListener("dragover", handleDragOverEvent);
    };
  }, [handlePaste, handleDrop, handleDragOver]); // Dependencies for the effect

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Animated background with floating particles for visual appeal */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-transparent to-teal-900/20 animate-pulse"></div>
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl animate-bounce"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse"></div>
      </div>

      {/* Main content container with proper z-index to appear above background */}
      <div className="relative z-10 max-w-7xl mx-auto p-6">
        {/* Page header with title and description */}
        <div className="text-center mb-12">
          {/* Title with icon */}
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl">
              <Palette className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              Pixel Color Remover
            </h1>
          </div>
          {/* Description with usage instructions */}
          <p className="text-gray-300 text-xl max-w-2xl mx-auto leading-relaxed">
            Remove specific colors from images and make them transparent.
            <span className="text-emerald-400 font-medium">
              {" "}
              Paste images with Ctrl+V
            </span>{" "}
            or drag &amp; drop.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Panel - Controls */}
          <div className="space-y-8">
            {/* File Upload */}
            <Card className="bg-gray-800/80 backdrop-blur-sm border-gray-700/50 shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-emerald-500/20 rounded-lg">
                    <Upload className="h-6 w-6 text-emerald-400" />
                  </div>
                  Upload Image
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Select an image to process or paste from clipboard
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Drop Zone */}
                  <div
                    ref={dropZoneRef}
                    className="relative border-2 border-dashed border-gray-600 rounded-xl p-8 text-center hover:border-emerald-500 transition-colors duration-300 group"
                    onDrop={(e) => handleDrop(e as unknown as DragEvent)}
                    onDragOver={(e) =>
                      handleDragOver(e as unknown as DragEvent)
                    }
                  >
                    <div className="space-y-4">
                      <div className="mx-auto w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                        <ImageIcon className="h-8 w-8 text-gray-400 group-hover:text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-gray-300 font-medium">
                          Drag &amp; drop image here
                        </p>
                        <p className="text-gray-500 text-sm mt-1">
                          or paste with Ctrl+V
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 shadow-lg"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Choose File
                    </Button>
                    <Button
                      variant="outline"
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
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

                  {originalImage && (
                    <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 p-3 rounded-lg">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium">
                        ✓ Image loaded successfully
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Color Selection */}
            <Card className="bg-gray-800/80 backdrop-blur-sm border-gray-700/50 shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-teal-500/20 rounded-lg">
                    <Palette className="h-6 w-6 text-teal-400" />
                  </div>
                  Color Selection
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Select colors to remove (make transparent)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selectedColors.map((color, index) => (
                    <div
                      key={index}
                      className="group relative bg-gradient-to-r from-gray-700/30 to-gray-600/30 rounded-2xl border border-gray-600/30 hover:border-teal-500/50 transition-all duration-300 p-4"
                    >
                      {/* Color Preview */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div
                              className="w-12 h-12 rounded-xl border-3 border-white/20 shadow-lg ring-2 ring-gray-600/50 group-hover:ring-teal-500/50 transition-all"
                              style={{
                                backgroundColor: rgbToHex(
                                  color.r,
                                  color.g,
                                  color.b
                                ),
                              }}
                            />
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-gray-800 rounded-full border border-gray-600 flex items-center justify-center">
                              <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                            </div>
                          </div>
                          <div>
                            <p className="text-lg font-semibold text-gray-200">
                              {rgbToHex(color.r, color.g, color.b)}
                            </p>
                            <p className="text-xs text-gray-400 font-mono">
                              RGB({color.r}, {color.g}, {color.b})
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeColorRange(index)}
                          className="text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Color Picker */}
                      <div className="flex items-center gap-4 mb-4">
                        <Label className="text-sm font-medium text-gray-300">
                          Color:
                        </Label>
                        <input
                          key={`color-${index}-${rgbToHex(
                            color.r,
                            color.g,
                            color.b
                          )}`}
                          type="color"
                          defaultValue={rgbToHex(color.r, color.g, color.b)}
                          onChange={(e) => {
                            const newColor = e.target.value;
                            handleColorPickerChange(index, newColor);
                          }}
                          className="w-12 h-12 rounded-xl border-2 border-gray-600 cursor-pointer hover:border-teal-500 transition-all shadow-lg"
                        />
                      </div>

                      {/* Tolerance Slider */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium text-gray-300">
                            Tolerance:
                          </Label>
                          <span className="text-sm font-bold text-teal-400 bg-teal-500/10 px-3 py-1 rounded-full">
                            {color.tolerance}
                          </span>
                        </div>
                        <div className="relative">
                          <Input
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
                            className="w-full h-3 bg-gray-700 rounded-full appearance-none cursor-pointer slider-thumb"
                          />
                          <div className="flex justify-between text-xs text-gray-500 mt-2">
                            <span className="font-medium">Exact</span>
                            <span className="font-medium">Similar</span>
                            <span className="font-medium">Any</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  <Button
                    onClick={addColorRange}
                    variant="outline"
                    className="w-full border-2 border-dashed border-gray-600 text-gray-300 hover:border-teal-500 hover:text-teal-400 hover:bg-teal-500/10 transition-all duration-300 py-4 rounded-2xl"
                  >
                    <Palette className="h-5 w-5 mr-2" />
                    Add Color Range
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Processing Controls */}
            <Card className="bg-gray-800/80 backdrop-blur-sm border-gray-700/50 shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Download className="h-6 w-6 text-blue-400" />
                  </div>
                  Processing
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Process the image with selected colors
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button
                    onClick={processImage}
                    disabled={!originalImage || isProcessing}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 shadow-lg py-3 text-lg font-medium"
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Processing...
                      </div>
                    ) : (
                      "Process Image"
                    )}
                  </Button>

                  {processedImage && (
                    <Button
                      onClick={downloadImage}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg py-3 text-lg font-medium"
                    >
                      <Download className="h-5 w-5 mr-2" />
                      Download Processed Image
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Image Display */}
          <div className="space-y-8">
            {/* Original Image */}
            {originalImage && (
              <Card className="bg-gray-800/80 backdrop-blur-sm border-gray-700/50 shadow-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <Eye className="h-6 w-6 text-green-400" />
                    </div>
                    Original Image
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"></div>
                    <NextImage
                      src={originalImage}
                      alt="Original"
                      width={800}
                      height={600}
                      className="w-full h-auto rounded-xl border border-gray-600/50 shadow-lg"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Processed Image */}
            {processedImage && (
              <Card className="bg-gray-800/80 backdrop-blur-sm border-gray-700/50 shadow-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <EyeOff className="h-6 w-6 text-purple-400" />
                    </div>
                    Processed Image
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Colors removed and made transparent
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <div className="bg-checkerboard rounded-xl p-6 border border-gray-600/50 shadow-lg">
                      <NextImage
                        src={processedImage}
                        alt="Processed"
                        width={800}
                        height={600}
                        className="w-full h-auto rounded-lg"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Hidden Canvas for Processing */}
            <canvas ref={canvasRef} className="hidden" />
          </div>
        </div>

        {/* Instructions */}
        <Card className="mt-12 bg-gray-800/80 backdrop-blur-sm border-gray-700/50 shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Palette className="h-6 w-6 text-yellow-400" />
              </div>
              How to Use
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold text-emerald-400">
                  Getting Started
                </h4>
                <div className="space-y-2 text-sm text-gray-300">
                  <p className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                    Upload an image using the &quot;Choose File&quot; button
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                    <span className="text-emerald-400 font-medium">
                      Paste images with Ctrl+V
                    </span>{" "}
                    or drag & drop
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                    Add color ranges you want to remove (default: #CCC)
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-teal-400">Processing</h4>
                <div className="space-y-2 text-sm text-gray-300">
                  <p className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-teal-400 rounded-full"></span>
                    Adjust tolerance slider to control color similarity
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-teal-400 rounded-full"></span>
                    Click &quot;Process Image&quot; to remove selected colors
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-teal-400 rounded-full"></span>
                    Download the processed image with transparency
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
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

        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(to right, #10b981, #14b8a6);
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(to right, #10b981, #14b8a6);
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #10b981, #14b8a6);
          cursor: pointer;
          box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3);
          border: 2px solid white;
          transition: all 0.2s ease;
        }

        .slider-thumb::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 12px rgba(16, 185, 129, 0.4);
        }

        .slider-thumb::-moz-range-thumb {
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #10b981, #14b8a6);
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3);
        }
      `}</style>
    </div>
  );
}
