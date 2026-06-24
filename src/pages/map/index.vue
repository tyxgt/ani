<template>
  <view class="map-page">
    <image class="background" :src="backgroundUrl" mode="aspectFill" />

    <view class="header">
      <text class="title">中国地图</text>
    </view>

    <view class="error-msg" v-if="error">{{ error }}</view>

    <!-- #ifdef H5 -->
    <canvas
      class="map-container"
      id="mapChart"
      @click="onCanvasTap"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
    />
    <!-- #endif -->
    <!-- #ifndef H5 -->
    <canvas
      class="map-container"
      id="mapChart"
      canvas-id="mapChart"
      type="2d"
      @tap="onCanvasTap"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
    />
    <!-- #endif -->

    <view class="info-card" v-if="selectedRegion">
      <view class="info-left">
        <view
          class="region-image"
          :style="{ backgroundColor: regionColors[selectedRegion.name] || '#ccc' }"
        >
          <image
            v-if="selectedRegion.image"
            :src="selectedRegion.image"
            mode="aspectFill"
            class="region-img"
          />
        </view>
      </view>
      <view class="info-right">
        <view class="region-title-row">
          <PinyinText :text="selectedRegion.name" display-mode="horizontal" />
          <text class="sound-btn" @click="playSound">🔊</text>
        </view>
        <text class="region-desc">{{ selectedRegion.description }}</text>
        <view class="more-btn" @click="learnMore">
          <text class="more-btn-text">📖 了解更多</text>
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

// ─── Constants ────────────────────────────────────────────────
const backgroundUrl = ref(
  "https://tt4ee93854d08d513101-env-6dufeblnzf.tos-cn-beijing.volces.com/background.png"
);

const regionColors: Record<string, string> = {
  东北地区: "#7CB342",
  华北地区: "#FFB300",
  西北地区: "#FFA726",
  西南地区: "#5C6BC0",
  华中地区: "#EF5350",
  华东地区: "#FF7043",
  华南地区: "#AB47BC",
};

const SELECTED_COLOR = "#FFD54F";
const BORDER_COLOR = "#fff";
const BORDER_WIDTH = 3;
const SELECTED_BORDER_WIDTH = 6;

const regions = [
  {
    name: "东北地区",
    description: "这里有茂密的森林和肥沃的黑土地，冬天会下大雪哦！",
    image: "",
  },
  {
    name: "华北地区",
    description: "这里有雄伟的长城和广阔的平原，是中华文明的发源地之一。",
    image: "",
  },
  {
    name: "西北地区",
    description: "这里有大片的沙漠和美丽的绿洲，还有高高的天山呢！",
    image: "",
  },
  {
    name: "西南地区",
    description: "这里山很多，森林茂密，就像大熊猫的秘密花园！",
    image: "",
  },
  {
    name: "华中地区",
    description: "这里有很多湖泊和大河，是鱼米之乡，物产丰富！",
    image: "",
  },
  {
    name: "华东地区",
    description: "这里有江南水乡和美丽的海岸，经济发达，风景如画！",
    image: "",
  },
  {
    name: "华南地区",
    description: "这里天气炎热，有很多热带水果，还有美丽的海滩！",
    image: "",
  },
];

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
interface ProjectedPoint {
  x: number;
  y: number;
}
type Ring = ProjectedPoint[];
type Polygon = Ring[];
interface ProjectedFeature {
  name: string;
  pinyin: string;
  description: string;
  /** One entry per MultiPolygon polygon, each containing rings of projected points */
  polygons: Polygon[];
  /** Centroid in drawing-space coordinates */
  centroid: ProjectedPoint;
}

let projectedFeatures: ProjectedFeature[] = [];

/** Projection function: (lon, lat) → { x, y } in CSS-pixel drawing space */
let project: (lon: number, lat: number) => ProjectedPoint = () => ({ x: 0, y: 0 });

// ─── View transform (pan & zoom) ─────────────────────────────
let scale = 1;
let panX = 0;
let panY = 0;

