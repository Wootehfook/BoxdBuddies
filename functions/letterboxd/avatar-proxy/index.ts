/*
 * BoxdBuddy - Avatar Proxy for Letterboxd Images
 * Copyright (C) 2025 Wootehfook
 * AI Generated: GitHub Copilot - 2025-08-16
 *
 * Proxies Letterboxd avatar images to bypass CORS restrictions
 */

// AI Generated: GitHub Copilot - 2025-08-29T10:45:00Z
// Fixed secure URL validation function for Letterboxd images
function isValidLetterboxdUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);

    // Ensure protocol is HTTPS only for security
    if (parsedUrl.protocol !== "https:") {
      return false;
    }

    // Prevent path traversal in pathname only (not entire URL)
    if (parsedUrl.pathname.includes("..")) {
      return false;
    }

    // Ensure the hostname is a valid Letterboxd domain
    const validHosts = ["ltrbxd.com", "a.ltrbxd.com", "s.ltrbxd.com"];

    return validHosts.some(
      (host) =>
        parsedUrl.hostname === host || parsedUrl.hostname.endsWith("." + host)
    );
  } catch {
    return false;
  }
}

// Raster image types only (SVG excluded: it can carry script).
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
]);
const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB

export async function onRequest(context: {
  request: Request;
  env: {
    MOVIES_DB: unknown;
  };
}) {
  // CORS headers are applied by functions/_middleware.ts (origin allowlist).
  const corsHeaders: Record<string, string> = {};

  // Handle OPTIONS (preflight) requests
  if (context.request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  const url = new URL(context.request.url);
  const imageUrl = url.searchParams.get("url");

  // AI Generated: GitHub Copilot - 2025-08-17T04:20:00Z
  // Enhanced security validation to prevent domain spoofing attacks
  if (!imageUrl || !isValidLetterboxdUrl(imageUrl)) {
    return new Response("Invalid or unsafe image URL", {
      status: 400,
      headers: corsHeaders,
    });
  }

  // AI Generated: GitHub Copilot - 2025-08-17T04:20:00Z
  // Additional file extension validation for image types
  const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif"];
  const urlPath = new URL(imageUrl).pathname.toLowerCase();
  const hasValidExtension = allowedExtensions.some((ext) =>
    urlPath.endsWith(ext)
  );

  if (!hasValidExtension) {
    return new Response("Invalid image file type", {
      status: 400,
      headers: corsHeaders,
    });
  }

  try {
    // Fetch the image from Letterboxd with proper headers
    const imageResponse = await fetch(imageUrl, {
      // Redirects are followed, but the final URL is re-validated below so a
      // redirect can never make us relay content from outside the allowlist.
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Referer: "https://letterboxd.com/",
        Accept: "image/webp,image/apng,image/*,*/*;q=0.8",
      },
    });

    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`);
    }

    if (imageResponse.url && !isValidLetterboxdUrl(imageResponse.url)) {
      throw new Error(`Redirected outside allowlist: ${imageResponse.url}`);
    }

    // Only relay genuine images, never HTML/JS/SVG from upstream.
    const contentType = (imageResponse.headers.get("content-type") || "")
      .split(";")[0]
      .trim()
      .toLowerCase();
    if (!ALLOWED_IMAGE_TYPES.has(contentType)) {
      throw new Error(`Unexpected content-type: ${contentType || "none"}`);
    }

    const declaredLength = Number(
      imageResponse.headers.get("content-length") || "0"
    );
    if (declaredLength > MAX_IMAGE_BYTES) {
      throw new Error(`Image too large: ${declaredLength} bytes`);
    }
    const imageBuffer = await imageResponse.arrayBuffer();
    if (imageBuffer.byteLength > MAX_IMAGE_BYTES) {
      throw new Error(`Image too large: ${imageBuffer.byteLength} bytes`);
    }

    // Return the image with proper CORS headers
    return new Response(imageBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400", // Cache for 24 hours
        "X-Content-Type-Options": "nosniff",
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error("Avatar proxy error:", error);

    // Return a transparent 1x1 pixel as fallback
    const transparentPixel = new Uint8Array([
      0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x21, 0xf9, 0x04, 0x01, 0x00,
      0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00,
      0x00, 0x02, 0x02, 0x44, 0x01, 0x00, 0x3b,
    ]);

    return new Response(transparentPixel, {
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control": "no-store",
        ...corsHeaders,
      },
    });
  }
}
