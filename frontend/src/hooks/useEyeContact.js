import { useEffect, useRef, useState } from 'react';

// MediaPipe iris landmark indices
const LEFT_IRIS  = [468, 469, 470, 471, 472];
const RIGHT_IRIS = [473, 474, 475, 476, 477];
const FACE_OUTLINE = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
  397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132,
  93, 234, 127, 162, 21, 54, 103, 67, 109];

// ─── Module-level singleton ───────────────────────────────────────────────────
// FaceMesh WASM writes to a virtual filesystem. If the component mounts twice
// (React Strict Mode / HMR) and we create a second instance, it crashes with
// "File exists". The singleton ensures initialization happens exactly once.
let faceMeshSingleton = null;

function getFaceMesh(onResults) {
  if (faceMeshSingleton) {
    // Already initialized — just swap the results callback
    faceMeshSingleton.onResults(onResults);
    return faceMeshSingleton;
  }

  if (!window.FaceMesh) return null;

  const fm = new window.FaceMesh({
    locateFile: (file) =>
      `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
  });

  fm.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,        // enables iris landmarks 468–477
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });

  fm.onResults(onResults);

  fm.initialize().catch((err) => {
    // Swallow the harmless "File exists" error from double-mount
    if (!String(err).includes('File exists')) {
      console.warn('FaceMesh init error:', err);
    }
  });

  faceMeshSingleton = fm;
  return fm;
}

// ─── Eye contact geometry ─────────────────────────────────────────────────────
function isMakingEyeContact(landmarks) {
  const xs = FACE_OUTLINE.map(i => landmarks[i].x);
  const ys = FACE_OUTLINE.map(i => landmarks[i].y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const faceW = maxX - minX, faceH = maxY - minY;

  // Center 60% horizontally, upper 60% vertically (where eyes live)
  const zoneX1 = minX + faceW * 0.2, zoneX2 = maxX - faceW * 0.2;
  const zoneY1 = minY + faceH * 0.1, zoneY2 = minY + faceH * 0.6;

  const avg = (indices, key) =>
    indices.reduce((s, i) => s + landmarks[i][key], 0) / indices.length;

  const lx = avg(LEFT_IRIS, 'x'),  ly = avg(LEFT_IRIS, 'y');
  const rx = avg(RIGHT_IRIS, 'x'), ry = avg(RIGHT_IRIS, 'y');

  const inZone = (x, y) => x >= zoneX1 && x <= zoneX2 && y >= zoneY1 && y <= zoneY2;
  return inZone(lx, ly) && inZone(rx, ry);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useEyeContact(videoRef) {
  const [eyeContactPercent, setEyeContactPercent] = useState(0);
  const [eyeContactEvents, setEyeContactEvents]   = useState([]);

  const contactFramesRef = useRef(0);
  const totalFramesRef   = useRef(0);
  const frameCountRef    = useRef(0);
  const startTimeRef     = useRef(Date.now());
  const intervalRef      = useRef(null);
  const activeRef        = useRef(false);

  useEffect(() => {
    activeRef.current  = true;
    startTimeRef.current = Date.now();

    const handleResults = (results) => {
      if (!activeRef.current) return;
      totalFramesRef.current++;

      if (results.multiFaceLandmarks?.length > 0) {
        const lm = results.multiFaceLandmarks[0];
        if (lm.length > 477) {
          const contact = isMakingEyeContact(lm);
          if (contact) contactFramesRef.current++;

          const elapsed = (Date.now() - startTimeRef.current) / 1000;
          if (frameCountRef.current % 4 === 0) {
            setEyeContactEvents(prev => [
              ...prev,
              { timestamp: Math.round(elapsed), isContact: contact },
            ]);
          }
        }
      }

      frameCountRef.current++;
      if (frameCountRef.current % 10 === 0 && totalFramesRef.current > 0) {
        setEyeContactPercent(
          Math.round((contactFramesRef.current / totalFramesRef.current) * 100)
        );
      }
    };

    const fm = getFaceMesh(handleResults);
    if (!fm) return; // CDN scripts not loaded yet

    // Poll at 2 fps
    intervalRef.current = setInterval(async () => {
      const video = videoRef.current;
      if (!video || video.readyState < 2) return;
      try {
        await fm.send({ image: video });
      } catch (e) {
        if (!String(e).includes('File exists')) {
          console.warn('FaceMesh send error:', e);
        }
      }
    }, 500);

    return () => {
      activeRef.current = false;
      clearInterval(intervalRef.current);
      // Do NOT destroy the singleton — keep it alive for the session lifetime
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const getStats = () => ({
    eyeContactPercent,
    eyeContactEvents,
    totalFrames: totalFramesRef.current,
    contactFrames: contactFramesRef.current,
  });

  return { eyeContactPercent, eyeContactEvents, getStats };
}
