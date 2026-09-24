"use client";

import { useEffect, useRef, useState } from "react";
import type { EyewearProduct } from "@/lib/types";

// Landmark indices from MediaPipe's 468-point face mesh. Outer eye corners
// give us a stable reference for both the glasses' width and their rotation
// (roll); the nose bridge point pulls the vertical position down toward
// where frames actually rest.
const LEFT_EYE_OUTER = 33;
const RIGHT_EYE_OUTER = 263;
const NOSE_BRIDGE = 168;

// Glasses frames are noticeably wider than the outer-eye-corner distance
// (they extend out to the temples), so we scale the measured distance up.
const GLASSES_WIDTH_FACTOR = 2.3;

interface Props {
  product: EyewearProduct;
  onClose: () => void;
}

type Status = "loading-model" | "requesting-camera" | "running" | "error";

export function EyewearTryOn({ product, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const glassesImageRef = useRef<HTMLImageElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const landmarkerRef = useRef<any>(null);

  const [status, setStatus] = useState<Status>("loading-model");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const glassesImage = new Image();
    glassesImage.crossOrigin = "anonymous";
    glassesImage.src = product.imageUrl;
    glassesImageRef.current = glassesImage;

    async function start() {
      try {
        // Dynamic import: this library only works in the browser and is
        // fairly large, so it should never end up in the server bundle.
        const { FaceLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");

        const filesetResolver = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm"
        );

        // The GPU delegate relies on a WebGL context that several browsers
        // (Safari in particular) fail to hand it correctly -- the failure
        // happens deep inside the WASM runtime ("GLctx.activeTexture"),
        // outside of what a JS try/catch around createFromOptions can
        // reliably catch. CPU is slower per-frame but works everywhere, and
        // is plenty fast for a single face at this resolution.
        const modelAssetPath =
          "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
        const faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: { modelAssetPath, delegate: "CPU" },
          runningMode: "VIDEO",
          numFaces: 1,
        });

        if (cancelled) {
          faceLandmarker.close();
          return;
        }
        landmarkerRef.current = faceLandmarker;

        setStatus("requesting-camera");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 540 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;

        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();

        setStatus("running");
        renderLoop();
      } catch (err) {
        if (cancelled) return;
        console.error("Eyewear try-on failed to start", err);
        setStatus("error");
        if (err instanceof DOMException && err.name === "NotAllowedError") {
          setErrorMessage("Accès à la webcam refusé. Autorisez la caméra dans votre navigateur pour essayer les lunettes.");
        } else if (err instanceof DOMException && err.name === "NotFoundError") {
          setErrorMessage("Aucune webcam détectée sur cet appareil.");
        } else if (typeof window !== "undefined" && !window.isSecureContext) {
          setErrorMessage("L'essayage virtuel nécessite une connexion sécurisée (https).");
        } else {
          const detail = err instanceof Error ? err.message : String(err);
          setErrorMessage(`Impossible de démarrer l'essayage virtuel sur cet appareil (${detail}).`);
        }
      }
    }

    function renderLoop() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const landmarker = landmarkerRef.current;
      if (!video || !canvas || !landmarker || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(renderLoop);
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        rafRef.current = requestAnimationFrame(renderLoop);
        return;
      }

      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      try {
        const result = landmarker.detectForVideo(video, performance.now());
        const landmarks = result?.faceLandmarks?.[0];
        const glassesImg = glassesImageRef.current;

        if (landmarks && glassesImg && glassesImg.complete && glassesImg.naturalWidth > 0) {
          const left = landmarks[LEFT_EYE_OUTER];
          const right = landmarks[RIGHT_EYE_OUTER];
          const nose = landmarks[NOSE_BRIDGE];

          const leftPx = { x: left.x * canvas.width, y: left.y * canvas.height };
          const rightPx = { x: right.x * canvas.width, y: right.y * canvas.height };
          const nosePx = { x: nose.x * canvas.width, y: nose.y * canvas.height };

          const dx = rightPx.x - leftPx.x;
          const dy = rightPx.y - leftPx.y;
          const eyeDistance = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx);

          const glassesWidth = eyeDistance * GLASSES_WIDTH_FACTOR;
          const glassesHeight = glassesWidth * (glassesImg.naturalHeight / glassesImg.naturalWidth);

          const eyeMidX = (leftPx.x + rightPx.x) / 2;
          const eyeMidY = (leftPx.y + rightPx.y) / 2;
          // Blend the eye-corner midpoint with the nose bridge so the frame
          // sits slightly lower, closer to where glasses actually rest.
          const centerX = eyeMidX * 0.5 + nosePx.x * 0.5;
          const centerY = eyeMidY * 0.45 + nosePx.y * 0.55;

          ctx.save();
          ctx.translate(centerX, centerY);
          ctx.rotate(angle);
          ctx.drawImage(glassesImg, -glassesWidth / 2, -glassesHeight / 2, glassesWidth, glassesHeight);
          ctx.restore();
        }
      } catch (frameError) {
        // A runtime error from the WASM detector (e.g. a lost GPU/WebGL
        // context) should stop the loop with a clear message instead of
        // spamming the console on every animation frame.
        console.error("Eyewear try-on: face detection failed mid-stream", frameError);
        setStatus("error");
        const detail = frameError instanceof Error ? frameError.message : String(frameError);
        setErrorMessage(`L'essayage virtuel s'est interrompu (${detail}). Rechargez la page pour réessayer.`);
        return;
      }

      rafRef.current = requestAnimationFrame(renderLoop);
    }

    start();

    return () => {
      cancelled = true;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      landmarkerRef.current?.close?.();
    };
    // Re-running this effect on every product change would restart the
    // camera/model unnecessarily; the glasses image swap is handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Swap the overlaid glasses without restarting the camera or the model.
  useEffect(() => {
    const glassesImage = new Image();
    glassesImage.crossOrigin = "anonymous";
    glassesImage.src = product.imageUrl;
    glassesImageRef.current = glassesImage;
  }, [product.imageUrl]);

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
        <video ref={videoRef} className="hidden" playsInline muted />
        <canvas ref={canvasRef} className="w-full h-full object-contain" style={{ transform: "scaleX(-1)" }} />

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