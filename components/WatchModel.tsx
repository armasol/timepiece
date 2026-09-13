'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
    if (Array.isArray(material)) material.forEach((m) => m.dispose());
    else material?.dispose();
  });
}

function makeMetal(color: number, roughness = 0.18) {
  return new THREE.MeshStandardMaterial({
    color,
    metalness: 1,
    roughness,
    envMapIntensity: 1.15,
  });
}

function makeWatch() {
  const root = new THREE.Group();
  root.rotation.set(0.16, -0.62, -0.02);

  const steel = makeMetal(0xd8d5cc, 0.17);
  const steelDark = makeMetal(0x77766f, 0.23);
  const bezelBlack = new THREE.MeshStandardMaterial({
    color: 0x080a08,
    metalness: 0.78,
    roughness: 0.25,
  });
  const dialMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x090b09,
    metalness: 0.34,
    roughness: 0.3,
    clearcoat: 0.72,
    clearcoatRoughness: 0.18,
  });
  const lume = new THREE.MeshStandardMaterial({
    color: 0xf2eee2,
    emissive: 0x282719,
    emissiveIntensity: 0.12,
    roughness: 0.32,
  });
  const green = new THREE.MeshStandardMaterial({
    color: 0xd5fd51,
    emissive: 0x77951d,
    emissiveIntensity: 0.82,
    metalness: 0.22,
    roughness: 0.24,
  });

  // Main case: rounded metal body facing the camera.
  const caseMesh = new THREE.Mesh(new THREE.CylinderGeometry(1.64, 1.64, 0.3, 128), steel);
  caseMesh.rotation.x = Math.PI / 2;
  root.add(caseMesh);

  const caseInset = new THREE.Mesh(new THREE.CylinderGeometry(1.47, 1.47, 0.34, 128), steelDark);
  caseInset.rotation.x = Math.PI / 2;
  root.add(caseInset);

  // Black bezel and polished outer ring.
  const outerRing = new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.105, 28, 160), steel);
  outerRing.position.z = 0.18;
  root.add(outerRing);

  const blackRing = new THREE.Mesh(new THREE.TorusGeometry(1.39, 0.095, 28, 160), bezelBlack);
  blackRing.position.z = 0.205;
  root.add(blackRing);

  // Dial, crystal, and indices.
  const dial = new THREE.Mesh(new THREE.CylinderGeometry(1.27, 1.27, 0.08, 128), dialMaterial);
  dial.rotation.x = Math.PI / 2;
  dial.position.z = 0.205;
  root.add(dial);

  const crystal = new THREE.Mesh(
    new THREE.CylinderGeometry(1.245, 1.245, 0.035, 128),
    new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.12,
      transmission: 0.6,
      roughness: 0.03,
      metalness: 0,
      clearcoat: 1,
    }),
  );
  crystal.rotation.x = Math.PI / 2;
  crystal.position.z = 0.29;
  root.add(crystal);


  // Fine polished inner ring adds a sharper transition between bezel and dial.
  const chapterRing = new THREE.Mesh(new THREE.TorusGeometry(1.255, 0.018, 16, 128), steel);
  chapterRing.position.z = 0.342;
  root.add(chapterRing);

  // Twelve-o'clock triangle and bezel pip.
  const twelve = new THREE.Mesh(new THREE.ConeGeometry(0.105, 0.20, 3), lume);
  twelve.position.set(0, 1.03, 0.355);
  twelve.rotation.z = Math.PI;
  root.add(twelve);
  const bezelPip = new THREE.Mesh(new THREE.SphereGeometry(0.055, 20, 20), green);
  bezelPip.position.set(0, 1.455, 0.345);
  root.add(bezelPip);

  // Date aperture at three o'clock. It is intentionally generic rather than branded.
  const dateFrame = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.27, 0.038), steel);
  dateFrame.position.set(0.72, 0, 0.356);
  root.add(dateFrame);
  const dateFace = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.21, 0.044), new THREE.MeshStandardMaterial({ color: 0xeee9dc, roughness: 0.5 }));
  dateFace.position.set(0.72, 0, 0.379);
  root.add(dateFace);
  const dateMark = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.035, 0.016), new THREE.MeshStandardMaterial({ color: 0x151715, roughness: 0.7 }));
  dateMark.position.set(0.72, 0, 0.405);
  root.add(dateMark);

  // Minimal dial signatures rendered as physical marks to keep the model self-contained.
  [0.28, 0.18, 0.11].forEach((width, index) => {
    const mark = new THREE.Mesh(new THREE.BoxGeometry(width, 0.022, 0.012), index === 0 ? steel : lume);
    mark.position.set(0, 0.52 - index * 0.08, 0.355);
    root.add(mark);
  });

  for (let i = 0; i < 60; i++) {
    const major = i % 5 === 0;
    const a = (i / 60) * Math.PI * 2;
    const r = major ? 1.02 : 1.09;
    const marker = new THREE.Mesh(
      new THREE.BoxGeometry(major ? 0.065 : 0.018, major ? 0.22 : 0.08, major ? 0.045 : 0.025),
      major ? lume : steel,
    );
    marker.position.set(Math.sin(a) * r, Math.cos(a) * r, 0.33);
    marker.rotation.z = -a;
    root.add(marker);
  }

  // Bezel minute markers.
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const marker = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.14, 0.02), i % 6 === 0 ? green : lume);
    marker.position.set(Math.sin(a) * 1.455, Math.cos(a) * 1.455, 0.31);
    marker.rotation.z = -a;
    root.add(marker);
  }

  // Hands — returned as userData references for animation.
  const hourPivot = new THREE.Group();
  hourPivot.position.z = 0.38;
  hourPivot.rotation.z = -0.88;
  const hourHand = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.58, 0.055), steel);
  hourHand.position.y = 0.24;
  hourPivot.add(hourHand);
  root.add(hourPivot);

  const minutePivot = new THREE.Group();
  minutePivot.position.z = 0.405;
  minutePivot.rotation.z = 0.36;
  const minuteHand = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.86, 0.045), lume);
  minuteHand.position.y = 0.34;
  minutePivot.add(minuteHand);
  root.add(minutePivot);

  const secondPivot = new THREE.Group();
  secondPivot.position.z = 0.435;
  const secondHand = new THREE.Mesh(new THREE.BoxGeometry(0.022, 1.08, 0.022), green);
  secondHand.position.y = 0.44;
  secondPivot.add(secondHand);
  root.add(secondPivot);

  const pin = new THREE.Mesh(new THREE.SphereGeometry(0.085, 24, 24), green);
  pin.position.z = 0.46;
  root.add(pin);

  // Crown and crown guards.
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.25, 32), steel);
  crown.rotation.z = Math.PI / 2;
  crown.position.set(1.77, 0, 0.02);
  root.add(crown);
  for (let i = -3; i <= 3; i++) {
    const groove = new THREE.Mesh(new THREE.TorusGeometry(0.192, 0.009, 8, 28), steelDark);
    groove.rotation.y = Math.PI / 2;
    groove.position.set(1.77 + i * 0.026, 0, 0.02);
    root.add(groove);
  }
  [-0.28, 0.28].forEach((y) => {
    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.25, 0.24), steel);
    guard.position.set(1.58, y, 0);
    guard.rotation.z = y > 0 ? -0.22 : 0.22;
    root.add(guard);
  });

  // Bracelet links with alternating polish.
  [-1, 1].forEach((side) => {
    for (let i = 0; i < 8; i++) {
      const width = Math.max(1.28, 1.92 - i * 0.075);
      const y = side * (1.77 + i * 0.275);
      const link = new THREE.Mesh(
        new THREE.BoxGeometry(width, 0.22, 0.28),
        i % 2 === 0 ? steel : steelDark,
      );
      link.position.set(0, y, -0.04 - i * 0.01);
      link.rotation.x = side * i * 0.012;
      root.add(link);

      const centerLink = new THREE.Mesh(new THREE.BoxGeometry(width * 0.34, 0.225, 0.3), steel);
      centerLink.position.set(0, y, 0.01 - i * 0.01);
      root.add(centerLink);
    }
  });

  // Lugs connect the bracelet to the case.
  [-1, 1].forEach((side) => {
    [-0.62, 0.62].forEach((x) => {
      const lug = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.55, 0.3), steel);
      lug.position.set(x, side * 1.58, -0.02);
      lug.rotation.z = side * x * -0.12;
      root.add(lug);
    });
  });

  root.userData.secondPivot = secondPivot;
  root.userData.minutePivot = minutePivot;
  return root;
}

