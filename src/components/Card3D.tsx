"use client";

import { useEffect, useRef } from "react";

/**
 * Interactive 3D flip card (Three.js, lazy-loaded). Front = the generated graphic,
 * back = the QR/details. Drag/flick to flip.
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
      const height = mount.clientHeight || 520;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 100);
      camera.position.z = 9;
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
      renderer.setSize(width, height);
      mount.appendChild(renderer.domElement);

      const aspect = front.width / front.height;
      const ch = 3.6;
      const cw = ch * aspect;

      const frontTex = new THREE.CanvasTexture(front);
      frontTex.colorSpace = THREE.SRGBColorSpace;
      frontTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      const backTex = new THREE.CanvasTexture(back);
      backTex.colorSpace = THREE.SRGBColorSpace;
      backTex.anisotropy = frontTex.anisotropy;

      const geo = new THREE.PlaneGeometry(cw, ch);
      const group = new THREE.Group();
      const fMesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: frontTex }));
      fMesh.position.z = 0.05;
      const bMesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: backTex }));
      bMesh.rotation.y = Math.PI;
      bMesh.position.z = -0.05;
      const edge = new THREE.Mesh(
        new THREE.BoxGeometry(cw, ch, 0.06),
        new THREE.MeshBasicMaterial({ color: 0x0a2a18 }),
      );
      group.add(edge, fMesh, bMesh);

      // pink lanyard cord + loop coming out of the top of the card
      const cordMat = new THREE.MeshBasicMaterial({ color: 0xe6198a });
      const cord = new THREE.Mesh(
        new THREE.CylinderGeometry(0.035, 0.035, 0.9, 10),
        cordMat,
      );
      cord.position.set(0, ch / 2 + 0.45, 0);
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.2, 0.045, 10, 28),
        cordMat,
      );
      ring.position.set(0, ch / 2 + 0.9, 0);
      group.add(cord, ring);
      scene.add(group);

      let curY = 0;
      let targetY = 0;
      let velY = 0;
      let tiltX = 0;
      let targetTilt = 0;
      let dragging = false;
      let lastX = 0;
      let t = 0;
      const dom = renderer.domElement;

      const onDown = (e: PointerEvent) => {
        dragging = true;
        lastX = e.clientX;
        velY = 0;
      };
      const onMove = (e: PointerEvent) => {
        const rect = dom.getBoundingClientRect();
        targetTilt = ((e.clientY - rect.top) / rect.height - 0.5) * -0.35;
        if (dragging) {
          const dx = e.clientX - lastX;
          lastX = e.clientX;
          curY += dx * 0.01;
          velY = dx * 0.01;
        }
      };
      const onUp = () => {
        if (!dragging) return;
        dragging = false;
        targetY = Math.round((curY + velY * 4) / Math.PI) * Math.PI;
      };
      dom.addEventListener("pointerdown", onDown);
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);

      let raf = 0;
      const loop = () => {
        t += 0.016;
        if (!dragging) curY += (targetY - curY) * 0.12;
        tiltX += (targetTilt - tiltX) * 0.1;
        group.rotation.y = curY + (dragging ? 0 : Math.sin(t * 0.5) * 0.32);
        group.rotation.x = -0.05 + tiltX + Math.sin(t * 0.8) * 0.03;
        group.position.y = -0.2 + Math.sin(t * 1.1) * 0.05;
        renderer.render(scene, camera);
        raf = requestAnimationFrame(loop);
      };
      loop();

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
        frontTex.dispose();
        backTex.dispose();
        geo.dispose();
        cord.geometry.dispose();
        ring.geometry.dispose();
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
      className="h-[520px] w-full max-w-[380px] cursor-grab touch-none select-none active:cursor-grabbing"
    />
  );
}
