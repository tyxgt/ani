<template>
  <AuthGate>
  <view
    :class="styles.mapPage"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
  >
    <view :class="styles.bgWrap">
      <view v-if="!bgLoaded" :class="styles.bgSkeleton" />
      <image :class="styles.background" :src="backgroundUrl" mode="aspectFill" @load="bgLoaded = true" />
    </view>

    <view :class="styles.header" @touchstart.stop @touchmove.stop @touchend.stop>
      <PinyinText
        :class="styles.title"
        text="中国地图"
        :char-style="{
          fontSize: '40px',
          fontWeight: 'bold',
          color: '#1565C0',
          textShadow: '2px 2px 4px rgba(255, 255, 255, 0.8), -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff',
          letterSpacing: '4px'
        }"
        :pinyin-style="{
          fontSize: '20px',
          fontWeight: 'bold',
          color: '#1565C0',
          textShadow: '2px 2px 4px rgba(255, 255, 255, 0.8), -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff',
          letterSpacing: '4px',
          marginBottom: '4px'
        }"
      />
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
    >
      <view :class="styles.infoLeft">
        <view :class="styles.regionImage">
          <view v-if="!regionImgLoaded" :class="styles.regionImgSkeleton" />
          <image
            :src="REGION_IMAGE_URLS[selectedRegion.name]"
            mode="aspectFill"
            :class="styles.regionImg"
            @load="regionImgLoaded = true"
          />
        </view>
      </view>
      <view :class="styles.infoRight">
        <view :class="styles.titleRow">
          <view :class="styles.regionTitleRow">
            <PinyinText
              :text="selectedRegion.name"
              display-mode="horizontal"
              :char-style="{ fontSize: '16px' }"
              :pinyin-style="{ fontSize: '14px', marginBottom: '0px' }"
            />
          </view>
          <view :class="styles.moreBtn" @click="learnMore">
            <text :class="styles.moreBtnText" @click="learnMore">了解更多</text>
          </view>
        </view>
        <text :class="styles.regionDesc">{{ selectedRegion.description }}</text>
      </view>
    </view>

    <CustomTabBar current="/pages/index/index" />
  </view>
  </AuthGate>
</template>

