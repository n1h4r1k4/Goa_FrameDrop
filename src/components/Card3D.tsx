"use client";

import { useEffect, useRef } from "react";

/**
 * Interactive 3D badge on a lanyard (Three.js, lazy-loaded). The card hangs from a
 * fixed pivot by a pink cord; drag it to swing it around like a real lanyard (damped
 * pendulum), double-tap/click to flip it and reveal the QR on the back. Auto-fits any
 * card aspect (portrait ticket, landscape banner, square).
 */
export default function Card3D({
  front,
  back,
}: {
  front: HTMLCanvasElement;
  back: HTMLCanvasElement;
}) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let cleanup = () => {};
    let cancelled = false;

    (async () => {
      const THREE = await import("three");
      if (cancelled || !mount) return;
      const width = mount.clientWidth || 360;
      const height = mount.clientHeight || 540;

      const scene = new THREE.Scene();
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
      renderer.setSize(width, height);
      mount.appendChild(renderer.domElement);

      // card size — fit the larger dimension so any aspect looks consistent
      const aspect = front.width / front.height;
      let cw: number;
      let ch: number;
      if (aspect >= 1) {
        cw = 5;
        ch = 5 / aspect;
      } else {
        ch = 4.8;
        cw = 4.8 * aspect;
      }
      const cordLen = 0.95;
      const loopR = 0.22;

      const frontTex = new THREE.CanvasTexture(front);
      frontTex.colorSpace = THREE.SRGBColorSpace;
      frontTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      const backTex = new THREE.CanvasTexture(back);
      backTex.colorSpace = THREE.SRGBColorSpace;
      backTex.anisotropy = frontTex.anisotropy;

      // hierarchy: swing (pivot) -> cord + loop + flip(card)
      const cordMat = new THREE.MeshBasicMaterial({ color: 0xe6198a });
      const loop = new THREE.Mesh(new THREE.TorusGeometry(loopR, 0.05, 14, 36), cordMat);
      const cord = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, cordLen, 14),
        cordMat,
      );
      cord.position.y = -cordLen / 2;

      const flip = new THREE.Group();
      flip.position.y = -cordLen - ch / 2;
      const geo = new THREE.PlaneGeometry(cw, ch);
      const fMesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: frontTex }));
      fMesh.position.z = 0.05;
      const bMesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: backTex }));
      bMesh.rotation.y = Math.PI;
      bMesh.position.z = -0.05;
      const edge = new THREE.Mesh(
        new THREE.BoxGeometry(cw, ch, 0.06),
        new THREE.MeshBasicMaterial({ color: 0x0a2a18 }),
      );
      flip.add(edge, fMesh, bMesh);

      const swing = new THREE.Group();
      swing.add(loop, cord, flip);
      const pivotY = ch / 2 + cordLen;
      swing.position.set(0, pivotY, 0);
      scene.add(swing);

      // camera fit (handles portrait + landscape)
      const fov = 32;
      const camera = new THREE.PerspectiveCamera(fov, width / height, 0.1, 100);
      const contentTop = pivotY + loopR + 0.1;
      const contentBottom = pivotY - (cordLen + ch);
      const midY = (contentTop + contentBottom) / 2;
      const totalH = contentTop - contentBottom;
      const totalW = cw + 1.6;
      const camAspect = width / height;
      const tan = Math.tan((fov * Math.PI) / 180 / 2);
      const dist = Math.max(totalH / (2 * tan), totalW / (2 * tan * camAspect)) * 1.12;
      camera.position.set(0, midY, dist);
      camera.lookAt(0, midY, 0);

      // physics state
      let theta = 0;
      let omega = 0;
      let phi = 0;
      let phiV = 0;
      let phiTarget = 0;
      let dragging = false;
      let lastX = 0;
      let t = 0;
      const dom = renderer.domElement;

      const onDown = (e: PointerEvent) => {
        dragging = true;
        lastX = e.clientX;
        omega = 0;
      };
      const onMove = (e: PointerEvent) => {
        if (!dragging) return;
        const dx = e.clientX - lastX;
        lastX = e.clientX;
        theta = Math.max(-1.15, Math.min(1.15, theta + dx * 0.006));
        omega = dx * 0.006;
      };
      const onUp = () => {
        dragging = false;
      };
      const onFlip = () => {
        phiTarget = phiTarget === 0 ? Math.PI : 0;
      };
      dom.addEventListener("pointerdown", onDown);
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      dom.addEventListener("dblclick", onFlip);

      let raf = 0;
      const render = () => {
        t += 1;
        if (!dragging) {
          const breeze = Math.sin(t * 0.02) * 0.00055;
          omega += -0.02 * Math.sin(theta) - 0.03 * omega + breeze;
          theta += omega;
        }
        phiV += (phiTarget - phi) * 0.14;
        phiV *= 0.72;
        phi += phiV;
        swing.rotation.z = theta;
        flip.rotation.y = phi;
        renderer.render(scene, camera);
        raf = requestAnimationFrame(render);
      };
      render();

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
        dom.removeEventListener("dblclick", onFlip);
        frontTex.dispose();
        backTex.dispose();
        geo.dispose();
        cord.geometry.dispose();
        loop.geometry.dispose();
        edge.geometry.dispose();
        cordMat.dispose();
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
      className="h-[540px] w-full max-w-[420px] cursor-grab touch-none select-none active:cursor-grabbing"
    />
  );
}