const MIN_SCALE = 0.5;
const MAX_SCALE = 5;

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
const GEO_WEST = 73.5;
const GEO_EAST = 135.1;
const GEO_SOUTH = 18.1;
const GEO_NORTH = 53.6;

// ══════════════════════════════════════════════════════════════
//  Initialisation
// ══════════════════════════════════════════════════════════════

function buildProjection(w: number, h: number) {
  const geoW = GEO_EAST - GEO_WEST;
  const geoH = GEO_NORTH - GEO_SOUTH;
  const s = Math.min(w / geoW, h / geoH) * 0.85;
  const cx = w / 2;
  const cy = h / 2;
  const centerLon = (GEO_EAST + GEO_WEST) / 2;
  const centerLat = (GEO_NORTH + GEO_SOUTH) / 2;
  return (lon: number, lat: number) => ({
    x: (lon - centerLon) * s + cx,
    y: -(lat - centerLat) * s + cy,
  });
}

function preprojectFeatures() {
  const features = (regionData as any).features || [];
  projectedFeatures = features
    .filter((f: any) => regionColors[f.properties?.name])
    .map((f: any) => {
      const name = f.properties.name;
      const pinyin = f.properties.pinyin || "";
      const description = f.properties.description || "";
      const polygons: Polygon[] = f.geometry.coordinates.map(
        (poly: number[][][]) =>
          poly.map((ring: number[][]) =>
            ring.map((coord: number[]) => {
              const p = project(coord[0], coord[1]);
              return { x: p.x, y: p.y };
            })
          )
      );
      // centroid = average of all polygon point averages
      let sx = 0, sy = 0, count = 0;
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
      };
    });
}

// ─── Drawing ─────────────────────────────────────────────────

function draw() {
  if (!ctx || canvasW === 0 || canvasH === 0) return;

  // Clear
  ctx.clearRect(0, 0, canvasW, canvasH);

  ctx.save();

  // Apply view transform (pan + zoom) — centred on canvas
  ctx.translate(panX, panY);
  ctx.translate(canvasW / 2, canvasH / 2);
  ctx.scale(scale, scale);
  ctx.translate(-canvasW / 2, -canvasH / 2);

  // Draw each region
  projectedFeatures.forEach((pf) => {
    const isSelected = selectedRegion.value?.name === pf.name;
    const fillColor = isSelected ? SELECTED_COLOR : (regionColors[pf.name] || "#ccc");
    const borderWidth = isSelected ? SELECTED_BORDER_WIDTH : BORDER_WIDTH;

    pf.polygons.forEach((pg) => {
      pg.forEach((ring) => {
        if (ring.length < 3) return;
        ctx!.beginPath();
        ring.forEach((pt, i) => {
          i === 0 ? ctx!.moveTo(pt.x, pt.y) : ctx!.lineTo(pt.x, pt.y);
        });
        ctx!.closePath();

        // Fill
        ctx!.fillStyle = fillColor;
        ctx!.fill();

        // Stroke
        ctx!.strokeStyle = BORDER_COLOR;
        ctx!.lineWidth = borderWidth;
        ctx!.stroke();
      });
    });

    // Label
    drawLabel(ctx!, pf, isSelected);
  });

  ctx.restore();
}

function drawLabel(c: CanvasRenderingContext2D, pf: ProjectedFeature, isSelected: boolean) {
  const { x, y } = pf.centroid;
  const name = pf.name;
  const pinyin = pf.pinyin;

  // -- Pinyin line (smaller, above) --
  c.font = `10px "PingFang SC", "Microsoft YaHei", sans-serif`;
  c.textAlign = "center";
  c.textBaseline = "bottom";
  c.shadowColor = "rgba(0,0,0,0.6)";
  c.shadowBlur = 3;
  c.fillStyle = "rgba(255,255,255,0.9)";
  c.fillText(pinyin, x, y - 4);

  // -- Name line --
  c.font = `bold ${isSelected ? 16 : 14}px "PingFang SC", "Microsoft YaHei", sans-serif`;
  c.textBaseline = "top";
  c.shadowColor = "rgba(0,0,0,0.8)";
  c.shadowBlur = 4;
  c.fillStyle = "#fff";
  c.fillText(name, x, y + 2);

  // Reset shadow
  c.shadowBlur = 0;
}

