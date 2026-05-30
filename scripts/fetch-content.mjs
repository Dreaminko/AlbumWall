#!/usr/bin/env node
/**
 * 构建时从独立仓库拉取 content 目录
 *
 * 环境变量:
 *   CONTENT_REPO_URL - content 仓库的 git clone URL
 *   CONTENT_REPO_BRANCH - 分支名（默认 main）
 *
 * 本地开发: npm run content:clone
 * Vercel 构建: prebuild 自动触发
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.join(__dirname, "..", "content");
const REPO_URL = process.env.CONTENT_REPO_URL;
const BRANCH = process.env.CONTENT_REPO_BRANCH || "main";

if (!REPO_URL) {
  console.log("CONTENT_REPO_URL not set, skipping content fetch.");
  process.exit(0);
}

if (fs.existsSync(CONTENT_DIR)) {
  // 已有 content 目录，执行 pull
  console.log(`Pulling content from ${REPO_URL}...`);
  try {
    execSync(`cd "${CONTENT_DIR}" && git fetch origin ${BRANCH} && git checkout ${BRANCH} && git pull origin ${BRANCH}`, {
      stdio: "inherit",
    });
  } catch {
    // pull 失败可能是 shallow clone，删除重新 clone
    console.log("Pull failed, re-cloning...");
    fs.rmSync(CONTENT_DIR, { recursive: true, force: true });
    cloneRepo();
  }
} else {
  cloneRepo();
}

function cloneRepo() {
  console.log(`Cloning content from ${REPO_URL}...`);
  const depthFlag = process.env.VERCEL ? "--depth 1" : "";
  execSync(`git clone ${depthFlag} --branch ${BRANCH} "${REPO_URL}" "${CONTENT_DIR}"`, {
    stdio: "inherit",
  });
  console.log("Content fetched successfully.");
}
