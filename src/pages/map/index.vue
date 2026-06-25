<template>
  <view
    :class="styles.mapPage"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
  >
    <image :class="styles.background" :src="backgroundUrl" mode="aspectFill" />

    <view :class="styles.header" @touchstart.stop @touchmove.stop @touchend.stop>
      <text :class="styles.title">中国地图</text>
    </view>

    <view :class="styles.errorMsg" v-if="error">{{ error }}</view>

    <!-- #ifdef H5 -->
    <view :class="styles.mapContainer">
      <canvas id="mapChart" type="2d" @click="onPageClick" />
    </view>
    <!-- #endif -->
    <!-- #ifndef H5 -->
    <view :class="styles.mapContainer">
      <canvas id="mapChart" canvas-id="mapChart" type="2d" @tap="onPageTap" />
    </view>
    <!-- #endif -->

    <view
      :class="styles.infoCard"
      v-if="selectedRegion"
      @touchstart.stop
      @touchmove.stop
      @touchend.stop
    >
      <view :class="styles.infoLeft">
        <view
          :class="styles.regionImage"
          :style="{ backgroundColor: regionColors[selectedRegion.name] || '#ccc' }"
        >
          <image
            v-if="selectedRegion.image"
            :src="selectedRegion.image"
            mode="aspectFill"
            :class="styles.regionImg"
          />
        </view>
      </view>
      <view :class="styles.infoRight">
        <view :class="styles.regionTitleRow">
          <PinyinText :text="selectedRegion.name" display-mode="horizontal" />
          <text :class="styles.soundBtn" @click="playSound">🔊</text>
        </view>
        <text :class="styles.regionDesc">{{ selectedRegion.description }}</text>
        <view :class="styles.moreBtn" @click="learnMore">
          <text :class="styles.moreBtnText">📖 了解更多</text>
        </view>
      </view>
    </view>

    <CustomTabBar :current="0" />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from "vue";
import regionData from "../../data/regions.json";
import CustomTabBar from "../../components/CustomTabBar";
import PinyinText from "../../components/PinyinText";
import {
  MAP_BACKGROUND_URL,
  REGION_COLORS,
  SELECTED_COLOR,
  BORDER_COLOR,
  BORDER_WIDTH,
  SELECTED_BORDER_WIDTH,
  REGIONS,
  LABEL_OFFSET_CONFIG,
  GEO_WEST,
  GEO_EAST,
  GEO_SOUTH,
  GEO_NORTH,
  HEADER_BOTTOM,
  INFO_CARD_TOP_OFFSET,
  MIN_SCALE,
  MAX_SCALE,
  LAT_STRETCH,
} from "../../constants";
import type { ProjectedPoint, Ring, Polygon, ProjectedFeature } from "../../types";

const backgroundUrl = ref(MAP_BACKGROUND_URL);
const regionColors = REGION_COLORS;
const regions = REGIONS;

// ─── State ────────────────────────────────────────────────────
const selectedRegion = ref<any>(null);
const error = ref<string | null>(null);

// ─── Canvas internals ─────────────────────────────────────────
let canvas: any = null;
let ctx: CanvasRenderingContext2D | null = null;

/** Canvas logical size (CSS pixels) */
let canvasW = 0;
let canvasH = 0;

let dpr = 1;

/** Cached bounding rect for hit-testing */
let canvasRect = { left: 0, top: 0 };

// ─── Map data internals ──────────────────────────────────────
let projectedFeatures: ProjectedFeature[] = [];

/** Projection function: (lon, lat) → { x, y } in CSS-pixel drawing space */
let project: (lon: number, lat: number) => ProjectedPoint = () => ({ x: 0, y: 0 });

// ─── View transform (pan & zoom) ─────────────────────────────
let scale = 1;
let panX = 0;
let panY = 0;