// ─── Hit test (ray-casting) ─────────────────────────────────

function pointInRing(px: number, py: number, ring: ProjectedPoint[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i].x, yi = ring[i].y;
    const xj = ring[j].x, yj = ring[j].y;
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function hitTest(cssX: number, cssY: number): ProjectedFeature | null {
  // Inverse view transform
  const wx = (cssX - panX) / scale;
  const wy = (cssY - panY) / scale;

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

  uni.createSelectorQuery()
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
      uni.createSelectorQuery()
        .select("#mapChart")
        .boundingClientRect((r: any) => {
          if (r) canvasRect = { left: r.left, top: r.top };
        })
        .exec();

      onCanvasReady();
    });
}

function onCanvasReady() {
  project = buildProjection(canvasW, canvasH);
  preprojectFeatures();

  // Reset view transform
  scale = 1;
  panX = 0;
  panY = 0;

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

  uni.createSelectorQuery()
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
        project = buildProjection(canvasW, canvasH);
        preprojectFeatures();
        draw();
      }
      uni.createSelectorQuery()
        .select("#mapChart")
        .boundingClientRect((r: any) => {
          if (r) canvasRect = { left: r.left, top: r.top };
        })
        .exec();
    });
}

// ─── Event handlers ──────────────────────────────────────────

function getCanvasCoords(e: any): { x: number; y: number } | null {
  let pageX: number, pageY: number;

  // #ifdef H5
  // Native browser click / touch event
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
  return {
    x: pageX - canvasRect.left,
    y: pageY - canvasRect.top,
  };
  // #endif

  // #ifndef H5
  if (e.touches && e.touches.length > 0) {
    pageX = e.touches[0].x;
    pageY = e.touches[0].y;
  } else if (e.changedTouches && e.changedTouches.length > 0) {
    pageX = e.changedTouches[0].x;
    pageY = e.changedTouches[0].y;
  } else if (e.detail) {
    pageX = e.detail.x;
    pageY = e.detail.y;
  } else {
    return null;
  }
  return {
    x: pageX - canvasRect.left,
    y: pageY - canvasRect.top,
  };
  // #endif
}

function onCanvasTap(e: any) {
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
  if (!coords) return;

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
    // Pinch start
    const dx = touches[0].x - touches[1].x;
    const dy = touches[0].y - touches[1].y;
    touchState.lastDist = Math.sqrt(dx * dx + dy * dy);
    touchState.lastCX = (touches[0].x + touches[1].x) / 2;
    touchState.lastCY = (touches[0].y + touches[1].y) / 2;
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
    // Pinch zoom
    const dx = touches[0].x - touches[1].x;
    const dy = touches[0].y - touches[1].y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const cx = (touches[0].x + touches[1].x) / 2 - canvasRect.left;
    const cy = (touches[0].y + touches[1].y) / 2 - canvasRect.top;

    if (touchState.lastDist > 0) {
      const factor = dist / touchState.lastDist;
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale * factor));
      // Zoom toward pinch center
      const ratio = newScale / scale;
      panX = cx - ratio * (cx - panX);
      panY = cy - ratio * (cy - panY);
      scale = newScale;
      draw();
    }

    touchState.lastDist = dist;
    touchState.lastCX = cx;
    touchState.lastCY = cy;
  } else if (touchState.isPan) {
    // Pan
    const coords = getCanvasCoords(e);
    if (!coords) return;
    const dx = coords.x - touchState.lastCX;
    const dy = coords.y - touchState.lastCY;
    panX += dx;
    panY += dy;
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
    // Treat as tap — already handled by onCanvasTap via @click/@tap
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

<style lang="less" src="./index.less"></style>
