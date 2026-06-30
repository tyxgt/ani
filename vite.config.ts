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
    copyDir(cloudfunctionsSrc, destDir);
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
