"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ShaderBackground() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const clock = new THREE.Clock();

    const uniforms = {
      iTime: { value: 0 },
      iResolution: { value: new THREE.Vector2() },
      iMouse: { value: new THREE.Vector2(-10, -10) }
    };

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: `
        void main() {
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        uniform vec2 iResolution;
        uniform float iTime;
        uniform vec2 iMouse;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
            mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
            u.y
          );
        }

        float fbm(vec2 p) {
          float value = 0.0;
          float amplitude = 0.5;
          for (int i = 0; i < 6; i++) {
            value += amplitude * noise(p);
            p *= 2.0;
            amplitude *= 0.5;
          }
          return value;
        }

        void main() {
          vec2 uv = (gl_FragCoord.xy - 0.5 * iResolution.xy) / iResolution.y;
          vec2 mouse = (iMouse - 0.5 * iResolution.xy) / iResolution.y;

          float time = iTime * 0.12;
          vec2 flow = uv;
          flow.x *= 1.1;
          flow.y += 0.35;

          float veil = fbm(vec2(flow.x * 1.6, flow.y * 1.15 + time));
          float detail = fbm(vec2(flow.x * 3.0 - time * 0.8, flow.y * 2.4 + time));
          float curtain = smoothstep(0.18, 0.74, veil + detail * 0.25);
          curtain *= smoothstep(1.2, -0.2, uv.y);

          vec2 rightFlow = vec2((uv.x - 0.28) * 2.4, uv.y * 1.1 + time * 0.55);
          float rightSmoke = fbm(rightFlow + vec2(0.0, time * 0.35));
          float rightColumn = smoothstep(0.02, 0.68, rightSmoke);
          rightColumn *= smoothstep(-0.12, 0.82, uv.x);
          rightColumn *= smoothstep(1.3, -0.6, uv.y);

          float distanceToMouse = length(uv - mouse);
          float flare = smoothstep(0.36, 0.0, distanceToMouse);

          vec3 deep = vec3(0.03, 0.06, 0.07);
          vec3 oxygen = vec3(0.12, 0.68, 0.60);
          vec3 moss = vec3(0.27, 0.45, 0.28);
          vec3 bone = vec3(0.91, 0.92, 0.82);

          float gradient = clamp(uv.y + 0.55, 0.0, 1.0);
          vec3 color = mix(deep, oxygen, curtain * 0.75);
          color = mix(color, moss, gradient * curtain * 0.45);
          color += vec3(0.06, 0.26, 0.23) * rightColumn * 0.88;
          color += vec3(0.02, 0.09, 0.1) * smoothstep(0.1, 0.9, uv.x) * rightColumn;
          color += bone * flare * curtain * 0.45;
          color += vec3(0.02, 0.08, 0.07) * smoothstep(-0.5, 0.4, uv.x + uv.y);

          float vignette = smoothstep(1.65, 0.25, length(uv * vec2(0.9, 1.15)));
          color *= vignette;

          gl_FragColor = vec4(color, 0.92);
        }
      `
    });

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(mesh);

    const resize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      renderer.setSize(width, height);
      uniforms.iResolution.value.set(width, height);
    };

    const handlePointerMove = (event: PointerEvent) => {
      uniforms.iMouse.value.set(event.clientX, window.innerHeight - event.clientY);
    };

    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", handlePointerMove);
    resize();

    renderer.setAnimationLoop(() => {
      uniforms.iTime.value = clock.getElapsedTime();
      renderer.render(scene, camera);
    });

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", handlePointerMove);
      renderer.setAnimationLoop(null);
      mesh.geometry.dispose();
      material.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="shader-background"
    />
  );
}