export function WatchCanvas({ progress = 0 }: { progress?: number }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(progress);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0, 6.3);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    mount.appendChild(renderer.domElement);

    const watch = makeWatch();
    scene.add(watch);

    // Invisible floor catches a premium soft shadow.
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 10),
      new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.26 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2.38;
    floor.receiveShadow = true;
    scene.add(floor);

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    watch.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });

    scene.add(new THREE.HemisphereLight(0xf7f2e4, 0x050605, 1.48));

    const key = new THREE.SpotLight(0xffffff, 105, 20, 0.34, 0.9, 1.5);
    key.position.set(4, 6, 7);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    scene.add(key);

    const rim = new THREE.PointLight(0xd5fd51, 22, 12, 2);
    rim.position.set(-4.2, -1.4, 4.2);
    scene.add(rim);

    const fill = new THREE.PointLight(0xd8dfef, 7, 14, 2);
    fill.position.set(3.8, -2.5, 2.5);
    scene.add(fill);

    let pointerX = 0;
    let pointerY = 0;
    let targetPointerX = 0;
    let targetPointerY = 0;
    let frame = 0;
    let disposed = false;

    const onPointerMove = (event: PointerEvent) => {
      const rect = mount.getBoundingClientRect();
      targetPointerX = ((event.clientX - rect.left) / Math.max(rect.width, 1) - 0.5) * 2;
      targetPointerY = ((event.clientY - rect.top) / Math.max(rect.height, 1) - 0.5) * 2;
    };
    mount.addEventListener('pointermove', onPointerMove, { passive: true });

    const resize = () => {
      const width = Math.max(mount.clientWidth, 1);
      const height = Math.max(mount.clientHeight, 1);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();

    const clock = new THREE.Clock();
    const animate = () => {
      if (disposed) return;
      const elapsed = clock.getElapsedTime();
      const p = THREE.MathUtils.clamp(progressRef.current, 0, 1);

      pointerX += (targetPointerX - pointerX) * 0.045;
      pointerY += (targetPointerY - pointerY) * 0.045;

      watch.rotation.y = -0.72 + p * 1.22 + pointerX * 0.08 + Math.sin(elapsed * 0.44) * 0.035;
      watch.rotation.x = 0.22 - p * 0.15 - pointerY * 0.045;
      watch.rotation.z = -0.018 + pointerX * 0.012;
      watch.position.y = -0.42 + p * 0.32 + Math.sin(elapsed * 0.7) * 0.035;
      watch.position.x = pointerX * 0.06;
      const s = 1.02 + p * 0.22;
      watch.scale.setScalar(s);

      // 8 beats/sec gives the seconds hand a mechanical sweep instead of a quartz glide.
      const mechanicalSecond = Math.floor(elapsed * 8) / 8;
      const secondPivot = watch.userData.secondPivot as THREE.Group;
      const minutePivot = watch.userData.minutePivot as THREE.Group;
      secondPivot.rotation.z = -mechanicalSecond * (Math.PI / 30);
      minutePivot.rotation.z = 0.36 - elapsed * (Math.PI / 1800);

      camera.position.z = 6.3 - p * 0.38;
      camera.position.x = pointerX * 0.08;
      camera.lookAt(0, -0.05, 0);

      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      mount.removeEventListener('pointermove', onPointerMove);
      disposeObject(watch);
      floor.geometry.dispose();
      (floor.material as THREE.Material).dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      if (renderer.domElement.parentElement === mount) mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="watch-webgl" aria-label="Interactive 3D luxury watch" />;
}
