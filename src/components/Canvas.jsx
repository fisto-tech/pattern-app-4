import { useEffect, useRef, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const TEXTURE_WIDTH = 2048;
const TEXTURE_HEIGHT = 2048;
const DEFAULT_TEXTURE_SIZE = { width: TEXTURE_WIDTH, height: TEXTURE_HEIGHT };
const WIDE_TEXTURE_DISPLAY_SCALE = 0.70;

// Handle types for transform controls
const HANDLE = {
  NONE: 0,
  MOVE: 1,
  ROTATE: 2,
  // Corner resize handles
  TL: 3, TR: 4, BR: 5, BL: 6,
  // Edge midpoint handles
  T: 7, R: 8, B: 9, L: 10,
};

class DraggableImage {
  constructor(img, textureSize) {
    this.img = img;
    this.width = textureSize.width * 0.4;
    this.height = (this.width / img.width) * img.height;
    
    // Center initially
    this.x = (textureSize.width - this.width) / 2;
    this.y = (textureSize.height - this.height) / 2;
    
    this.rotation = 0;
    this.opacity = 1;
  }

  clone(offset = 32) {
    const copy = Object.create(DraggableImage.prototype);
    copy.img = this.img;
    copy.width = this.width;
    copy.height = this.height;
    copy.x = this.x + offset;
    copy.y = this.y + offset;
    copy.rotation = this.rotation;
    copy.opacity = this.opacity;
    return copy;
  }

  // Get the center in texture-space
  getCenterTex() {
    return { x: this.x + this.width / 2, y: this.y + this.height / 2 };
  }

  // Convert a point from canvas-space to the image's local rotated coordinate system
  _toLocal(mx, my, scale) {
    const cx = (this.x + this.width / 2) / scale;
    const cy = (this.y + this.height / 2) / scale;
    const dx = mx - cx;
    const dy = my - cy;
    const cos = Math.cos(-this.rotation);
    const sin = Math.sin(-this.rotation);
    return {
      lx: dx * cos - dy * sin,
      ly: dx * sin + dy * cos,
    };
  }

  draw(ctx, scale) {
    ctx.save();
    ctx.globalAlpha = this.opacity;

    const scaledX = this.x / scale;
    const scaledY = this.y / scale;
    const scaledW = this.width / scale;
    const scaledH = this.height / scale;

    ctx.translate(scaledX + scaledW / 2, scaledY + scaledH / 2);
    ctx.rotate(this.rotation);
    ctx.drawImage(this.img, -scaledW / 2, -scaledH / 2, scaledW, scaledH);
    ctx.restore();
  }

  drawControls(ctx, scale) {
    const scaledW = this.width / scale;
    const scaledH = this.height / scale;
    const cx = (this.x + this.width / 2) / scale;
    const cy = (this.y + this.height / 2) / scale;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.rotation);

    // --- Bounding box ---
    ctx.strokeStyle = '#7c5cfc';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([]);
    ctx.strokeRect(-scaledW / 2, -scaledH / 2, scaledW, scaledH);

    // --- Corner handles (circles) ---
    const cornerRadius = 5;
    const corners = [
      [-scaledW / 2, -scaledH / 2],
      [scaledW / 2, -scaledH / 2],
      [scaledW / 2, scaledH / 2],
      [-scaledW / 2, scaledH / 2],
    ];

    corners.forEach(([hx, hy]) => {
      ctx.beginPath();
      ctx.arc(hx, hy, cornerRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#7c5cfc';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // --- Edge midpoint handles (small squares) ---
    const midSize = 4;
    const midpoints = [
      [0, -scaledH / 2],        // top
      [scaledW / 2, 0],          // right
      [0, scaledH / 2],          // bottom
      [-scaledW / 2, 0],         // left
    ];

    midpoints.forEach(([hx, hy]) => {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#7c5cfc';
      ctx.lineWidth = 2;
      ctx.fillRect(hx - midSize, hy - midSize, midSize * 2, midSize * 2);
      ctx.strokeRect(hx - midSize, hy - midSize, midSize * 2, midSize * 2);
    });

    // --- Rotation handle (top center, outside the box) ---
    const rotHandleOffset = 28;
    const rotHandleY = -(scaledH / 2 + rotHandleOffset);

    // Connecting line
    ctx.beginPath();
    ctx.moveTo(0, -scaledH / 2);
    ctx.lineTo(0, rotHandleY + 10);
    ctx.strokeStyle = '#7c5cfc';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Rotation icon circle background
    ctx.beginPath();
    ctx.arc(0, rotHandleY, 12, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#7c5cfc';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Draw rotation arrow icon
    ctx.save();
    ctx.translate(0, rotHandleY);
    ctx.strokeStyle = '#7c5cfc';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Circular arrow
    ctx.beginPath();
    ctx.arc(0, 0, 6, -Math.PI * 0.8, Math.PI * 0.5, false);
    ctx.stroke();
    
    // Arrow head
    const aex = 6 * Math.cos(Math.PI * 0.5);
    const aey = 6 * Math.sin(Math.PI * 0.5);
    ctx.beginPath();
    ctx.moveTo(aex - 3, aey - 2);
    ctx.lineTo(aex, aey);
    ctx.lineTo(aex + 3, aey - 2);
    ctx.stroke();
    
    ctx.restore();

    ctx.restore();
  }

  contains(mx, my, scale) {
    const { lx, ly } = this._toLocal(mx, my, scale);
    const hw = this.width / scale / 2;
    const hh = this.height / scale / 2;
    return lx >= -hw && lx <= hw && ly >= -hh && ly <= hh;
  }

  // Returns the HANDLE type at the given canvas point
  hitTest(mx, my, scale) {
    const { lx, ly } = this._toLocal(mx, my, scale);
    const hw = this.width / scale / 2;
    const hh = this.height / scale / 2;
    const hitR = 10; // hit radius for handles

    // Rotation handle (above top center)
    const rotHandleOffset = 28;
    const rotY = -(hh + rotHandleOffset);
    if (lx * lx + (ly - rotY) * (ly - rotY) < 16 * 16) return HANDLE.ROTATE;

    // Corner handles
    if (Math.hypot(lx - (-hw), ly - (-hh)) < hitR) return HANDLE.TL;
    if (Math.hypot(lx - hw, ly - (-hh)) < hitR) return HANDLE.TR;
    if (Math.hypot(lx - hw, ly - hh) < hitR) return HANDLE.BR;
    if (Math.hypot(lx - (-hw), ly - hh) < hitR) return HANDLE.BL;

    // Edge midpoint handles
    if (Math.hypot(lx - 0, ly - (-hh)) < hitR) return HANDLE.T;
    if (Math.hypot(lx - hw, ly - 0) < hitR) return HANDLE.R;
    if (Math.hypot(lx - 0, ly - hh) < hitR) return HANDLE.B;
    if (Math.hypot(lx - (-hw), ly - 0) < hitR) return HANDLE.L;

    // Body
    if (lx >= -hw && lx <= hw && ly >= -hh && ly <= hh) return HANDLE.MOVE;

    return HANDLE.NONE;
  }
}

function drawUVs(mesh, ctx, w, h) {
  const geometry = mesh.geometry;
  if (!geometry.attributes.uv) {
    console.warn('[drawUVs] No UV attribute on mesh:', mesh.name);
    return;
  }

  const uvAttr = geometry.attributes.uv;
  const index = geometry.index;
  const edgeCounts = new Map();
  const uvPrecision = 100000;

  console.log(`[drawUVs] Mesh: "${mesh.name}", indexed: ${!!index}, uvCount: ${uvAttr.count}, indexCount: ${index?.count || 0}, canvas: ${w}x${h}`);

  // Log UV range
  let dbgMinU = Infinity, dbgMaxU = -Infinity, dbgMinV = Infinity, dbgMaxV = -Infinity;
  for (let i = 0; i < uvAttr.count; i++) {
    const u = uvAttr.getX(i), v = uvAttr.getY(i);
    dbgMinU = Math.min(dbgMinU, u); dbgMaxU = Math.max(dbgMaxU, u);
    dbgMinV = Math.min(dbgMinV, v); dbgMaxV = Math.max(dbgMaxV, v);
  }
  console.log(`[drawUVs] UV range: u=[${dbgMinU.toFixed(4)}, ${dbgMaxU.toFixed(4)}], v=[${dbgMinV.toFixed(4)}, ${dbgMaxV.toFixed(4)}]`);

  ctx.save();
  ctx.strokeStyle = 'rgba(59, 130, 246, 0.85)';
  ctx.lineWidth = 1.5;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  const getUvPoint = (vertexIndex) => ({
    u: Math.round(uvAttr.getX(vertexIndex) * uvPrecision) / uvPrecision,
    v: Math.round(uvAttr.getY(vertexIndex) * uvPrecision) / uvPrecision,
  });

  const pointKey = (point) => `${point.u},${point.v}`;

  const addEdge = (a, b) => {
    const p1 = getUvPoint(a);
    const p2 = getUvPoint(b);
    const k1 = pointKey(p1);
    const k2 = pointKey(p2);
    const key = k1 < k2 ? `${k1}|${k2}` : `${k2}|${k1}`;
    const edge = edgeCounts.get(key) || { p1, p2, k1, k2, count: 0 };
    edge.count += 1;
    edgeCounts.set(key, edge);
  };

  if (index) {
    for (let i = 0; i < index.count; i += 3) {
      const a = index.getX(i);
      const b = index.getX(i + 1);
      const c = index.getX(i + 2);
      addEdge(a, b);
      addEdge(b, c);
      addEdge(c, a);
    }
  } else {
    for (let i = 0; i < uvAttr.count; i += 3) {
      addEdge(i, i + 1);
      addEdge(i + 1, i + 2);
      addEdge(i + 2, i);
    }
  }

  // Debug edge count distribution
  let c1 = 0, c2 = 0, cOther = 0;
  for (const edge of edgeCounts.values()) {
    if (edge.count === 1) c1++;
    else if (edge.count === 2) c2++;
    else cOther++;
  }
  console.log(`[drawUVs] Edge counts: total=${edgeCounts.size}, boundary(1)=${c1}, interior(2)=${c2}, other=${cOther}`);

  const boundaryEdges = Array.from(edgeCounts.values()).filter((edge) => edge.count === 1);
  const adjacency = new Map();
  boundaryEdges.forEach((edge, edgeIndex) => {
    [edge.k1, edge.k2].forEach((key) => {
      const connected = adjacency.get(key) || [];
      connected.push(edgeIndex);
      adjacency.set(key, connected);
    });
  });

  const visitedEdges = new Set();
  const outlineComponents = [];
  boundaryEdges.forEach((edge, startIndex) => {
    if (visitedEdges.has(startIndex)) return;

    const stack = [startIndex];
    const componentEdgeIndexes = [];
    let minU = Infinity;
    let maxU = -Infinity;
    let minV = Infinity;
    let maxV = -Infinity;

    while (stack.length) {
      const edgeIndex = stack.pop();
      if (visitedEdges.has(edgeIndex)) continue;

      visitedEdges.add(edgeIndex);
      componentEdgeIndexes.push(edgeIndex);

      const currentEdge = boundaryEdges[edgeIndex];
      minU = Math.min(minU, currentEdge.p1.u, currentEdge.p2.u);
      maxU = Math.max(maxU, currentEdge.p1.u, currentEdge.p2.u);
      minV = Math.min(minV, currentEdge.p1.v, currentEdge.p2.v);
      maxV = Math.max(maxV, currentEdge.p1.v, currentEdge.p2.v);

      [currentEdge.k1, currentEdge.k2].forEach((point) => {
        adjacency.get(point)?.forEach((nextEdgeIndex) => {
          if (!visitedEdges.has(nextEdgeIndex)) stack.push(nextEdgeIndex);
        });
      });
    }

    outlineComponents.push({
      area: (maxU - minU) * (maxV - minV),
      edgeCount: componentEdgeIndexes.length,
      edges: componentEdgeIndexes.map((edgeIndex) => boundaryEdges[edgeIndex]),
    });
  });

  const largestContourArea = outlineComponents.reduce(
    (largest, component) => Math.max(largest, component.area),
    0
  );
  const minContourArea = Math.max(largestContourArea * 0.05, 0.0025);

  console.log(`[drawUVs] Components: ${outlineComponents.length}, largestArea: ${largestContourArea.toFixed(6)}, threshold: ${minContourArea.toFixed(6)}`);
  outlineComponents.forEach((c, i) => {
    const passes = c.edgeCount >= 4 && c.area >= minContourArea;
    console.log(`[drawUVs]   Component #${i}: edges=${c.edgeCount}, area=${c.area.toFixed(6)} → ${passes ? 'DRAWN' : 'FILTERED'}`);
  });

  ctx.beginPath();
  let drawnEdgeCount = 0;
  outlineComponents.forEach((component) => {
    if (component.edgeCount < 4 || component.area < minContourArea) return;
    component.edges.forEach((edge) => {
      ctx.moveTo(edge.p1.u * w, edge.p1.v * h);
      ctx.lineTo(edge.p2.u * w, edge.p2.v * h);
      drawnEdgeCount++;
    });
  });
  ctx.stroke();
  console.log(`[drawUVs] Total edges drawn: ${drawnEdgeCount}`);
  ctx.restore();
}

function estimateTextureSizeFromUv(mesh) {
  const geometry = mesh?.geometry;
  const uvAttr = geometry?.attributes?.uv;
  if (!uvAttr) return DEFAULT_TEXTURE_SIZE;

  const index = geometry.index;
  let minU = Infinity;
  let maxU = -Infinity;
  let minV = Infinity;
  let maxV = -Infinity;
  const parent = Array.from({ length: uvAttr.count }, (_, i) => i);
  const find = (x) => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  };
  const union = (a, b) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[rb] = ra;
  };

  const readTriangle = (i) => index
    ? [index.getX(i), index.getX(i + 1), index.getX(i + 2)]
    : [i, i + 1, i + 2];

  const triangleCount = index ? index.count : uvAttr.count;
  for (let i = 0; i < triangleCount; i += 3) {
    const [a, b, c] = readTriangle(i);
    union(a, b);
    union(b, c);
  }

  const islands = new Map();
  for (let i = 0; i < uvAttr.count; i++) {
    const root = find(i);
    const u = uvAttr.getX(i);
    const v = uvAttr.getY(i);
    const island = islands.get(root) || {
      minU: Infinity,
      maxU: -Infinity,
      minV: Infinity,
      maxV: -Infinity,
      count: 0,
    };
    island.minU = Math.min(island.minU, u);
    island.maxU = Math.max(island.maxU, u);
    island.minV = Math.min(island.minV, v);
    island.maxV = Math.max(island.maxV, v);
    island.count += 1;
    islands.set(root, island);

    minU = Math.min(minU, u);
    maxU = Math.max(maxU, u);
    minV = Math.min(minV, v);
    maxV = Math.max(maxV, v);
  }

  const layoutWidth = maxU - minU;
  const layoutHeight = maxV - minV;
  const layoutAspect = layoutHeight / layoutWidth;
  if (layoutWidth <= 0 || layoutHeight <= 0 || layoutAspect < 0.9 || layoutAspect > 1.1) {
    return DEFAULT_TEXTURE_SIZE;
  }

  let bestAspect = 1;
  let bestScore = 0;
  let hasWideCompanionIsland = false;
  islands.forEach((island) => {
    const width = island.maxU - island.minU;
    const height = island.maxV - island.minV;
    const area = width * height;
    if (width <= 0 || height <= 0 || area < 0.01) return;

    const rawAspect = height / width;
    const score = area * island.count;
    if (rawAspect < 0.5 && area > 0.05) {
      hasWideCompanionIsland = true;
    }
    if (rawAspect > 1.2 && score > bestScore) {
      bestAspect = rawAspect;
      bestScore = score;
    }
  });

  if (!hasWideCompanionIsland || bestAspect === 1) {
    return DEFAULT_TEXTURE_SIZE;
  }

  return {
    width: TEXTURE_WIDTH,
    height: Math.round(TEXTURE_WIDTH / bestAspect),
  };
}

const Canvas = forwardRef(({ textureCanvasRef, onTextureUpdated, modelUrl, showUv, bgColor }, ref) => {
  const displayCanvasRef = useRef(null);
  const containerRef = useRef(null);
  
  const imagesRef = useRef([]);
  const selectedImageRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const contextMenuTargetRef = useRef(null);
  const [contextMenu, setContextMenu] = useState({ open: false, x: 0, y: 0, mode: 'image' });
  
  const interactionRef = useRef({
    isDragging: false,
    mode: HANDLE.NONE,
    startMx: 0, startMy: 0,
    startImgX: 0, startImgY: 0,
    startImgW: 0, startImgH: 0,
    startRotation: 0,
    startAngle: 0,
    aspectRatio: 1,
  });


  const currentMeshRef = useRef(null);
  const canvasScaleRef = useRef(1);
  const textureSizeRef = useRef(DEFAULT_TEXTURE_SIZE);
  const onTextureUpdatedRef = useRef(onTextureUpdated);
  const rafIdRef = useRef(null);
  const bakeTimeoutRef = useRef(null);
  const needsDisplayRedrawRef = useRef(false);

  // Initialize bake canvas
  useEffect(() => {
    if (!textureCanvasRef) return;
    if (textureCanvasRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = DEFAULT_TEXTURE_SIZE.width;
    canvas.height = DEFAULT_TEXTURE_SIZE.height;
    textureCanvasRef.current = canvas;
  }, [textureCanvasRef]);

  useEffect(() => {
    onTextureUpdatedRef.current = onTextureUpdated;
  }, [onTextureUpdated]);

  const resizeTextureCanvas = useCallback((nextSize) => {
    const width = Math.max(1, Math.round(nextSize.width));
    const height = Math.max(1, Math.round(nextSize.height));
    const previousSize = textureSizeRef.current;

    if (previousSize.width !== width || previousSize.height !== height) {
      const scaleX = width / previousSize.width;
      const scaleY = height / previousSize.height;
      imagesRef.current.forEach((img) => {
        img.x *= scaleX;
        img.y *= scaleY;
        img.width *= scaleX;
        img.height *= scaleY;
      });
    }

    textureSizeRef.current = { width, height };

    const bakeCanvas = textureCanvasRef.current;
    if (bakeCanvas && (bakeCanvas.width !== width || bakeCanvas.height !== height)) {
      bakeCanvas.width = width;
      bakeCanvas.height = height;
    }
  }, [textureCanvasRef]);

  const getTextureSizeFromGltf = (gltf) => {
    let foundSize = null;

    gltf.scene.traverse((child) => {
      if (foundSize || !child.isMesh) return;

      const materials = Array.isArray(child.material) ? child.material : [child.material];
      for (const material of materials) {
        const image = material?.map?.image;
        const width = image?.naturalWidth || image?.videoWidth || image?.width;
        const height = image?.naturalHeight || image?.videoHeight || image?.height;

        if (width && height) {
          foundSize = { width, height };
          break;
        }
      }
    });

    if (!foundSize) return null;

    const aspect = foundSize.width / foundSize.height;
    return {
      width: TEXTURE_WIDTH,
      height: Math.round(TEXTURE_WIDTH / aspect),
    };
  };

  // --- Separated rendering: display (instant) vs bake (debounced) ---

  const redrawDisplay = useCallback(() => {
    const displayCanvas = displayCanvasRef.current;
    if (!displayCanvas) return;
    const ctx = displayCanvas.getContext('2d');
    const w = displayCanvas.width;
    const h = displayCanvas.height;
    
    ctx.clearRect(0, 0, w, h);

    if (showUv && currentMeshRef.current) {
      drawUVs(currentMeshRef.current, ctx, w, h);
    }

    const scale = canvasScaleRef.current;
    imagesRef.current.forEach(img => {
      img.draw(ctx, scale);
    });

    // Draw controls for selected image LAST (on top)
    if (selectedImageRef.current) {
      selectedImageRef.current.drawControls(ctx, scale);
    }
  }, [showUv]);

  const bakeTexture = useCallback(() => {
    const bakeCanvas = textureCanvasRef.current;
    if (!bakeCanvas) return;
    const bakeCtx = bakeCanvas.getContext('2d');

    bakeCtx.clearRect(0, 0, bakeCanvas.width, bakeCanvas.height);
    bakeCtx.fillStyle = bgColor;
    bakeCtx.fillRect(0, 0, bakeCanvas.width, bakeCanvas.height);

    imagesRef.current.forEach(img => {
      bakeCtx.save();
      bakeCtx.globalAlpha = img.opacity;
      bakeCtx.translate(img.x + img.width / 2, img.y + img.height / 2);
      bakeCtx.rotate(img.rotation);
      bakeCtx.drawImage(img.img, -img.width / 2, -img.height / 2, img.width, img.height);
      bakeCtx.restore();
    });

    onTextureUpdatedRef.current();
  }, [bgColor, textureCanvasRef]);

  // Debounced bake — called after interaction settles
  const scheduleBake = useCallback(() => {
    if (bakeTimeoutRef.current) clearTimeout(bakeTimeoutRef.current);
    bakeTimeoutRef.current = setTimeout(() => {
      bakeTexture();
    }, 16); // ~1 frame delay
  }, [bakeTexture]);

  // Full redraw (both display + bake) — used for non-interactive updates
  const redrawAll = useCallback(() => {
    redrawDisplay();
    bakeTexture();
  }, [redrawDisplay, bakeTexture]);

  const resizeDisplayCanvas = useCallback(() => {
    if (!containerRef.current || !displayCanvasRef.current) return;

    const container = containerRef.current;
    const padding = 40;
    const textureSize = textureSizeRef.current;
    const aspect = textureSize.width / textureSize.height;
    const maxWidth = Math.max(1, container.clientWidth - padding);
    const heightScale = aspect > 1.5 ? WIDE_TEXTURE_DISPLAY_SCALE : 0.85;
    const maxHeight = Math.max(1, (container.clientHeight - padding) * heightScale);
    let width = maxWidth;
    let height = width / aspect;

    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspect;
    }

    displayCanvasRef.current.width = Math.round(width);
    displayCanvasRef.current.height = Math.round(height);
    canvasScaleRef.current = textureSize.width / displayCanvasRef.current.width;

    redrawDisplay();
  }, [redrawDisplay]);

  // RAF loop for smooth interaction rendering
  const startRenderLoop = useCallback(() => {
    if (rafIdRef.current) return;
    const loop = () => {
      if (needsDisplayRedrawRef.current) {
        redrawDisplay();
        needsDisplayRedrawRef.current = false;
      }
      if (interactionRef.current.isDragging) {
        rafIdRef.current = requestAnimationFrame(loop);
      } else {
        rafIdRef.current = null;
      }
    };
    rafIdRef.current = requestAnimationFrame(loop);
  }, [redrawDisplay]);

  useEffect(() => {
    let isActive = true;
    currentMeshRef.current = null;
    if (!modelUrl) {
        resizeTextureCanvas(DEFAULT_TEXTURE_SIZE);
        resizeDisplayCanvas();
        return;
    }
    const loader = new GLTFLoader();
    loader.load(modelUrl, (gltf) => {
      if (!isActive) return;
      // Find the mesh with the best UV data (not just the first mesh)
      let bestMesh = null;
      let bestScore = -1;
      gltf.scene.traverse((child) => {
        if (!child.isMesh) return;
        const uvAttr = child.geometry?.attributes?.uv;
        if (!uvAttr || uvAttr.count === 0) return;

        // Calculate UV spread — wider spread = more useful UV layout
        let minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity;
        for (let i = 0; i < uvAttr.count; i++) {
          const u = uvAttr.getX(i), v = uvAttr.getY(i);
          minU = Math.min(minU, u); maxU = Math.max(maxU, u);
          minV = Math.min(minV, v); maxV = Math.max(maxV, v);
        }
        const uvArea = (maxU - minU) * (maxV - minV);

        // Score: UV spread area is most important, bonus for having a texture map
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        const hasMap = materials.some((m) => m?.map);
        const score = uvArea * 1000 + (hasMap ? 500 : 0) + uvAttr.count * 0.001;

        if (score > bestScore) {
          bestScore = score;
          bestMesh = child;
        }
      });
      // Fallback to first mesh if no UV-bearing mesh found
      if (!bestMesh) {
        gltf.scene.traverse((child) => {
          if (child.isMesh && !bestMesh) bestMesh = child;
        });
      }
      currentMeshRef.current = bestMesh;
      const materialSize = getTextureSizeFromGltf(gltf);
      resizeTextureCanvas(materialSize || estimateTextureSizeFromUv(bestMesh));
      resizeDisplayCanvas();
      redrawAll();
    });

    return () => {
      isActive = false;
    };
  }, [modelUrl, redrawAll, resizeDisplayCanvas, resizeTextureCanvas]);

  useEffect(() => {
    redrawDisplay();
  }, [showUv, redrawDisplay]);

  useEffect(() => {
    bakeTexture();
  }, [bgColor, bakeTexture]);

  useEffect(() => {
    window.addEventListener('resize', resizeDisplayCanvas);
    setTimeout(resizeDisplayCanvas, 100);
    
    return () => window.removeEventListener('resize', resizeDisplayCanvas);
  }, [resizeDisplayCanvas]);

  // --- Cursor helpers (direct DOM, no React state) ---
  const setCursor = (cursor) => {
    const canvas = displayCanvasRef.current;
    if (canvas) canvas.style.cursor = cursor;
  };

  const getCursorForHandle = (handle) => {
    switch (handle) {
      case HANDLE.MOVE: return 'move';
      case HANDLE.ROTATE: return 'grab';
      case HANDLE.TL: case HANDLE.BR: return 'nwse-resize';
      case HANDLE.TR: case HANDLE.BL: return 'nesw-resize';
      case HANDLE.T: case HANDLE.B: return 'ns-resize';
      case HANDLE.L: case HANDLE.R: return 'ew-resize';
      default: return 'default';
    }
  };

  // --- Pointer handlers ---

  const handlePointerDown = (e) => {
    if (e.button === 2) return;

    if (contextMenu.open) {
      setContextMenu({ open: false, x: 0, y: 0, mode: 'image' });
      contextMenuTargetRef.current = null;
    }

    const displayCanvas = displayCanvasRef.current;
    if (!displayCanvas) return;
    
    const rect = displayCanvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const scale = canvasScaleRef.current;

    const interaction = interactionRef.current;

    // First, check if we hit any handle on the currently selected image
    const sel = selectedImageRef.current;
    if (sel) {
      const handle = sel.hitTest(mx, my, scale);
      if (handle !== HANDLE.NONE) {
        interaction.isDragging = true;
        interaction.mode = handle;
        interaction.startMx = mx;
        interaction.startMy = my;
        interaction.startImgX = sel.x;
        interaction.startImgY = sel.y;
        interaction.startImgW = sel.width;
        interaction.startImgH = sel.height;
        interaction.aspectRatio = sel.width / sel.height;
        
        if (handle === HANDLE.ROTATE) {
          const cx = (sel.x + sel.width / 2) / scale;
          const cy = (sel.y + sel.height / 2) / scale;
          interaction.startAngle = Math.atan2(my - cy, mx - cx);
          interaction.startRotation = sel.rotation;
          setCursor('grabbing');
        } else {
          setCursor(getCursorForHandle(handle));
        }
        
        displayCanvas.setPointerCapture(e.pointerId);
        startRenderLoop();
        return;
      }
    }

    // Check if we clicked on any image body
    let clickedImage = null;
    for (let i = imagesRef.current.length - 1; i >= 0; i--) {
      const img = imagesRef.current[i];
      if (img.contains(mx, my, scale)) {
        clickedImage = img;
        break;
      }
    }

    selectedImageRef.current = clickedImage;
    setSelectedImage(clickedImage);

    if (clickedImage) {
      interaction.isDragging = true;
      interaction.mode = HANDLE.MOVE;
      interaction.startMx = mx;
      interaction.startMy = my;
      interaction.startImgX = clickedImage.x;
      interaction.startImgY = clickedImage.y;
      setCursor('move');
      displayCanvas.setPointerCapture(e.pointerId);
      startRenderLoop();
    }

    redrawDisplay();
  };

  const handleContextMenu = (e) => {
    const displayCanvas = displayCanvasRef.current;
    const container = containerRef.current;
    if (!displayCanvas || !container) return;

    const rect = displayCanvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const scale = canvasScaleRef.current;

    let clickedImage = null;
    for (let i = imagesRef.current.length - 1; i >= 0; i--) {
      const img = imagesRef.current[i];
      if (img.contains(mx, my, scale)) {
        clickedImage = img;
        break;
      }
    }

    e.preventDefault();
    const containerRect = container.getBoundingClientRect();
    contextMenuTargetRef.current = clickedImage;
    selectedImageRef.current = clickedImage;
    setSelectedImage(clickedImage);
    setContextMenu({
      open: true,
      x: e.clientX - containerRect.left,
      y: e.clientY - containerRect.top,
      mode: clickedImage ? 'image' : 'canvas',
    });
    redrawDisplay();
  };

  const handlePointerMove = (e) => {
    const displayCanvas = displayCanvasRef.current;
    if (!displayCanvas) return;

    const rect = displayCanvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const scale = canvasScaleRef.current;
    const interaction = interactionRef.current;

    if (!interaction.isDragging) {
      // Hover cursor
      const sel = selectedImageRef.current;
      if (sel) {
        const handle = sel.hitTest(mx, my, scale);
        if (handle !== HANDLE.NONE) {
          setCursor(getCursorForHandle(handle));
          return;
        }
      }
      // Check any image body
      for (let i = imagesRef.current.length - 1; i >= 0; i--) {
        if (imagesRef.current[i].contains(mx, my, scale)) {
          setCursor('move');
          return;
        }
      }
      setCursor('default');
      return;
    }

    // --- Dragging ---
    const img = selectedImageRef.current;
    if (!img) return;

    const mode = interaction.mode;
    const dx = mx - interaction.startMx;
    const dy = my - interaction.startMy;

    if (mode === HANDLE.MOVE) {
      img.x = interaction.startImgX + dx * scale;
      img.y = interaction.startImgY + dy * scale;
    }
    else if (mode === HANDLE.ROTATE) {
      const cx = (img.x + img.width / 2) / scale;
      const cy = (img.y + img.height / 2) / scale;
      const currentAngle = Math.atan2(my - cy, mx - cx);
      img.rotation = interaction.startRotation + (currentAngle - interaction.startAngle);
    }
    else {
      // Resize handles
      applyResize(img, mode, mx, my, scale, interaction);
    }

    needsDisplayRedrawRef.current = true;
    scheduleBake();
  };

  // Resize logic: handles both corner (proportional) and edge (non-proportional) resizing
  const applyResize = (img, mode, mx, my, scale, interaction) => {
    const { lx, ly } = img._toLocal(mx, my, scale);
    const center = img.getCenterTex();

    if (mode >= HANDLE.TL && mode <= HANDLE.BL) {
      // Corner resize — proportional, symmetric around center
      // Calculate distance from center to mouse in local space
      const dist = Math.max(Math.abs(lx), Math.abs(ly) * interaction.aspectRatio);
      const newHW = Math.max(10 / scale, dist);
      const newHH = newHW / interaction.aspectRatio;
      
      img.width = newHW * 2 * scale;
      img.height = newHH * 2 * scale;
      img.x = center.x - img.width / 2;
      img.y = center.y - img.height / 2;
    }
    else if (mode === HANDLE.T || mode === HANDLE.B) {
      // Vertical edge resize
      const newHH = Math.max(10 / scale, Math.abs(ly));
      img.height = newHH * 2 * scale;
      img.y = center.y - img.height / 2;
    }
    else if (mode === HANDLE.L || mode === HANDLE.R) {
      // Horizontal edge resize
      const newHW = Math.max(10 / scale, Math.abs(lx));
      img.width = newHW * 2 * scale;
      img.x = center.x - img.width / 2;
    }
  };

  const handlePointerUp = () => {
    const interaction = interactionRef.current;
    if (interaction.isDragging) {
      interaction.isDragging = false;
      interaction.mode = HANDLE.NONE;
      // Final bake
      bakeTexture();
      redrawDisplay();
    }
  };

  useEffect(() => {
    const onPointerUp = () => {
      const interaction = interactionRef.current;
      if (interaction.isDragging) {
        interaction.isDragging = false;
        interaction.mode = HANDLE.NONE;
        bakeTexture();
        redrawDisplay();
      }
    };
    window.addEventListener('pointerup', onPointerUp);
    return () => window.removeEventListener('pointerup', onPointerUp);
  }, [bakeTexture, redrawDisplay]);

  useEffect(() => {
    const closeMenu = () => {
      contextMenuTargetRef.current = null;
      setContextMenu({ open: false, x: 0, y: 0, mode: 'image' });
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') closeMenu();
    };

    window.addEventListener('resize', closeMenu);
    window.addEventListener('scroll', closeMenu, true);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('resize', closeMenu);
      window.removeEventListener('scroll', closeMenu, true);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      if (bakeTimeoutRef.current) clearTimeout(bakeTimeoutRef.current);
    };
  }, []);

  function onUploadImage(fileOrUrl) {
    if (!fileOrUrl) return;
    const url = typeof fileOrUrl === 'string' ? fileOrUrl : URL.createObjectURL(fileOrUrl);
    const img = new Image();
    img.onload = () => {
      const newImg = new DraggableImage(img, textureSizeRef.current);
      imagesRef.current.push(newImg);
      selectedImageRef.current = newImg;
      setSelectedImage(newImg);
      redrawAll();
    };
    img.src = url;
  }

  useImperativeHandle(ref, () => ({
    uploadImage: (file) => {
      onUploadImage(file);
    },
    exportAsPNG: () => {
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = textureSizeRef.current.width;
      exportCanvas.height = textureSizeRef.current.height;
      const ctx = exportCanvas.getContext('2d');
      imagesRef.current.forEach(img => {
        ctx.save();
        ctx.globalAlpha = img.opacity;
        ctx.translate(img.x + img.width / 2, img.y + img.height / 2);
        ctx.rotate(img.rotation);
        ctx.drawImage(img.img, -img.width / 2, -img.height / 2, img.width, img.height);
        ctx.restore();
      });
      return exportCanvas.toDataURL('image/png');
    }
  }));
  
  const onDelete = () => {
    const target = contextMenuTargetRef.current || selectedImageRef.current;
    if (!target) return;
    imagesRef.current = imagesRef.current.filter(i => i !== target);
    selectedImageRef.current = null;
    contextMenuTargetRef.current = null;
    setSelectedImage(null);
    setContextMenu({ open: false, x: 0, y: 0, mode: 'image' });
    redrawAll();
  };

  const onDuplicate = () => {
    const target = contextMenuTargetRef.current || selectedImageRef.current;
    if (!target) return;

    const copy = target.clone();
    const insertAt = imagesRef.current.indexOf(target) + 1;
    imagesRef.current.splice(insertAt, 0, copy);
    selectedImageRef.current = copy;
    contextMenuTargetRef.current = null;
    setSelectedImage(copy);
    setContextMenu({ open: false, x: 0, y: 0, mode: 'image' });
    redrawAll();
  };

  const onBringToFront = () => {
    const target = contextMenuTargetRef.current || selectedImageRef.current;
    if (!target) return;

    imagesRef.current = imagesRef.current.filter(i => i !== target);
    imagesRef.current.push(target);
    selectedImageRef.current = target;
    contextMenuTargetRef.current = null;
    setSelectedImage(target);
    setContextMenu({ open: false, x: 0, y: 0, mode: 'image' });
    redrawAll();
  };

  const onBringToBack = () => {
    const target = contextMenuTargetRef.current || selectedImageRef.current;
    if (!target) return;

    imagesRef.current = imagesRef.current.filter(i => i !== target);
    imagesRef.current.unshift(target);
    selectedImageRef.current = target;
    contextMenuTargetRef.current = null;
    setSelectedImage(target);
    setContextMenu({ open: false, x: 0, y: 0, mode: 'image' });
    redrawAll();
  };

  const onRequestClearAll = () => {
    setContextMenu((menu) => ({ ...menu, mode: 'confirm-clear' }));
  };

  const onCancelClearAll = () => {
    setContextMenu((menu) => ({ ...menu, mode: 'canvas' }));
  };

  const onClearAllImages = () => {
    imagesRef.current = [];
    selectedImageRef.current = null;
    contextMenuTargetRef.current = null;
    setSelectedImage(null);
    setContextMenu({ open: false, x: 0, y: 0, mode: 'image' });
    redrawAll();
  };
  
  const onBringForward = () => {
    if (!selectedImageRef.current) return;
    const idx = imagesRef.current.indexOf(selectedImageRef.current);
    if (idx < imagesRef.current.length - 1) {
      [imagesRef.current[idx], imagesRef.current[idx + 1]] = [imagesRef.current[idx + 1], imagesRef.current[idx]];
      redrawAll();
    }
  };

  const onSendBackward = () => {
    if (!selectedImageRef.current) return;
    const idx = imagesRef.current.indexOf(selectedImageRef.current);
    if (idx > 0) {
      [imagesRef.current[idx], imagesRef.current[idx - 1]] = [imagesRef.current[idx - 1], imagesRef.current[idx]];
      redrawAll();
    }
  };

  return (
    <div className="flex-1 flex flex-col relative" style={{ background: '#f5efe6' }}>
      <div className="flex-1 relative overflow-hidden" ref={containerRef}>
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(0,0,0,.15) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,.15) 1px,transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="relative" style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.15)', background: '#fff' }}>
            <canvas
              ref={displayCanvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onContextMenu={handleContextMenu}
              style={{ cursor: 'default' }}
              className="touch-none"
            />
          </div>
        </div>
        
        {/* Selected Image Controls */}
        {selectedImage && (
            <div className="absolute top-4 right-4 z-20 flex gap-2 bg-white/90 backdrop-blur p-2 rounded-xl shadow-sm border border-gray-100">
              <CtrlBtn title="Bring Forward" onClick={onBringForward}>↑ Forward</CtrlBtn>
              <CtrlBtn title="Send Backward" onClick={onSendBackward}>↓ Backward</CtrlBtn>
              <div className="w-px h-4 bg-gray-300 my-auto mx-1" />
              <CtrlBtn title="Delete" onClick={onDelete} danger>🗑 Delete</CtrlBtn>
            </div>
        )}

        {contextMenu.open && (
          <div
            className="absolute z-30 min-w-[170px] overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-xl"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onPointerDown={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
          >
            {contextMenu.mode === 'image' && (
              <>
                <ContextMenuItem onClick={onDuplicate}>Duplicate</ContextMenuItem>
                <ContextMenuItem onClick={onBringToFront}>Bring to Front</ContextMenuItem>
                <ContextMenuItem onClick={onBringToBack}>Bring to Back</ContextMenuItem>
                <div className="my-1 h-px bg-gray-100" />
                <ContextMenuItem onClick={onDelete} danger>Delete</ContextMenuItem>
              </>
            )}
            {contextMenu.mode === 'canvas' && (
              <ContextMenuItem onClick={onRequestClearAll} danger>Clear all images</ContextMenuItem>
            )}
            {contextMenu.mode === 'confirm-clear' && (
              <div className="px-3 py-2">
                <p className="m-0 mb-2 text-sm font-semibold text-gray-800">Clear all images?</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClearAllImages}
                    className="flex-1 rounded-md border-none bg-red-600 px-3 py-1.5 text-sm font-semibold text-white cursor-pointer hover:bg-red-700"
                  >
                    OK
                  </button>
                  <button
                    type="button"
                    onClick={onCancelClearAll}
                    className="flex-1 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

export default Canvas;

function CtrlBtn({ title, onClick, children, danger }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`rounded px-2.5 py-1.5 text-xs font-bold transition-colors border-none cursor-pointer ${
        danger ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {children}
    </button>
  );
}

function ContextMenuItem({ onClick, children, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`block w-full border-none bg-transparent px-4 py-2 text-left text-sm cursor-pointer ${
        danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-800 hover:bg-gray-50'
      }`}
    >
      {children}
    </button>
  );
}
