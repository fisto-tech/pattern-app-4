const DEFAULT_UV_LAYOUT = {
  minU: 0,
  maxU: 1,
  minV: 0,
  maxV: 1,
  width: 1,
  height: 1,
};

export const UV_CANVAS_FRAME = {
  scaleX: 0.66,
  scaleY: 0.66,
  offsetX: 0.17,
  offsetY: 0.24,
};

export function getMeshUvBounds(mesh) {
  const uvAttr = mesh?.geometry?.attributes?.uv;
  if (!uvAttr || uvAttr.count === 0) return null;

  let minU = Infinity;
  let maxU = -Infinity;
  let minV = Infinity;
  let maxV = -Infinity;

  for (let i = 0; i < uvAttr.count; i++) {
    const u = uvAttr.getX(i);
    const v = uvAttr.getY(i);
    if (!Number.isFinite(u) || !Number.isFinite(v)) continue;
    minU = Math.min(minU, u);
    maxU = Math.max(maxU, u);
    minV = Math.min(minV, v);
    maxV = Math.max(maxV, v);
  }

  const width = maxU - minU;
  const height = maxV - minV;
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 1e-5 || height <= 1e-5) {
    return null;
  }

  return { minU, maxU, minV, maxV, width, height };
}

export function getSceneUvLayout(scene) {
  let layout = null;

  scene?.traverse((child) => {
    if (!child.isMesh) return;
    const bounds = getMeshUvBounds(child);
    if (!bounds) return;

    if (!layout) {
      layout = { ...bounds };
      return;
    }

    layout.minU = Math.min(layout.minU, bounds.minU);
    layout.maxU = Math.max(layout.maxU, bounds.maxU);
    layout.minV = Math.min(layout.minV, bounds.minV);
    layout.maxV = Math.max(layout.maxV, bounds.maxV);
    layout.width = layout.maxU - layout.minU;
    layout.height = layout.maxV - layout.minV;
  });

  return layout || DEFAULT_UV_LAYOUT;
}

export function getUvLayoutForMeshes(meshes) {
  let layout = null;

  meshes.forEach((mesh) => {
    const bounds = getMeshUvBounds(mesh);
    if (!bounds) return;

    if (!layout) {
      layout = { ...bounds };
      return;
    }

    layout.minU = Math.min(layout.minU, bounds.minU);
    layout.maxU = Math.max(layout.maxU, bounds.maxU);
    layout.minV = Math.min(layout.minV, bounds.minV);
    layout.maxV = Math.max(layout.maxV, bounds.maxV);
    layout.width = layout.maxU - layout.minU;
    layout.height = layout.maxV - layout.minV;
  });

  return layout || DEFAULT_UV_LAYOUT;
}

export function toCanvasUvPoint(u, v, layout, canvasWidth, canvasHeight, frame = UV_CANVAS_FRAME) {
  const safeLayout = layout || DEFAULT_UV_LAYOUT;
  const width = safeLayout.width || 1;
  const height = safeLayout.height || 1;
  const normalizedU = (u - safeLayout.minU) / width;
  const normalizedV = (v - safeLayout.minV) / height;
  return {
    x: (frame.offsetX + normalizedU * frame.scaleX) * canvasWidth,
    y: (frame.offsetY + (1 - normalizedV) * frame.scaleY) * canvasHeight,
  };
}

export function applyUvLayoutToTexture(texture, layout, frame = UV_CANVAS_FRAME) {
  const safeLayout = layout || DEFAULT_UV_LAYOUT;
  const width = safeLayout.width || 1;
  const height = safeLayout.height || 1;
  const repeatX = frame.scaleX / width;
  const repeatY = frame.scaleY / height;

  texture.offset.set(
    frame.offsetX - safeLayout.minU * repeatX,
    frame.offsetY - safeLayout.minV * repeatY
  );
  texture.repeat.set(repeatX, repeatY);
  texture.needsUpdate = true;
}