<script setup lang="ts">
import AuthGate from "../../components/AuthGate";
import { ref, onMounted, onUnmounted, nextTick, watch } from "vue";
import regionData from "../../data/regions.json";
import CustomTabBar from "../../components/CustomTabBar";
import PinyinText from "../../components/PinyinText";
import {
  MAP_BACKGROUND_URL,
  REGION_COLORS,
  REGION_IMAGE_URLS,
  REGION_IMAGE_CONFIG,
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
const bgLoaded = ref(false);
const regionImgLoaded = ref(false);

watch(selectedRegion, () => {
  regionImgLoaded.value = false;
});

// ─── Canvas internals ─────────────────────────────────────────
let canvas: any = null;
let ctx: CanvasRenderingContext2D | null = null;

// ─── Region background images ─────────────────────────────────
const regionImages: Record<string, any> = {};

// ─── Offscreen canvas cache ─────────────────────────────────
let offscreenCanvas: any = null;
let offscreenCtx: CanvasRenderingContext2D | null = null;
let offscreenDirty = true;

function ensureOffscreenCanvas(): boolean {
  if (offscreenCanvas && offscreenCtx) {
    // #ifdef H5
    const expectedW = Math.max(1, Math.floor(canvasW * dpr));
    const expectedH = Math.max(1, Math.floor(canvasH * dpr));
    if (offscreenCanvas.width !== expectedW || offscreenCanvas.height !== expectedH) {
      offscreenCanvas.width = expectedW;
      offscreenCanvas.height = expectedH;
      offscreenCtx = offscreenCanvas.getContext("2d");
      if (offscreenCtx) (offscreenCtx as CanvasRenderingContext2D).scale(dpr, dpr);
      offscreenDirty = true;
    }
    // #endif
    return true;
  }

  // #ifdef H5
  offscreenCanvas = document.createElement("canvas");
  offscreenCanvas.width = Math.max(1, Math.floor(canvasW * dpr));
  offscreenCanvas.height = Math.max(1, Math.floor(canvasH * dpr));
  offscreenCtx = offscreenCanvas.getContext("2d");
  if (offscreenCtx) (offscreenCtx as CanvasRenderingContext2D).scale(dpr, dpr);
  return !!offscreenCtx;
  // #endif

  // #ifndef H5
  try {
    if (typeof uni !== "undefined" && (uni as any).createOffscreenCanvas) {
      offscreenCanvas = (uni as any).createOffscreenCanvas({
        type: "2d",
        width: Math.max(1, Math.floor(canvasW * dpr)),
        height: Math.max(1, Math.floor(canvasH * dpr)),
      });
      offscreenCtx = offscreenCanvas.getContext("2d");
      if (offscreenCtx) (offscreenCtx as CanvasRenderingContext2D).scale(dpr, dpr);
      return !!offscreenCtx;
    }
  } catch (e) {
    console.warn("[Map] Offscreen canvas not available:", e);
  }
  return false;
  // #endif
}

function renderToOffscreen() {
  if (!ensureOffscreenCanvas() || !offscreenCtx || canvasW === 0 || canvasH === 0) {
    offscreenDirty = true;
    return;
  }
  offscreenDirty = false;

  offscreenCtx.clearRect(0, 0, canvasW, canvasH);

  projectedFeatures.forEach((pf) => {
    const regionImage = regionImages[pf.name];
    const imageConfig = REGION_IMAGE_CONFIG[pf.name];

    if (!regionImage || !imageConfig) {
      const fillColor = regionColors[pf.name] || "#ccc";
      offscreenCtx!.beginPath();
      pf.polygons.forEach((pg) => {
        pg.forEach((ring) => {
          if (ring.length < 3) return;
          ring.forEach((pt, i) => {
            i === 0 ? offscreenCtx!.moveTo(pt.x, pt.y) : offscreenCtx!.lineTo(pt.x, pt.y);
          });
          offscreenCtx!.closePath();
        });
      });
      offscreenCtx!.fillStyle = fillColor;
      offscreenCtx!.fill();
      offscreenCtx!.strokeStyle = BORDER_COLOR;
      offscreenCtx!.lineWidth = BORDER_WIDTH;
      offscreenCtx!.stroke();
    } else {
      offscreenCtx!.beginPath();
      pf.polygons.forEach((pg) => {
        pg.forEach((ring) => {
          if (ring.length < 3) return;
          ring.forEach((pt, i) => {
            i === 0 ? offscreenCtx!.moveTo(pt.x, pt.y) : offscreenCtx!.lineTo(pt.x, pt.y);
          });
          offscreenCtx!.closePath();
        });
      });
      offscreenCtx!.strokeStyle = BORDER_COLOR;
      offscreenCtx!.lineWidth = BORDER_WIDTH;
      offscreenCtx!.stroke();
    }
  });
}

/** Canvas logical size (CSS pixels) */
let canvasW = 0;
let canvasH = 0;

let dpr = 1;

/** Cached bounding rect for hit-testing */
let canvasRect = { left: 0, top: 0 };

// ─── Render scheduling ──────────────────────────────────────
let needsRedraw = false;
let rafId: number | null = null;

function scheduleDraw() {
  needsRedraw = true;
  if (rafId) return;
  const requestFn: (cb: FrameRequestCallback) => number =
    typeof requestAnimationFrame !== "undefined"
      ? requestAnimationFrame
      : ((cb: FrameRequestCallback) => setTimeout(cb, 16)) as any;
  rafId = requestFn(() => {
    rafId = null;
    if (needsRedraw) {
      needsRedraw = false;
      draw();
    }
  });
}

// ─── Map data internals ──────────────────────────────────────
let projectedFeatures: ProjectedFeature[] = [];
// 性能优化：projectedFeatures 只依赖画布尺寸（project 函数由 canvasW/canvasH
// 决定），页面重新 mount 时如果画布尺寸和上次一致就直接复用，跳过整轮坐标
// 投影 + computeAngle + getPolygonBBox 计算；这些变量是模块级的，在会话内
// 跨 mount 存活，resize 时 canvasW/canvasH 变化会让 cacheKey 变化，缓存自动
// 失效并重算。
let projectedCacheKey: string | null = null;

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
// 几何中心只依赖静态的 regionData，和画布尺寸无关，算一次永久有效，
// 不需要在每次 resize/重新 mount 时重算。
let geoCenterComputed = false;

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
  if (geoCenterComputed) return;
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
  geoCenterComputed = true;
}

