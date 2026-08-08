"use client";

import { useEffect, useRef } from "react";

/**
 * Interactive 3D badge on a REAL flexible lanyard (Three.js, lazy-loaded).
 *
 * The card hangs from a fixed clip by a verlet-simulated pink string: a chain of
 * points held together by distance constraints under gravity. Grab the card and
 * fling it — the string sags, whips and swings back like an actual lanyard.
 * Flip (button or double-tap) turns the card around to reveal the QR.
 * The card has softened (rounded) corners and its motion is low-pass smoothed so
 * it feels weighty rather than jittery. Auto-fits any aspect.
 */
export default function Card3D({
  front,
  back,
  flipped = false,
  onFlip,
}: {
  front: HTMLCanvasElement;
  back: HTMLCanvasElement;
  flipped?: boolean;
  onFlip?: () => void;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  // live refs so the animation loop always sees the latest values without re-init
  const flippedRef = useRef(flipped);
  flippedRef.current = flipped;
  const onFlipRef = useRef(onFlip);
  onFlipRef.current = onFlip;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let cleanup = () => {};
    let cancelled = false;

    (async () => {
      const THREE = await import("three");
      if (cancelled || !mount) return;
      const width = mount.clientWidth || 380;
      const height = mount.clientHeight || 600;

      const scene = new THREE.Scene();
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
      renderer.setSize(width, height);
      mount.appendChild(renderer.domElement);

      // card size — fit the larger dimension so any aspect reads consistently
      const aspect = front.width / front.height;
      let cw: number;
      let ch: number;
      if (aspect >= 1) {
        cw = 5.4;
        ch = 5.4 / aspect;
      } else {
        ch = 5.2;
        cw = 5.2 * aspect;
      }

      // textures
      const frontTex = new THREE.CanvasTexture(front);
      frontTex.colorSpace = THREE.SRGBColorSpace;
      frontTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      const backTex = new THREE.CanvasTexture(back);
      backTex.colorSpace = THREE.SRGBColorSpace;
      backTex.anisotropy = frontTex.anisotropy;

      const PINK = 0xe6198a;

      // --- fixed clip (pivot) at the top ---
      const pivotX = 0;
      const pivotY = 0;
      const clipMat = new THREE.MeshBasicMaterial({ color: PINK });
      const clip = new THREE.Mesh(
        new THREE.TorusGeometry(0.17, 0.05, 16, 40),
        clipMat,
      );
      clip.position.set(pivotX, pivotY, 0);
      scene.add(clip);

      // --- verlet rope (chain of points, gravity + distance constraints) ---
      const ropeLen = Math.max(1.15, ch * 0.34);
      const N = 18;
      const segLen = ropeLen / N;
      const pts: { x: number; y: number; ox: number; oy: number }[] = [];
      for (let i = 0; i <= N; i++) {
        const y = pivotY - i * segLen;
        pts.push({ x: pivotX, y, ox: pivotX, oy: y });
      }

      const buildTube = () => {
        const curve = new THREE.CatmullRomCurve3(
          pts.map((p) => new THREE.Vector3(p.x, p.y, 0)),
        );
        curve.curveType = "centripetal"; // avoids overshoot -> smooth, stable tube
        return new THREE.TubeGeometry(curve, 32, 0.05, 10, false);
      };
      const ropeMat = new THREE.MeshBasicMaterial({ color: PINK });
      const ropeMesh = new THREE.Mesh(buildTube(), ropeMat);
      scene.add(ropeMesh);

      // small clip that grips the top of the card
      const grip = new THREE.Mesh(
        new THREE.BoxGeometry(0.36, 0.15, 0.14),
        clipMat,
      );
      scene.add(grip);

      // --- card with SOFTENED (rounded) corners ---
      const R = Math.min(cw, ch) * 0.06;
      const cardShape = new THREE.Shape();
      {
        const w = cw;
        const h = ch;
        const r = R;
        const x0 = -w / 2;
        const y0 = -h / 2;
        cardShape.moveTo(x0 + r, y0);
        cardShape.lineTo(x0 + w - r, y0);
        cardShape.quadraticCurveTo(x0 + w, y0, x0 + w, y0 + r);
        cardShape.lineTo(x0 + w, y0 + h - r);
        cardShape.quadraticCurveTo(x0 + w, y0 + h, x0 + w - r, y0 + h);
        cardShape.lineTo(x0 + r, y0 + h);
        cardShape.quadraticCurveTo(x0, y0 + h, x0, y0 + h - r);
        cardShape.lineTo(x0, y0 + r);
        cardShape.quadraticCurveTo(x0, y0, x0 + r, y0);
      }
      const faceGeo = new THREE.ShapeGeometry(cardShape, 24);
      {
        // map the full texture across the rounded shape's bounding box
        const pos = faceGeo.attributes.position;
        const uvs = new Float32Array(pos.count * 2);
        for (let i = 0; i < pos.count; i++) {
          uvs[i * 2] = (pos.getX(i) + cw / 2) / cw;
          uvs[i * 2 + 1] = (pos.getY(i) + ch / 2) / ch;
        }
        faceGeo.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
      }
      const depth = 0.05;
      const bodyGeo = new THREE.ExtrudeGeometry(cardShape, {
        depth,
        bevelEnabled: false,
        curveSegments: 24,
      });

      const hang = new THREE.Group();
      const flip = new THREE.Group();
      const fMat = new THREE.MeshBasicMaterial({ map: frontTex });
      const bMat = new THREE.MeshBasicMaterial({ map: backTex });
      const bodyMat = new THREE.MeshBasicMaterial({ color: 0x0a2a18 });
      const fMesh = new THREE.Mesh(faceGeo, fMat);
      fMesh.position.z = depth / 2 + 0.002;
      const bMesh = new THREE.Mesh(faceGeo, bMat);
      bMesh.rotation.y = Math.PI;
      bMesh.position.z = -(depth / 2 + 0.002);
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.z = -depth / 2;
      flip.add(body, fMesh, bMesh);
      hang.add(flip);
      scene.add(hang);

      // --- camera fit (straight-down rest pose is the tallest case) ---
      const fov = 32;
      const camera = new THREE.PerspectiveCamera(fov, width / height, 0.1, 100);
      const top = pivotY + 0.17 + 0.2;
      const bottom = pivotY - (ropeLen + ch) - 0.12;
      const midY = (top + bottom) / 2;
      const totalH = top - bottom;
      const totalW = cw + 1.3; // room to swing sideways
      const camAspect = width / height;
      const tan = Math.tan((fov * Math.PI) / 180 / 2);
      const dist =
        Math.max(totalH / (2 * tan), totalW / (2 * tan * camAspect)) * 1.03;
      camera.position.set(0, midY, dist);
      camera.lookAt(0, midY, 0);
      // visible half-extents at z=0 — used to keep the card on-screen while dragging
      const worldHalfW = dist * tan * camAspect;
      const worldHalfH = dist * tan;

      // pointer -> world at the z=0 plane
      const dom = renderer.domElement;
      const toWorld = (clientX: number, clientY: number) => {
        const rect = dom.getBoundingClientRect();
        const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
        const ndcY = -(((clientY - rect.top) / rect.height) * 2 - 1);
        const halfH = dist * tan;
        const halfW = halfH * camAspect;
        return { x: ndcX * halfW, y: midY + ndcY * halfH };
      };

      // --- interaction state ---
      let dragging = false;
      let grabDX = 0;
      let grabDY = 0;
      const target = { x: 0, y: 0 };
      let phi = 0;
      let phiV = 0;
      // low-pass smoothed card transform (kills jitter, adds weight)
      let sx = pivotX;
      let sy = pivotY - ropeLen - ch / 2;
      let sang = 0;

      const clamp = (v: number, lo: number, hi: number) =>
        Math.max(lo, Math.min(hi, v));
      const onDown = (e: PointerEvent) => {
        const w = toWorld(e.clientX, e.clientY);
        const end = pts[N];
        grabDX = end.x - w.x;
        grabDY = end.y - w.y;
        target.x = end.x;
        target.y = end.y;
        dragging = true;
      };
      const onMove = (e: PointerEvent) => {
        if (!dragging) return;
        const w = toWorld(e.clientX, e.clientY);
        // keep the card within the frame so it can swing wide but never fly off
        target.x = clamp(w.x + grabDX, -worldHalfW * 0.8, worldHalfW * 0.8);
        target.y = clamp(
          w.y + grabDY,
          midY - worldHalfH * 0.8,
          midY + worldHalfH * 0.55,
        );
      };
      const onUp = () => {
        dragging = false;
      };
      const onDbl = () => onFlipRef.current?.();
      dom.addEventListener("pointerdown", onDown);
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      dom.addEventListener("dblclick", onDbl);

      const GRAV = 0.006;
      const DAMP = 0.99;
      let t = 0;
      let raf = 0;

      const step = () => {
        t += 1;
        const breeze = dragging ? 0 : Math.sin(t * 0.012) * 0.0007;

        // integrate free points (verlet)
        for (let i = 1; i <= N; i++) {
          const p = pts[i];
          const vx = (p.x - p.ox) * DAMP + breeze;
          const vy = (p.y - p.oy) * DAMP;
          p.ox = p.x;
          p.oy = p.y;
          p.x += vx;
          p.y += vy - GRAV;
        }
        // dragged end follows the pointer; keep old-pos so release flings it
        if (dragging) {
          const p = pts[N];
          p.ox = p.x;
          p.oy = p.y;
          p.x = target.x;
          p.y = target.y;
        }

        // satisfy distance constraints (pin the clip, and the end while dragging)
        for (let k = 0; k < 24; k++) {
          pts[0].x = pivotX;
          pts[0].y = pivotY;
          if (dragging) {
            pts[N].x = target.x;
            pts[N].y = target.y;
          }
          for (let i = 0; i < N; i++) {
            const a = pts[i];
            const b = pts[i + 1];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const d = Math.hypot(dx, dy) || 1e-6;
            const diff = (d - segLen) / d;
            const aPin = i === 0 || (dragging && i === N);
            const bPin = dragging && i + 1 === N;
            if (aPin && bPin) continue;
            if (!aPin && !bPin) {
              a.x += dx * 0.5 * diff;
              a.y += dy * 0.5 * diff;
              b.x -= dx * 0.5 * diff;
              b.y -= dy * 0.5 * diff;
            } else if (aPin) {
              b.x -= dx * diff;
              b.y -= dy * diff;
            } else {
              a.x += dx * diff;
              a.y += dy * diff;
            }
          }
        }

        // rebuild the rope tube from the solved points
        ropeMesh.geometry.dispose();
        ropeMesh.geometry = buildTube();

        // target card transform from the rope end + last segment
        const end = pts[N];
        const prev = pts[N - 1];
        let dx = end.x - prev.x;
        let dy = end.y - prev.y;
        const len = Math.hypot(dx, dy) || 1e-6;
        dx /= len;
        dy /= len;
        const tx = end.x + dx * (ch / 2);
        const ty = end.y + dy * (ch / 2);
        const ta = Math.atan2(dy, dx) + Math.PI / 2;
        // low-pass smoothing (shortest-arc for the angle)
        sx += (tx - sx) * 0.22;
        sy += (ty - sy) * 0.22;
        let da = ta - sang;
        while (da > Math.PI) da -= Math.PI * 2;
        while (da < -Math.PI) da += Math.PI * 2;
        sang += da * 0.18;
        hang.position.set(sx, sy, 0);
        hang.rotation.z = sang;
        grip.position.set(end.x, end.y, 0.04);
        grip.rotation.z = sang;

        // flip spring
        const phiTarget = flippedRef.current ? Math.PI : 0;
        phiV += (phiTarget - phi) * 0.16;
        phiV *= 0.7;
        phi += phiV;
        flip.rotation.y = phi;

        renderer.render(scene, camera);
        raf = requestAnimationFrame(step);
      };
      step();

      const onResize = () => {
        const w2 = mount.clientWidth || width;
        const h2 = mount.clientHeight || height;
        camera.aspect = w2 / h2;
        camera.updateProjectionMatrix();
        renderer.setSize(w2, h2);
      };
      window.addEventListener("resize", onResize);

      cleanup = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("resize", onResize);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        dom.removeEventListener("pointerdown", onDown);
        dom.removeEventListener("dblclick", onDbl);
        frontTex.dispose();
        backTex.dispose();
        faceGeo.dispose();
        bodyGeo.dispose();
        ropeMesh.geometry.dispose();
        clip.geometry.dispose();
        grip.geometry.dispose();
        fMat.dispose();
        bMat.dispose();
        bodyMat.dispose();
        ropeMat.dispose();
        clipMat.dispose();
        renderer.dispose();
        if (dom.parentNode === mount) mount.removeChild(dom);
      };
    })();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [front, back]);

  return (
    <div
      ref={mountRef}
      data-card3d
      className="h-[600px] w-full max-w-[480px] cursor-grab touch-none select-none active:cursor-grabbing"
    />
  );
}
