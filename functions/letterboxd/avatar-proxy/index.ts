/*
 * BoxdBuddy - Avatar Proxy for Letterboxd Images
 * Copyright (C) 2025 Wootehfook
 * AI Generated: GitHub Copilot - 2025-08-16
 *
 * Proxies Letterboxd avatar images to bypass CORS restrictions
 */

export async function onRequest(context: {
  request: Request;
  env: {
    MOVIES_DB: any; // D1Database type
  };
}) {
  // Set CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

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
  // Enhanced secure URL validation to prevent domain spoofing and bypass attacks
  const isValidLetterboxdUrl = (urlString: string): boolean => {
    try {
      const parsedUrl = new URL(urlString);

      // 1. Only allow https protocol
      if (parsedUrl.protocol !== "https:") {
        return false;
      }

      // 2. Reject percent-encoded characters in hostname or path (e.g., %2e, %2f)
      //    This helps prevent bypasses using encoded dots or slashes
      const rawHostname = parsedUrl.hostname;
      const rawPathname = parsedUrl.pathname;
      if (
        /%[0-9a-f]{2}/i.test(rawHostname) ||
        /%[0-9a-f]{2}/i.test(rawPathname)
      ) {
        return false;
      }

      // 3. Hostname must be exactly ltrbxd.com or end with .ltrbxd.com (case-insensitive)
      const hostname = rawHostname.toLowerCase();
      if (!(hostname === "ltrbxd.com" || hostname.endsWith(".ltrbxd.com"))) {
        return false;
      }

      // 4. Path validation: only allow image file extensions, and block suspicious patterns
      //    Allow: .jpg, .jpeg, .png, .webp, .gif
      if (!/\.(jpg|jpeg|png|webp|gif)$/i.test(rawPathname)) {
        return false;
      }
      // Block path traversal or encoded slashes
      if (
        rawPathname.includes("..") ||
        rawPathname.includes("%2e") ||
        rawPathname.includes("%2f")
      ) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  };

  if (!imageUrl || !isValidLetterboxdUrl(imageUrl)) {
    return new Response(
      "Invalid image URL - must be from Letterboxd domain with valid image extension",
      {
        status: 400,
        headers: corsHeaders,
      }
    );
  }

  try {
    // Fetch the image from Letterboxd with proper headers
    const imageResponse = await fetch(imageUrl, {
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

    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType =
      imageResponse.headers.get("content-type") || "image/jpeg";

    // Return the image with proper CORS headers
    return new Response(imageBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400", // Cache for 24 hours
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
