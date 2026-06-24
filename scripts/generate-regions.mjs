/**
 * 生成精准的七大区域 GeoJSON
 *
 * 从 DataV 官方获取中国省级行政区划边界数据，
 * 将省份按七大地理区域合并，生成新的 regions.json。
 *
 * 使用: node scripts/generate-regions.mjs
 * 输出: src/data/regions.json
 */

import polygonClipping from "polygon-clipping";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PROVINCE_URL =
  "https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json";

// 七大区域省份对照表（严格按照官方七大地理分区）
const REGION_CONFIG = [
  {
    name: "东北地区",
    pinyin: "dōng běi dì qū",
    description: "这里有茂密的森林和肥沃的黑土地，冬天会下大雪哦！",
    provinces: ["辽宁省", "吉林省", "黑龙江省"],
  },
  {
    name: "华北地区",
    pinyin: "huá běi dì qū",
    description: "这里有雄伟的长城和广阔的平原，是中华文明的发源地之一。",
    provinces: ["北京市", "天津市", "河北省", "山西省", "内蒙古自治区"],
  },
  {
    name: "西北地区",
    pinyin: "xī běi dì qū",
    description: "这里有大片的沙漠和美丽的绿洲，还有高高的天山呢！",
    provinces: [
      "陕西省",
      "甘肃省",
      "青海省",
      "宁夏回族自治区",
      "新疆维吾尔自治区",
    ],
  },
  {
    name: "西南地区",
    pinyin: "xī nán dì qū",
    description: "这里山很多，森林茂密，就像大熊猫的秘密花园！",
    provinces: ["四川省", "贵州省", "云南省", "重庆市", "西藏自治区"],
  },
  {
    name: "华中地区",
    pinyin: "huá zhōng dì qū",
    description: "这里有很多湖泊和大河，是鱼米之乡，物产丰富！",
    provinces: ["河南省", "湖北省", "湖南省"],
  },
  {
    name: "华东地区",
    pinyin: "huá dōng dì qū",
    description: "这里有江南水乡和美丽的海岸，经济发达，风景如画！",
    provinces: [
      "上海市",
      "江苏省",
      "浙江省",
      "安徽省",
      "福建省",
      "江西省",
      "山东省",
    ],
  },
  {
    name: "华南地区",
    pinyin: "huá nán dì qū",
    description: "这里天气炎热，有很多热带水果，还有美丽的海滩！",
    provinces: [
      "广东省",
      "广西壮族自治区",
      "海南省",
      "香港特别行政区",
      "澳门特别行政区",
    ],
  },
];

/**
 * 计算多边形面积（球面Shoelace公式，用于过滤极小岛礁）
 * 返回近似面积（平方度），用于相对比较
 */
function polygonArea(ring) {
  let area = 0;
  const n = ring.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += ring[i][0] * ring[j][1];
    area -= ring[j][0] * ring[i][1];
  }
  return Math.abs(area) / 2;
}

/**
 * 过滤多边形中的微小孔洞（sliver/hole artifacts）
 * 这些孔洞是 polygon-clipping union 时相邻省边界不完全重合产生的，
 * 面积极小（通常 <0.01 平方度），在实际渲染中不可见，但影响数据整洁性。
 */
function filterSliverHoles(polygons, minHoleArea = 0.01) {
  const result = [];
  for (const poly of polygons) {
    if (poly.length <= 1) {
      // 没有内环，原样保留
      result.push(poly);
      continue;
    }
    const outerRing = poly[0];
    const holes = poly.slice(1).filter((ring) => {
      const area = polygonArea(ring);
      return area >= minHoleArea;
    });
    result.push([outerRing, ...holes]);
  }
  return result;
}

/**
 * 获取一个 feature 中面积最大的主多边形
 * 过滤掉面积 < minArea 的极小岛礁
 */
function getMainPolygons(feature, minArea = 0.5) {
  // 统一处理 Polygon 和 MultiPolygon 类型
  // DataV 中内蒙古自治区是唯一的 Polygon 类型（其他省份均为 MultiPolygon）
  let coords = feature.geometry.coordinates;
  if (feature.geometry.type === "Polygon") {
    // Polygon: [outerRing, ...holes] → 转为 [[outerRing, ...holes]] 统一处理
    coords = [coords];
  }
  const result = [];
  for (const polygon of coords) {
    // polygon: [outerRing, ...holes]
    const outerRing = polygon[0];
    const area = polygonArea(outerRing);
    if (area >= minArea) {
      result.push(polygon);
    }
  }
  return result;
}