function preprojectFeatures() {
  // 画布尺寸没变时直接复用上次的投影结果，跳过整轮坐标投影 + computeAngle +
  // getPolygonBBox；resize 后 canvasW/canvasH 变化，cacheKey 自然不同，会正常重算。
  const cacheKey = `${canvasW}x${canvasH}`;
  if (projectedCacheKey === cacheKey && projectedFeatures.length > 0) {
    return;
  }
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
        bbox: getPolygonBBox(polygons),
      };
    });
  projectedCacheKey = cacheKey;
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

/** 计算多边形的包围盒 */
function getPolygonBBox(polygons: Polygon[]) {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  polygons.forEach((pg) =>
    pg.forEach((ring) => {
      ring.forEach((pt) => {
        minX = Math.min(minX, pt.x);
        minY = Math.min(minY, pt.y);
        maxX = Math.max(maxX, pt.x);
        maxY = Math.max(maxY, pt.y);
      });
    })
  );
  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  };
}

function isBBoxVisible(
  bbox: { minX: number; minY: number; maxX: number; maxY: number },
  viewLeft: number,
  viewTop: number,
  viewRight: number,
  viewBottom: number
): boolean {
  return !(bbox.maxX < viewLeft || bbox.minX > viewRight || bbox.maxY < viewTop || bbox.minY > viewBottom);
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

    // 计算当前变换下的可视矩形（用于视口裁剪）
    const invScale = 1 / scale;
    const viewLeft = (-panX - canvasW / 2) * invScale + canvasW / 2;
    const viewTop = (-panY - canvasH / 2) * invScale + canvasH / 2;
    const viewRight = (canvasW - panX - canvasW / 2) * invScale + canvasW / 2;
    const viewBottom = (canvasH - panY - canvasH / 2) * invScale + canvasH / 2;

    // 如果离屏缓存可用且需要更新，先渲染离屏缓存
    if (offscreenDirty && offscreenCanvas) {
      renderToOffscreen();
    }

    // 使用离屏缓存作为静态底图，若不可用则回退到直接绘制
    if (offscreenCanvas) {
      ctx.drawImage(offscreenCanvas, 0, 0, canvasW, canvasH);
    } else {
      projectedFeatures.forEach((pf) => {
        if (!isBBoxVisible(pf.bbox, viewLeft, viewTop, viewRight, viewBottom)) return;
        const regionImage = regionImages[pf.name];
        const imageConfig = REGION_IMAGE_CONFIG[pf.name];
        if (!regionImage || !imageConfig) {
          const fillColor = regionColors[pf.name] || "#ccc";
          ctx!.beginPath();
          pf.polygons.forEach((pg) => {
            pg.forEach((ring) => {
              if (ring.length < 3) return;
              ring.forEach((pt, i) => {
                i === 0 ? ctx!.moveTo(pt.x, pt.y) : ctx!.lineTo(pt.x, pt.y);
              });
              ctx!.closePath();
            });
          });
          ctx!.fillStyle = fillColor;
          ctx!.fill();
          ctx!.strokeStyle = BORDER_COLOR;
          ctx!.lineWidth = BORDER_WIDTH;
          ctx!.stroke();
        } else {
          ctx!.beginPath();
          pf.polygons.forEach((pg) => {
            pg.forEach((ring) => {
              if (ring.length < 3) return;
              ring.forEach((pt, i) => {
                i === 0 ? ctx!.moveTo(pt.x, pt.y) : ctx!.lineTo(pt.x, pt.y);
              });
              ctx!.closePath();
            });
          });
          ctx!.strokeStyle = BORDER_COLOR;
          ctx!.lineWidth = BORDER_WIDTH;
          ctx!.stroke();
        }
      });
    }

    // 绘制动态内容：背景图、选中边框、标签
    projectedFeatures.forEach((pf) => {
      if (!isBBoxVisible(pf.bbox, viewLeft, viewTop, viewRight, viewBottom)) return;
      const isSelected = selectedRegion.value?.name === pf.name;
      const regionImage = regionImages[pf.name];
      const imageConfig = REGION_IMAGE_CONFIG[pf.name];
      const borderWidth = isSelected ? SELECTED_BORDER_WIDTH : BORDER_WIDTH;

      const buildPath = () => {
        ctx!.beginPath();
        pf.polygons.forEach((pg) => {
          pg.forEach((ring) => {
            if (ring.length < 3) return;
            ring.forEach((pt, i) => {
              i === 0 ? ctx!.moveTo(pt.x, pt.y) : ctx!.lineTo(pt.x, pt.y);
            });
            ctx!.closePath();
          });
        });
      };

      const strokePath = () => {
        ctx!.beginPath();
        pf.polygons.forEach((pg) => {
          pg.forEach((ring) => {
            if (ring.length < 3) return;
            ring.forEach((pt, i) => {
              i === 0 ? ctx!.moveTo(pt.x, pt.y) : ctx!.lineTo(pt.x, pt.y);
            });
            ctx!.closePath();
          });
        });
        ctx!.strokeStyle = BORDER_COLOR;
        ctx!.lineWidth = borderWidth;
        ctx!.stroke();
      };

      if (regionImage && imageConfig) {
        const bbox = getPolygonBBox(pf.polygons);
        const imgW = regionImage.width;
        const imgH = regionImage.height;
        let targetW: number, targetH: number;

        switch (imageConfig.fit) {
          case 'fill':
            targetW = bbox.width;
            targetH = bbox.height;
            break;
          case 'contain': {
            const ratio = Math.min(bbox.width / imgW, bbox.height / imgH);
            targetW = imgW * ratio;
            targetH = imgH * ratio;
            break;
          }
          case 'cover':
          default: {
            const ratio = Math.max(bbox.width / imgW, bbox.height / imgH);
            targetW = imgW * ratio;
            targetH = imgH * ratio;
            break;
          }
        }

        targetW *= imageConfig.scale;
        targetH *= imageConfig.scale;

        const drawX = bbox.centerX - targetW / 2 + imageConfig.offsetX;
        const drawY = bbox.centerY - targetH / 2 + imageConfig.offsetY;

        ctx!.save();
        buildPath();
        ctx!.clip();
        ctx!.drawImage(regionImage, drawX, drawY, targetW, targetH);
        ctx!.restore();

        // 重绘边框以覆盖背景图
        strokePath();
      } else if (isSelected) {
        // 无背景图区域选中时，重绘 2px 边框
        strokePath();
      }

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
  c.font = `bold 6px "PingFang SC", "Microsoft YaHei", sans-serif`;
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

let initCanvasRetryCount = 0;

function proceedCanvasInit(node: any) {
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
}

function initCanvas() {
  const info = uni.getSystemInfoSync();
  const rawDpr = info.pixelRatio || 1;
  dpr = Math.min(rawDpr, 2);

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

      // 尺寸为0时重试
      if ((canvasW === 0 || canvasH === 0) && initCanvasRetryCount < 3) {
        initCanvasRetryCount++;
        console.warn(`[Map] Canvas size zero (${canvasW}x${canvasH}), retry ${initCanvasRetryCount}/3...`);
        setTimeout(initCanvas, 200);
        return;
      }

      // 最终备选：boundingClientRect
      if (canvasW === 0 || canvasH === 0) {
        uni.createSelectorQuery()
          .select("#mapChart")
          .boundingClientRect((r: any) => {
            if (r && r.width > 0 && r.height > 0) {
              canvasW = r.width;
              canvasH = r.height;
              initCanvasRetryCount = 0;
              proceedCanvasInit(node);
            } else {
              error.value = "Canvas size unavailable";
            }
          })
          .exec();
        return;
      }

      initCanvasRetryCount = 0;
      proceedCanvasInit(node);
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

  scale = 1.3;
  panX = 0;
  panY = 0;
  clampPan();

  offscreenDirty = true;
  scheduleDraw();

  loadRegionImages();

  setTimeout(() => {
    uni
      .createSelectorQuery()
      .select("#mapChart")
      .boundingClientRect((r: any) => {
        if (r) canvasRect = { left: r.left, top: r.top };
      })
      .exec();
  }, 100);

  setTimeout(() => {
    const region = regions.find((r) => r.name === "华中地区");
    if (region) {
      selectedRegion.value = region;
      scheduleDraw();
    }
  }, 300);
}

function loadRegionImages() {
  // #ifdef H5
  Object.entries(REGION_IMAGE_URLS).forEach(([name, url]) => {
    const img = new Image();
    img.onload = () => {
      regionImages[name] = img;
      offscreenDirty = true;
      scheduleDraw();
    };
    img.onerror = () => {
      console.error(`Failed to load ${name} image`);
    };
    img.src = url;
  });
  // #endif

  // #ifndef H5
  Object.entries(REGION_IMAGE_URLS).forEach(([name, url]) => {
    uni.getImageInfo({
      src: url,
      success: (res) => {
        const img = canvas.createImage();
        img.onload = () => {
          regionImages[name] = img;
          offscreenDirty = true;
          scheduleDraw();
        };
        img.onerror = () => {
          console.error(`Failed to load ${name} image in canvas`);
        };
        img.src = res.path;
      },
      fail: (err) => {
        console.error(`Failed to get ${name} image info:`, err);
      }
    });
  });
  // #endif
}

// ─── Resize ──────────────────────────────────────────────────

function handleResize() {
  const info = uni.getSystemInfoSync();
  const rawDpr = info.pixelRatio || 1;
  dpr = Math.min(rawDpr, 2);

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
        offscreenDirty = true;
        scheduleDraw();
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
    pageX = e.touches[0].pageX;
    pageY = e.touches[0].pageY;
  } else if (e.changedTouches && e.changedTouches.length > 0) {
    pageX = e.changedTouches[0].pageX;
    pageY = e.changedTouches[0].pageY;
  } else {
    pageX = e.pageX || e.clientX;
    pageY = e.pageY || e.clientY;
  }
  // #endif

  // #ifndef H5
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

  // #ifdef H5
  if (canvas && canvas.getBoundingClientRect) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: pageX - rect.left - window.scrollX,
      y: pageY - rect.top - window.scrollY,
    };
  }
  // #endif

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
      scheduleDraw();
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
      scheduleDraw();
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
    scheduleDraw();
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
        scheduleDraw();
      }
    }
  }

  touchState = null;
}

