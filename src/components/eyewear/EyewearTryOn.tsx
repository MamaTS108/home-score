"use client";

import { useEffect, useRef, useState } from "react";
import type { EyewearProduct } from "@/lib/types";

// JeelizFaceFilter is a purpose-built, MIT/Apache-2.0 licensed face-tracking
// library. It ships only as a browser script (no npm package), so it's
// loaded from its CDN at runtime and exposed as the `window.JEELIZFACEFILTER`
// global.
//
// Important: JeelizFaceFilter's init() only computes the face-tracking
// numbers (position/scale/rotation) -- it does NOT draw the camera image
// anywhere by itself (its own demos only do that by additionally wiring up
// an internal WebGL helper we don't need). So here we display the webcam
// ourselves with a plain <video> element (which every browser renders
// correctly out of the box), and use JeelizFaceFilter purely in the
// background, on a hidden canvas, to get the tracking numbers used to
// position the glasses overlay on top of that visible video.
const JEELIZ_SCRIPT_URL = "https://cdn.jsdelivr.net/gh/jeeliz/jeelizFaceFilter@master/dist/jeelizFaceFilter.js";
const JEELIZ_NNC_PATH = "https://cdn.jsdelivr.net/gh/jeeliz/jeelizFaceFilter@master/neuralNets/";
const TRACKING_CANVAS_ID = "eyewear-jeeliz-tracking-canvas";

// Fraction of the detected face-box width used as eyewear width, and how far
// down from the top of that box the glasses' vertical center sits. Tuned
// empirically -- adjust here if glasses consistently look too
// big/small/high/low across test photos.
const GLASSES_WIDTH_RATIO = 1.35;
const GLASSES_VERTICAL_RATIO = 0.58;
const DETECTION_CONFIDENCE_THRESHOLD = 0.6;

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    JEELIZFACEFILTER?: any;
  }
}

interface Props {
  product: EyewearProduct;
  onClose: () => void;
}

type Status = "loading-model" | "requesting-camera" | "running" | "error";

function loadJeelizScript(): Promise<void> {
  if (window.JEELIZFACEFILTER) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${JEELIZ_SCRIPT_URL}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Le script JeelizFaceFilter n'a pas pu être chargé.")));
      return;
    }
    const script = document.createElement("script");
    script.src = JEELIZ_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Le script JeelizFaceFilter n'a pas pu être chargé."));
    document.head.appendChild(script);
  });
}

