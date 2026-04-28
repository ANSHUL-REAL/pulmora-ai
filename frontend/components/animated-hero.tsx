"use client";

import AnalysisConsole from "@/components/analysis-console";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { Canvas, useFrame } from "@react-three/fiber";
import { motion, useAnimation } from "framer-motion";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

function FluidBlob() {
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const mouse = useRef(new THREE.Vector2(0, 0));

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      mouse.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uMouse: { value: new THREE.Vector2(0, 0) },
          uColorA: { value: new THREE.Color("#7adcc4") },
          uColorB: { value: new THREE.Color("#214a45") }
        },
        vertexShader: `
          uniform float uTime;
          uniform vec2 uMouse;
          varying vec3 vNormal;

          vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
          vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
          vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
          vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
          float snoise(vec3 v) {
            const vec2 C = vec2(1.0/6.0, 1.0/3.0);
            const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
            vec3 i = floor(v + dot(v, C.yyy));
            vec3 x0 = v - i + dot(i, C.xxx);
            vec3 g = step(x0.yzx, x0.xyz);
            vec3 l = 1.0 - g;
            vec3 i1 = min(g.xyz, l.zxy);
            vec3 i2 = max(g.xyz, l.zxy);
            vec3 x1 = x0 - i1 + C.xxx;
            vec3 x2 = x0 - i2 + C.yyy;
            vec3 x3 = x0 - D.yyy;
            i = mod289(i);
            vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
              + i.y + vec4(0.0, i1.y, i2.y, 1.0))
              + i.x + vec4(0.0, i1.x, i2.x, 1.0));
            float n_ = 0.142857142857;
            vec3 ns = n_ * D.wyz - D.xzx;
            vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
            vec4 x_ = floor(j * ns.z);
            vec4 y_ = floor(j - 7.0 * x_);
            vec4 x = x_ * ns.x + ns.yyyy;
            vec4 y = y_ * ns.x + ns.yyyy;
            vec4 h = 1.0 - abs(x) - abs(y);
            vec4 b0 = vec4(x.xy, y.xy);
            vec4 b1 = vec4(x.zw, y.zw);
            vec4 s0 = floor(b0)*2.0 + 1.0;
            vec4 s1 = floor(b1)*2.0 + 1.0;
            vec4 sh = -step(h, vec4(0.0));
            vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
            vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
            vec3 p0 = vec3(a0.xy,h.x);
            vec3 p1 = vec3(a0.zw,h.y);
            vec3 p2 = vec3(a1.xy,h.z);
            vec3 p3 = vec3(a1.zw,h.w);
            vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
            p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
            vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
            m = m * m;
            return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
          }

          void main() {
            vNormal = normalize(normalMatrix * normal);
            float mouseDist = distance(position.xy, uMouse * 1.65);
            float displacement = snoise(position * 2.4 + uTime * 0.22) * 0.28;
            displacement -= smoothstep(0.0, 1.45, mouseDist) * 0.34;
            vec3 newPosition = position + normal * displacement;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 uColorA;
          uniform vec3 uColorB;
          varying vec3 vNormal;

          void main() {
            float fresnel = pow(1.0 + dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
            vec3 color = mix(uColorA, uColorB, vNormal.y * 0.5 + 0.5);
            gl_FragColor = vec4(color + fresnel * 0.12, 0.96);
          }
        `,
        transparent: true
      }),
    []
  );

  useFrame((state) => {
    if (!materialRef.current) {
      return;
    }

    materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
    const nextMouse = materialRef.current.uniforms.uMouse.value as THREE.Vector2;
    nextMouse.lerp(mouse.current, 0.05);
  });

  return (
    <mesh rotation={[0.22, 0.28, -0.08]}>
      <icosahedronGeometry args={[1.52, 64]} />
      <primitive object={material} ref={materialRef} attach="material" />
    </mesh>
  );
}

function FluidHeroScene() {
  return (
    <Canvas camera={{ position: [0, 0, 4], fov: 48 }} dpr={[1, 1.8]}>
      <ambientLight intensity={0.7} />
      <directionalLight position={[2, 2, 4]} intensity={1.05} color="#9cebd6" />
      <directionalLight position={[-2, -1, 2]} intensity={0.45} color="#dffff4" />
      <Suspense fallback={null}>
        <FluidBlob />
        <EffectComposer>
          <Bloom luminanceThreshold={0.24} luminanceSmoothing={0.85} intensity={0.8} />
        </EffectComposer>
      </Suspense>
    </Canvas>
  );
}

export default function AnimatedHero() {
  const textControls = useAnimation();
  const contentControls = useAnimation();
  const headline = "Pulmora AI";

  useEffect(() => {
    textControls.start((index) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: index * 0.05 + 0.3,
        duration: 0.85
      }
    }));

    contentControls.start({
      opacity: 1,
      y: 0,
      transition: { delay: 0.95, duration: 0.7 }
    });
  }, [contentControls, textControls]);

  return (
    <section className="hero-shell">
      <div className="hero-content">
        <div className="hero-copy">
          <div className="hero-fluid-wrap" aria-hidden="true">
            <FluidHeroScene />
          </div>
          <span className="eyebrow">Educational Chest Imaging Intelligence</span>
          <h1 className="hero-fluid-title">
            {headline.split("").map((char, index) => (
              <motion.span
                key={`${char}-${index}`}
                custom={index}
                initial={{ opacity: 0, y: 34 }}
                animate={textControls}
                style={{ display: "inline-block" }}
              >
                {char === " " ? "\u00A0" : char}
              </motion.span>
            ))}
          </h1>
          <motion.p initial={{ opacity: 0, y: 18 }} animate={contentControls}>
            Pulmora AI transforms chest imaging into an interpretable AI
            experience. Analyze X-ray images using a deep learning model,
            evaluate prediction confidence, and explore Grad-CAM visualizations
            within a clean, anatomy-inspired interface.
          </motion.p>
          <motion.p
            className="hero-tagline"
            initial={{ opacity: 0, y: 18 }}
            animate={contentControls}
          >
            See beyond. Learn deeper. Inspire care.
          </motion.p>
          <motion.div
            className="hero-points"
            initial={{ opacity: 0, y: 18 }}
            animate={contentControls}
          >
            <span>FastAPI-powered inference pipeline</span>
            <span>Grad-CAM visual explainability</span>
            <span>Performance metrics for learning and research</span>
          </motion.div>
        </div>

        <AnalysisConsole />
      </div>
    </section>
  );
}