// ─── Lifecycle ───────────────────────────────────────────────

onMounted(() => {
  // 去掉之前硬编码的 300ms 延迟：initCanvas 内部已有基于画布尺寸为 0 的
  // 重试兜底（最多 3 次、间隔 200ms），不需要这层额外等待。
  nextTick(() => {
    initCanvas();
    // #ifdef H5
    window.addEventListener("resize", handleResize);
    // #endif
    // #ifndef H5
    uni.onWindowResize(handleResize);
    // #endif
  });
});

onUnmounted(() => {
  // #ifdef H5
  window.removeEventListener("resize", handleResize);
  // #endif
  // #ifndef H5
  uni.offWindowResize(handleResize);
  // #endif
  if (rafId) {
    const cancelFn = typeof cancelAnimationFrame !== "undefined" ? cancelAnimationFrame : clearTimeout;
    cancelFn(rafId);
    rafId = null;
  }
  ctx = null;
  canvas = null;
  projectedFeatures = [];
});

// ─── Placeholder actions ─────────────────────────────────────
const learnMore = () => {
  console.log(selectedRegion.value)
  if (!selectedRegion.value) return;
  uni.navigateTo({
    url: `/pages/regionDetail/index?name=${encodeURIComponent(selectedRegion.value.name)}`,
  });
};
</script>

<style lang="less" src="./index.less" module="styles"></style>