/** 限制 panX/panY 在合理范围内，防止地图完全移出画布 */
function clampPan() {
  if (!isFinite(panX) || !isFinite(panY)) {
    panX = 0;
    panY = 0;
  }
  if (canvasW === 0 || canvasH === 0 || !isFinite(scale) || scale <= 0) {
    panX = 0;
    panY = 0;
    return;
  }
  const maxOffsetX = canvasW * scale * 0.5 + canvasW * 0.5;
  const maxOffsetY = canvasH * scale * 0.5 + canvasH * 0.5;
  panX = Math.max(-maxOffsetX, Math.min(maxOffsetX, panX));
  panY = Math.max(-maxOffsetY, Math.min(maxOffsetY, panY));
}

// ─── Touch tracking ──────────────────────────────────────────
let touchState: {
  startTime: number;
  startX: number;
  startY: number;
  lastDist: number;
  lastCX: number;
  lastCY: number;
  isPan: boolean;
  isPinch: boolean;
} | null = null;

// ─── Geo bounds of the input data ────────────────────────────
// 地图形状的几何中心（所有顶点的经纬度均值），由 preprojectFeatures 计算
let geoMeanLon = 0;
let geoMeanLat = 0;

// ══════════════════════════════════════════════════════════════
//  Initialisation
// ══════════════════════════════════════════════════════════════

function fitToCanvas(
  w: number,
  h: number,
  meanLon: number,
  meanLat: number,
  visibleCenterX: number,
  visibleCenterY: number,
  visibleHeight: number,
  padding = 0.9
) {
  const geoW = GEO_EAST - GEO_WEST;
  const geoH = GEO_NORTH - GEO_SOUTH;
  const sFitWidth = w / geoW;
  const s = sFitWidth * padding;
  const sLat = s * LAT_STRETCH;
  return (lon: number, lat: number) => ({
    x: (lon - meanLon) * s + visibleCenterX,
    y: -(lat - meanLat) * sLat + visibleCenterY,
  });
}

/** 计算可视窗口中心（扣除 header 和 infoCard 后的中间区域） */
function getVisibleCenter(w: number, h: number) {
  const visibleTop = HEADER_BOTTOM;
  const visibleBottom = Math.max(visibleTop + 1, h - INFO_CARD_TOP_OFFSET);
  return {
    visibleCenterX: w / 2,
    visibleCenterY: (visibleTop + visibleBottom) / 2,
    visibleHeight: visibleBottom - visibleTop,
  };
}

function computeGeoCenter() {
  const features = (regionData as any).features || [];
  let minLon = Infinity,
    maxLon = -Infinity,
    minLat = Infinity,
    maxLat = -Infinity;
  features
    .filter((f: any) => regionColors[f.properties?.name])
    .forEach((f: any) => {
      f.geometry.coordinates.forEach((poly: number[][][]) => {
        poly.forEach((ring: number[][]) => {
          ring.forEach((coord: number[]) => {
            minLon = Math.min(minLon, coord[0]);
            maxLon = Math.max(maxLon, coord[0]);
            minLat = Math.min(minLat, coord[1]);
            maxLat = Math.max(maxLat, coord[1]);
          });
        });
      });
    });
  geoMeanLon = (minLon + maxLon) / 2;
  geoMeanLat = (minLat + maxLat) / 2;
}

function preprojectFeatures() {
  const features = (regionData as any).features || [];
  projectedFeatures = features
    .filter((f: any) => regionColors[f.properties?.name])
    .map((f: any) => {
      const name = f.properties.name;
      const pinyin = f.properties.pinyin || "";
      const description = f.properties.description || "";
      const polygons: Polygon[] = f.geometry.coordinates.map((poly: number[][][]) =>
        poly.map((ring: number[][]) =>
          ring.map((coord: number[]) => {
            const p = project(coord[0], coord[1]);
            return { x: p.x, y: p.y };
          })
        )
      );
      // centroid = average of all polygon point averages
      let sx = 0,
        sy = 0,
        count = 0;
      polygons.forEach((pg) =>
        pg.forEach((ring) => {
          ring.forEach((pt) => {
            sx += pt.x;
            sy += pt.y;
            count++;
          });
        })
      );
      return {
        name,
        pinyin,
        description,
        polygons,
        centroid: count > 0 ? { x: sx / count, y: sy / count } : { x: 0, y: 0 },
        angle: computeAngle(polygons),
      };
    });
}

