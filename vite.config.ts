import { defineConfig } from "vite";
import uni from "@dcloudio/vite-plugin-uni";
import fs from "fs";
import path from "path";

function copyCloudfunctionsPlugin() {
  const cloudfunctionsSrc = path.resolve(__dirname, "cloudfunctions");
  let outDir = "";

  function copyToOutDir() {
    if (!fs.existsSync(cloudfunctionsSrc) || !outDir) return;

    const destDir = path.join(outDir, "cloudfunctions");

    if (process.env.UNI_PLATFORM === "mp-weixin") {
      // 微信平台：只复制微信云函数目录
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      const wechatCloudfunction = path.join(cloudfunctionsSrc, "login");
      const destWechatDir = path.join(destDir, "login");
      if (fs.existsSync(wechatCloudfunction)) {
        copyDir(wechatCloudfunction, destWechatDir);
      }
    } else {
      // 其他平台：复制所有云函数
      copyDir(cloudfunctionsSrc, destDir);
    }
    updateProjectConfig();
  }

  function updateProjectConfig() {
    const configPath = path.join(outDir, "project.config.json");
    if (!fs.existsSync(configPath)) return;
    try {
      const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      config.cloudfunctionRoot = "cloudfunctions/";
      if (!config.setting) {
        config.setting = {};
      }
      config.setting.urlCheck = false;
      config.setting.es6 = true;
      config.setting.enhance = true;
      config.setting.postcss = true;
      config.setting.minified = true;
      config.setting.newFeature = true;
      config.setting.autoAudits = false;
      config.setting.uglifyFileName = false;
      config.setting.checkInvalidKey = true;
      config.setting.disableUseStrict = false;
      config.setting.uploadWithSourceMap = true;
      config.compileType = "miniprogram";
      if (!config.packOptions) {
        config.packOptions = {};
      }
      if (!config.packOptions.ignore) {
        config.packOptions.ignore = [];
      }
      const hasCloudfunctionsIgnore = config.packOptions.ignore.some(
        (item: any) => item.type === "folder" && item.value === "cloudfunctions"
      );
      if (!hasCloudfunctionsIgnore) {
        config.packOptions.ignore.push({
          type: "folder",
          value: "cloudfunctions",
        });
      }
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    } catch (error) {
      console.error("更新 project.config.json 失败:", error);
    }
  }

  return {
    name: "copy-cloudfunctions",
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      copyToOutDir();
    },
    configureServer(server) {
      server.watcher.add(cloudfunctionsSrc);
      server.watcher.on("all", (_event: string, file: string) => {
        if (file.startsWith(cloudfunctionsSrc)) {
          copyToOutDir();
        }
      });
      server.httpServer?.on("listening", () => {
        setTimeout(copyToOutDir, 1000);
      });
    },
  };
}

function copyDir(src: string, dest: string) {
  if (!fs.existsSync(src)) return;

  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [uni(), copyCloudfunctionsPlugin()],
});