export function EyewearTryOn({ product, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const glassesImageRef = useRef<HTMLImageElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [status, setStatus] = useState<Status>("loading-model");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const glassesImage = new Image();
    glassesImage.crossOrigin = "anonymous";
    glassesImage.src = product.imageUrl;
    glassesImageRef.current = glassesImage;
  }, [product.imageUrl]);

  useEffect(() => {
    let cancelled = false;
    let videoReady = false;
    let trackerReady = false;

    function markRunningIfReady() {
      if (!cancelled && videoReady && trackerReady) {
        setStatus("running");
      }
    }

    async function startOwnCamera() {
      setStatus("requesting-camera");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      if (cancelled) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();
      if (cancelled) return;
      videoReady = true;
      markRunningIfReady();
    }

    async function startTracker() {
      await loadJeelizScript();
      if (cancelled) return;

      window.JEELIZFACEFILTER.init({
        canvasId: TRACKING_CANVAS_ID,
        NNCPath: JEELIZ_NNC_PATH,
        followZRot: true,
        videoSettings: { facingMode: "user" },

        callbackReady: (errCode: string | false) => {
          if (cancelled) return;
          if (errCode) {
            console.error("JeelizFaceFilter init error", errCode);
            setStatus("error");
            setErrorMessage(
              errCode === "WEBCAM_UNAVAILABLE"
                ? "Accès à la webcam refusé ou indisponible."
                : `Impossible de démarrer l'essayage virtuel sur cet appareil (${errCode}).`
            );
            return;
          }
          trackerReady = true;
          markRunningIfReady();
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        callbackTrack: (detectState: any) => {
          const overlay = overlayCanvasRef.current;
          const glassesImg = glassesImageRef.current;
          if (!overlay) return;
          const ctx = overlay.getContext("2d");
          if (!ctx) return;

          ctx.clearRect(0, 0, overlay.width, overlay.height);

          if (
            detectState.detected < DETECTION_CONFIDENCE_THRESHOLD ||
            !glassesImg ||
            !glassesImg.complete ||
            glassesImg.naturalWidth === 0
          ) {
            return;
          }

          // Face bounding square in canvas pixel space, using JeelizFaceFilter's
          // own documented formula (from its official Canvas2D helper) so the
          // (x, y) top-left corner + width/height match what the library
          // considers the tracked face's frame.
          const faceW = detectState.s * overlay.width;
          const faceX = (0.5 + 0.5 * detectState.x - 0.5 * detectState.s) * overlay.width;
          const faceY = (0.5 + 0.5 * detectState.y - 0.5 * detectState.s) * overlay.height;

          const centerX = faceX + faceW / 2;
          const centerY = faceY + faceW * GLASSES_VERTICAL_RATIO;
          const glassesWidth = faceW * GLASSES_WIDTH_RATIO;
          const glassesHeight = glassesWidth * (glassesImg.naturalHeight / glassesImg.naturalWidth);

          ctx.save();
          ctx.translate(centerX, centerY);
          ctx.rotate(-detectState.rz);
          ctx.drawImage(glassesImg, -glassesWidth / 2, -glassesHeight / 2, glassesWidth, glassesHeight);
          ctx.restore();
        },
      });
    }

    async function start() {
      try {
        // Run both in parallel: our own visible camera feed, and Jeeliz's
        // own (hidden) camera feed used only for tracking numbers.
        await Promise.all([startOwnCamera(), startTracker()]);
      } catch (err) {
        if (cancelled) return;
        console.error("Eyewear try-on failed to start", err);
        setStatus("error");
        const detail = err instanceof Error ? err.message : String(err);
        setErrorMessage(
          detail.toLowerCase().includes("permission") || detail.toLowerCase().includes("denied")
            ? "Accès à la webcam refusé ou indisponible."
            : `Impossible de démarrer l'essayage virtuel sur cet appareil (${detail}).`
        );
      }
    }

    start();

    return () => {
      cancelled = true;
      if (window.JEELIZFACEFILTER) {
        // destroy() releases the camera and WebGL context; fire-and-forget,
        // it returns a Promise we don't need to await on unmount.
        window.JEELIZFACEFILTER.destroy();
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
    // Only ever start once per mount -- the glasses image is swapped via the
    // separate effect above without restarting the camera/tracker.
  }, []);

  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-surface overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div>
          <p className="font-medium">
            {product.brand} — {product.name}
          </p>
          <p className="text-xs text-muted-foreground">Essayage en direct, rien n&apos;est enregistré.</p>
        </div>
        <button type="button" onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground">
          Fermer
        </button>
      </div>

      <div className="relative bg-black aspect-[4/3] max-h-[70vh]">
        <div className="absolute inset-0" style={{ transform: "scaleX(-1)" }}>
          {/* The camera feed the visitor actually sees. */}
          <video
            ref={videoRef}
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-contain"
          />
          {/* The glasses overlay, drawn from JeelizFaceFilter's tracking data. */}
          <canvas
            ref={overlayCanvasRef}
            width={640}
            height={480}
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          />
          {/* JeelizFaceFilter's own canvas: only used to run its tracking, never shown. */}
          <canvas
            id={TRACKING_CANVAS_ID}
            width={640}
            height={480}
            style={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
          />
        </div>

        {status !== "running" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white text-sm text-center px-6">
            {status === "loading-model" && "Chargement du modèle de détection de visage..."}
            {status === "requesting-camera" && "Autorisez l'accès à votre webcam..."}
            {status === "error" && (errorMessage ?? "Une erreur est survenue.")}
          </div>
        )}
      </div>
    </div>
  );
}