/** 计算多边形的主轴角度 */
function computeAngle(polygons: Polygon[]): number {
  // 收集所有点
  const pts: { x: number; y: number }[] = [];
  polygons.forEach((pg) => pg.forEach((ring) => ring.forEach((pt) => pts.push(pt))));

  if (pts.length === 0) return 0;

  // 计算中心点
  let cx = 0,
    cy = 0;
  pts.forEach((p) => {
    cx += p.x;
    cy += p.y;
  });
  cx /= pts.length;
  cy /= pts.length;

  // 计算协方差
  let xx = 0,
    yy = 0,
    xy = 0;
  pts.forEach((p) => {
    const dx = p.x - cx,
      dy = p.y - cy;
    xx += dx * dx;
    yy += dy * dy;
    xy += dx * dy;
  });

  // 计算主轴角度
  return Math.atan2(2 * xy, xx - yy) / 2;
}

// ─── Drawing ─────────────────────────────────────────────────

function draw() {
  if (!ctx || canvasW === 0 || canvasH === 0) return;
  if (!isFinite(panX) || !isFinite(panY) || !isFinite(scale) || scale <= 0) {
    panX = 0;
    panY = 0;
    scale = 1.5;
  }

  try {
    ctx.clearRect(0, 0, canvasW, canvasH);

    ctx.save();

    ctx.translate(panX, panY);
    ctx.translate(canvasW / 2, canvasH / 2);
    ctx.scale(scale, scale);
    ctx.translate(-canvasW / 2, -canvasH / 2);

    projectedFeatures.forEach((pf) => {
      const isSelected = selectedRegion.value?.name === pf.name;
      const fillColor = isSelected ? SELECTED_COLOR : regionColors[pf.name] || "#ccc";
      const borderWidth = isSelected ? SELECTED_BORDER_WIDTH : BORDER_WIDTH;

      pf.polygons.forEach((pg) => {
        pg.forEach((ring) => {
          if (ring.length < 3) return;
          ctx!.beginPath();
          ring.forEach((pt, i) => {
            i === 0 ? ctx!.moveTo(pt.x, pt.y) : ctx!.lineTo(pt.x, pt.y);
          });
          ctx!.closePath();

          ctx!.fillStyle = fillColor;
          ctx!.fill();

          ctx!.strokeStyle = BORDER_COLOR;
          ctx!.lineWidth = borderWidth;
          ctx!.stroke();
        });
      });

      drawLabel(ctx!, pf, isSelected);
    });

    ctx.restore();
  } catch (err) {
    console.error("draw error:", err);
    if (ctx) {
      try {
        ctx.restore();
      } catch (e) {}
    }
  }
}

function drawLabel(
  c: CanvasRenderingContext2D,
  pf: ProjectedFeature,
  isSelected: boolean
) {
  const { x, y } = pf.centroid;
  const name = pf.name;
  const pinyin = pf.pinyin;

  // 获取手动配置，如果没有则使用自动计算的值
  const config = LABEL_OFFSET_CONFIG[name] || { x: 0, y: 0 };
  const finalX = x + (config.x || 0);
  const finalY = y + (config.y || 0);
  const angle = config.angle !== undefined ? config.angle : pf.angle;

  c.save();
  c.translate(finalX, finalY);
  c.rotate(angle);

  // -- Pinyin line (smaller, above) --
  c.font = `6px "PingFang SC", "Microsoft YaHei", sans-serif`;
  c.textAlign = "center";
  c.textBaseline = "bottom";
  c.shadowColor = "rgba(0,0,0,0.6)";
  c.shadowBlur = 3;
  c.fillStyle = "rgba(255,255,255,0.9)";
  c.fillText(pinyin, 0, -1);

  // -- Name line --
  c.font = `bold ${isSelected ? 9 : 7}px "PingFang SC", "Microsoft YaHei", sans-serif`;
  c.textBaseline = "top";
  c.shadowColor = "rgba(0,0,0,0.8)";
  c.shadowBlur = 4;
  c.fillStyle = "#fff";
  c.fillText(name, 0, 0);

  c.restore();
}

