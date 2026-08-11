// ─── 学习页数据预加载 ─────────────────────────────────────────────
// App 启动时提前把"学习"页要用的 4 个列表接口发出去，学习页 mounted 时直接复用
// 同一个 Promise：早已完成则秒开，还没完成则正常等待，绝不会重复发请求。
import { callFunction } from './cloud'

function fetchLearnData() {
  return Promise.all([
    callFunction('getKnowledgeCategories'),
    callFunction('getTerrainList'),
    callFunction('getClimateList'),
    callFunction('getAnimalList'),
  ])
}

let learnDataPromise: ReturnType<typeof fetchLearnData> | null = null

export function preloadLearnData() {
  if (!learnDataPromise) {
    learnDataPromise = fetchLearnData()
  }
  return learnDataPromise
}