async function main() {
  console.log("正在下载省级 GeoJSON 数据...");
  const resp = await fetch(PROVINCE_URL);
  const provinceData = await resp.json();

  if (provinceData.type !== "FeatureCollection") {
    throw new Error("数据格式不正确，期望 FeatureCollection");
  }

  console.log(`已获取 ${provinceData.features.length} 个省级行政区划`);

  // 按省份名称建立索引
  const provinceMap = new Map();
  for (const feature of provinceData.features) {
    const name = feature.properties?.name;
    if (name) {
      provinceMap.set(name, feature);
    }
  }

  // 检查缺失省份
  const missingProvinces = [];
  for (const region of REGION_CONFIG) {
    for (const pName of region.provinces) {
      if (!provinceMap.has(pName)) {
        missingProvinces.push(pName);
      }
    }
  }
  if (missingProvinces.length > 0) {
    console.warn("警告：以下省份在数据源中未找到:", missingProvinces.join(", "));
  } else {
    console.log("所有省份匹配成功 ✓");
  }

  // 台湾省单独处理
  const taiwanFeature = provinceMap.get("台湾省");

  const regionFeatures = [];

  for (const region of REGION_CONFIG) {
    console.log(`\n正在处理: ${region.name}...`);

    const provinceFeatures = region.provinces
      .map((name) => provinceMap.get(name))
      .filter(Boolean);

    if (provinceFeatures.length === 0) {
      console.warn(`  没有找到任何省份，跳过`);
      continue;
    }

    // 收集各省份的主多边形（过滤极小岛礁）
    const mainPolygons = [];
    let filteredCount = 0;
    for (const pf of provinceFeatures) {
      const polygons = getMainPolygons(pf);
      const totalSubs = pf.geometry.coordinates.length;
      filteredCount += totalSubs - polygons.length;
      for (const poly of polygons) {
        mainPolygons.push(poly);
      }
    }
    if (filteredCount > 0) {
      console.log(`  过滤了 ${filteredCount} 个小岛礁`);
    }

    if (mainPolygons.length === 0) {
      console.warn(`  过滤后没有剩余多边形，跳过`);
      continue;
    }

    console.log(`  合并 ${mainPolygons.length} 个多边形...`);

    // 尝试用 polygon-clipping 合并
    let merged;
    let mergeSuccess = false;
    try {
      merged = polygonClipping.union(mainPolygons);
      mergeSuccess = true;
    } catch (err) {
      console.error(`  polygon-clipping 合并失败: ${err.message}`);
    }

    if (mergeSuccess) {
      // 合并成功，但仍可能有多余子多边形
      // 再过滤一次极小结果
      const filteredMerged = [];
      let tinyAfterMerge = 0;
      for (const poly of merged) {
        const area = polygonArea(poly[0]);
        if (area >= 0.5) {
          filteredMerged.push(poly);
        } else {
          tinyAfterMerge++;
        }
      }
      if (tinyAfterMerge > 0) {
        console.log(`  合并后过滤了 ${tinyAfterMerge} 个极小碎片`);
      }
      merged = filteredMerged.length > 0 ? filteredMerged : merged;

      // 过滤合并产生的微小 sliver 孔洞
      const beforeHoles = merged.reduce((c, p) => c + p.length - 1, 0);
      merged = filterSliverHoles(merged);
      const afterHoles = merged.reduce((c, p) => c + p.length - 1, 0);
      const removedHoles = beforeHoles - afterHoles;
      if (removedHoles > 0) {
        console.log(`  ✓ 过滤了 ${removedHoles} 个微小孔洞`);
      }

      console.log(`  ✓ 合并成功 (${merged.length} 个子多边形)`);
    } else {
      // 合并失败时，使用主多边形但不尝试 union
      // 取出每个省份面积最大的那个多边形，尽量减少内部边界
      console.log(`  回退: 取各省份最大主多边形`);
      const biggestFromEach = [];
      for (const pf of provinceFeatures) {
        const polygons = getMainPolygons(pf);
        if (polygons.length > 0) {
          // 按面积排序取最大的
          polygons.sort((a, b) => polygonArea(b[0]) - polygonArea(a[0]));
          biggestFromEach.push(polygons[0]);
        }
      }
      merged = biggestFromEach;
      console.log(`  △ 取 ${merged.length} 个主多边形（有少量省界残留）`);
    }

    regionFeatures.push({
      type: "Feature",
      properties: {
        name: region.name,
        pinyin: region.pinyin,
        description: region.description,
      },
      geometry: {
        type: "MultiPolygon",
        coordinates: merged,
      },
    });
  }

  // 添加台湾省
  if (taiwanFeature) {
    regionFeatures.push({
      type: "Feature",
      properties: {
        name: "台湾",
        pinyin: "tái wān",
      },
      geometry: taiwanFeature.geometry,
    });
    console.log("\n已添加: 台湾");
  }

  const output = {
    type: "FeatureCollection",
    features: regionFeatures,
  };

  const outputPath = path.resolve(__dirname, "../src/data/regions.json");
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), "utf-8");

  const stats = fs.statSync(outputPath);
  console.log(`\n✅ 生成完成！`);
  console.log(`   输出: ${outputPath}`);
  console.log(`   大小: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   区域: ${regionFeatures.length} 个`);
}

main().catch((err) => {
  console.error("运行失败:", err);
  process.exit(1);
});