// ─── Hit test (ray-casting) ─────────────────────────────────

function pointInRing(px: number, py: number, ring: ProjectedPoint[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i].x,
      yi = ring[i].y;
    const xj = ring[j].x,
      yj = ring[j].y;
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function hitTest(cssX: number, cssY: number): ProjectedFeature | null {
  const wx = (cssX - panX - canvasW / 2) / scale + canvasW / 2;
  const wy = (cssY - panY - canvasH / 2) / scale + canvasH / 2;

  // Test in reverse order so topmost (last-drawn) wins — same as ECharts behaviour
  for (let i = projectedFeatures.length - 1; i >= 0; i--) {
    const pf = projectedFeatures[i];
    for (const pg of pf.polygons) {
      for (const ring of pg) {
        if (pointInRing(wx, wy, ring)) {
          return pf;
        }
      }
    }
  }
  return null;
}

// ─── Canvas initialisation (platform-specific) ──────────────

function initCanvas() {
  const info = uni.getSystemInfoSync();
  dpr = info.pixelRatio || 1;

  uni
    .createSelectorQuery()
    .select("#mapChart")
    .fields({ node: true, size: true }, () => {})
    .exec((res: any) => {
      if (!res || !res[0] || !res[0].node) {
        error.value = "Canvas node not found";
        return;
      }
      const node = res[0].node;
      canvasW = res[0].width;
      canvasH = res[0].height;
      node.width = canvasW * dpr;
      node.height = canvasH * dpr;
      const c = node.getContext("2d");
      if (!c) {
        error.value = "Canvas 2D context not available";
        return;
      }
      c.scale(dpr, dpr);
      canvas = node;
      ctx = c;

      // Get bounding rect for hit-testing
      uni
        .createSelectorQuery()
        .select("#mapChart")
        .boundingClientRect((r: any) => {
          if (r) canvasRect = { left: r.left, top: r.top };
        })
        .exec();

      onCanvasReady();
    });
}

function onCanvasReady() {
  computeGeoCenter();
  const vis = getVisibleCenter(canvasW, canvasH);
  project = fitToCanvas(
    canvasW,
    canvasH,
    geoMeanLon,
    geoMeanLat,
    vis.visibleCenterX,
    vis.visibleCenterY,
    vis.visibleHeight
  );
  preprojectFeatures();

  // Reset view transform
  scale = 1.3;
  panX = 0;
  panY = 0;
  clampPan();

  draw();

  // Auto-select 华中地区 after a brief delay
  setTimeout(() => {
    const region = regions.find((r) => r.name === "华中地区");
    if (region) {
      selectedRegion.value = region;
      draw();
    }
  }, 300);
}

// ─── Resize ──────────────────────────────────────────────────

function handleResize() {
  const info = uni.getSystemInfoSync();
  dpr = info.pixelRatio || 1;

  uni
    .createSelectorQuery()
    .select("#mapChart")
    .fields({ node: true, size: true }, () => {})
    .exec((res: any) => {
      if (!res || !res[0] || !res[0].node) return;
      const node = res[0].node;
      canvasW = res[0].width;
      canvasH = res[0].height;
      node.width = canvasW * dpr;
      node.height = canvasH * dpr;
      ctx = node.getContext("2d");
      if (ctx) {
        ctx.scale(dpr, dpr);
        computeGeoCenter();
        const vis = getVisibleCenter(canvasW, canvasH);
        project = fitToCanvas(
          canvasW,
          canvasH,
          geoMeanLon,
          geoMeanLat,
          vis.visibleCenterX,
          vis.visibleCenterY,
          vis.visibleHeight
        );
        preprojectFeatures();
        draw();
      }
      uni
        .createSelectorQuery()
        .select("#mapChart")
        .boundingClientRect((r: any) => {
          if (r) canvasRect = { left: r.left, top: r.top };
        })
        .exec();
    });
}

// ─── Event handlers ──────────────────────────────────────────

function getTouchPoint(touch: any): { x: number; y: number } {
  // #ifdef H5
  return { x: touch.clientX, y: touch.clientY };
  // #endif
  // #ifndef H5
  // 小程序中优先使用 pageX/pageY（CSS像素），其次是 clientX/clientY，最后是 x/y
  const px = touch.pageX ?? touch.clientX ?? touch.x;
  const py = touch.pageY ?? touch.clientY ?? touch.y;
  return { x: px, y: py };
  // #endif
}

function getCanvasCoords(e: any): { x: number; y: number } | null {
  let pageX: number, pageY: number;

  // #ifdef H5
  if (e.touches && e.touches.length > 0) {
    pageX = e.touches[0].clientX;
    pageY = e.touches[0].clientY;
  } else if (e.changedTouches && e.changedTouches.length > 0) {
    pageX = e.changedTouches[0].clientX;
    pageY = e.changedTouches[0].clientY;
  } else {
    pageX = e.clientX;
    pageY = e.clientY;
  }
  // #endif

  // #ifndef H5
  // 小程序中优先使用 pageX/pageY（CSS像素），不除以 dpr
  const touch = e.touches?.[0] || e.changedTouches?.[0];
  if (touch) {
    pageX = touch.pageX ?? touch.clientX ?? touch.x;
    pageY = touch.pageY ?? touch.clientY ?? touch.y;
  } else if (e.detail) {
    pageX = e.detail.pageX ?? e.detail.x;
    pageY = e.detail.pageY ?? e.detail.y;
  } else {
    return null;
  }
  // #endif

  if (typeof pageX !== "number" || typeof pageY !== "number") return null;
  if (!isFinite(pageX) || !isFinite(pageY)) return null;

  return {
    x: pageX - canvasRect.left,
    y: pageY - canvasRect.top,
  };
}

function onPageClick(e: any) {
  onCanvasTap(e);
}

function onPageTap(e: any) {
  onCanvasTap(e);
}

function onCanvasTap(e: any) {
  // 移除 touchState 检查，允许在 pan/pinch 后抬起时也能触发选择
  const coords = getCanvasCoords(e);
  if (!coords) return;
  const hit = hitTest(coords.x, coords.y);
  if (hit) {
    const region = regions.find((r) => r.name === hit.name);
    if (region) {
      selectedRegion.value = region;
      draw();
    }
  }
}

// ─── Touch pan & zoom ────────────────────────────────────────

function onTouchStart(e: any) {
  const touches = e.touches;
  if (!touches || touches.length === 0) return;

  const coords = getCanvasCoords(e);
  if (!coords || !isFinite(coords.x) || !isFinite(coords.y)) return;

  touchState = {
    startTime: Date.now(),
    startX: coords.x,
    startY: coords.y,
    lastDist: 0,
    lastCX: coords.x,
    lastCY: coords.y,
    isPan: true,
    isPinch: false,
  };

  if (touches.length >= 2) {
    const t0 = getTouchPoint(touches[0]);
    const t1 = getTouchPoint(touches[1]);
    if (!isFinite(t0.x) || !isFinite(t0.y) || !isFinite(t1.x) || !isFinite(t1.y)) return;
    const dx = t0.x - t1.x;
    const dy = t0.y - t1.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (!isFinite(dist) || dist <= 0) return;
    touchState.lastDist = dist;
    const cx = (t0.x + t1.x) / 2 - canvasRect.left;
    const cy = (t0.y + t1.y) / 2 - canvasRect.top;
    touchState.lastCX = cx;
    touchState.lastCY = cy;
    touchState.isPan = false;
    touchState.isPinch = true;
  }
}

function onTouchMove(e: any) {
  if (!touchState) return;
  const touches = e.touches;
  if (!touches || touches.length === 0) return;
  e.preventDefault?.();

  if (touches.length >= 2 && touchState.isPinch) {
    const t0 = getTouchPoint(touches[0]);
    const t1 = getTouchPoint(touches[1]);
    if (!isFinite(t0.x) || !isFinite(t0.y) || !isFinite(t1.x) || !isFinite(t1.y)) return;
    const dx = t0.x - t1.x;
    const dy = t0.y - t1.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (!isFinite(dist) || dist <= 0) return;
    const cx = (t0.x + t1.x) / 2 - canvasRect.left;
    const cy = (t0.y + t1.y) / 2 - canvasRect.top;
    if (!isFinite(cx) || !isFinite(cy)) return;

    if (touchState.lastDist > 0) {
      const factor = dist / touchState.lastDist;
      if (!isFinite(factor) || factor <= 0) return;
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale * factor));
      if (!isFinite(newScale) || newScale <= 0) return;
      const ratio = newScale / scale;
      panX = (cx - canvasW / 2) * (1 - ratio) + ratio * panX;
      panY = (cy - canvasH / 2) * (1 - ratio) + ratio * panY;
      scale = newScale;
      clampPan();
      draw();
    }

    touchState.lastDist = dist;
    touchState.lastCX = cx;
    touchState.lastCY = cy;
  } else if (touchState.isPan) {
    const coords = getCanvasCoords(e);
    if (!coords || !isFinite(coords.x) || !isFinite(coords.y)) return;
    if (!isFinite(touchState.lastCX) || !isFinite(touchState.lastCY)) {
      touchState.lastCX = coords.x;
      touchState.lastCY = coords.y;
      return;
    }
    const dx = coords.x - touchState.lastCX;
    const dy = coords.y - touchState.lastCY;
    if (!isFinite(dx) || !isFinite(dy)) return;
    panX += dx;
    panY += dy;
    clampPan();
    touchState.lastCX = coords.x;
    touchState.lastCY = coords.y;
    draw();
  }
}

