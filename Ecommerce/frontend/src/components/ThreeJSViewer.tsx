'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface ThreeJSViewerProps {
  modelPath: string;
  width?: number;
  height?: number;
}

export default function ThreeJSViewer({ 
  modelPath, 
  width = 400, 
  height = 400 
}: ThreeJSViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mountRef.current || isInitialized.current) return;
    isInitialized.current = true;

    console.log('🚀 Iniciando ThreeJSViewer con modelPath:', modelPath);
    setLoading(true);
    setError(null);

    let model: THREE.Object3D;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.z = 5;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;

    mountRef.current.appendChild(renderer.domElement);

    // 4. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.minDistance = 1;
    controls.maxDistance = 20;

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7.5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // 6. Model Loading
    console.log('📦 Intentando cargar modelo desde:', modelPath);
    const loader = new GLTFLoader();
    loader.load(
      modelPath,
      (gltf) => {
        console.log('✅ Modelo cargado exitosamente:', gltf);
        model = gltf.scene;
        
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        
        console.log('📏 Dimensiones del modelo:', size);
        console.log('🎯 Centro del modelo:', center);
        
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 2 * 3 / Math.tan(fov / 2));
        
        cameraZ *= 0.9;
        camera.position.z = cameraZ;
        
        model.position.sub(center);
        
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        
        scene.add(model);
        
        controls.target.copy(center);
        controls.update();

        setLoading(false);
        console.log('🎉 Modelo cargado, centrado y controles actualizados.');
      },
      (progress) => {
        console.log('📊 Progreso de carga:', (progress.loaded / progress.total * 100).toFixed(2) + '%');
      },
      (error) => {
        console.error('❌ Error cargando modelo:', error);
        setError(`Error cargando modelo: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        setLoading(false);
      }
    );

    // 7. Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // 8. Handle resize
    const handleResize = () => {
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // 9. Cleanup
    return () => {
      console.log('🧹 Limpiando ThreeJSViewer');
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      if (model) {
        scene.remove(model);
      }
      renderer.dispose();
      isInitialized.current = false;
    };
  }, [modelPath, width, height]);

  if (error) {
    return (
      <div className="threejs-viewer relative" style={{ width, height }}>
        <div className="w-full h-full flex items-center justify-center bg-red-50 border border-red-200 rounded-lg">
          <div className="text-center p-4">
            <div className="text-red-500 mb-2">
              <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-red-700 font-medium">Error al cargar modelo</p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="threejs-viewer relative" style={{ width, height }}>
      <div ref={mountRef} />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Cargando modelo 3D...</p>
          </div>
        </div>
      )}
      <div className="absolute bottom-2 left-2 text-xs text-gray-500 bg-white/50 p-1 rounded">
        <span>Modelo 3D. Usa el mouse para interactuar.</span>
      </div>
    </div>
  );
} 