function onTouchEnd(e: any) {
  if (!touchState) return;

  const touches = e.touches;
  if (touches && touches.length > 0) {
    // Still have fingers down — update state
    if (touches.length === 1) {
      const coords = getCanvasCoords(e);
      if (coords) {
        touchState.isPinch = false;
        touchState.isPan = true;
        touchState.lastCX = coords.x;
        touchState.lastCY = coords.y;
      }
    }
    return;
  }

  // All fingers up — detect tap (short touch, minimal movement)
  const elapsed = Date.now() - touchState.startTime;
  const dx = (touchState.lastCX || touchState.startX) - touchState.startX;
  const dy = (touchState.lastCY || touchState.startY) - touchState.startY;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (elapsed < 200 && dist < 10) {
    // 在 touchEnd 中主动处理 tap 事件
    const coords = {
      x: touchState.lastCX || touchState.startX,
      y: touchState.lastCY || touchState.startY,
    };
    const hit = hitTest(coords.x, coords.y);
    if (hit) {
      const region = regions.find((r) => r.name === hit.name);
      if (region) {
        selectedRegion.value = region;
        draw();
      }
    }
  }

  touchState = null;
}

// ─── Lifecycle ───────────────────────────────────────────────

onMounted(() => {
  nextTick(() => {
    setTimeout(() => {
      initCanvas();
      // #ifdef H5
      window.addEventListener("resize", handleResize);
      // #endif
      // #ifndef H5
      uni.onWindowResize(handleResize);
      // #endif
    }, 100);
  });
});

onUnmounted(() => {
  // #ifdef H5
  window.removeEventListener("resize", handleResize);
  // #endif
  // #ifndef H5
  uni.offWindowResize(handleResize);
  // #endif
  ctx = null;
  canvas = null;
  projectedFeatures = [];
});

// ─── Placeholder actions ─────────────────────────────────────

const playSound = () => {
  uni.showToast({ title: "播放中...", icon: "none" });
};

const learnMore = () => {
  uni.showToast({ title: "了解更多", icon: "none" });
};
</script>

<style lang="less" src="./index.less" module="styles"></style>
