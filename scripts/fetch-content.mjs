import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");
const contentDir = path.resolve("content");
const repoUrl = process.env.CONTENT_REPO_URL;
const branch = process.env.CONTENT_REPO_BRANCH || "main";

if (repoUrl) {
  if (fs.existsSync(contentDir)) {
    // Fail rather than deleting a manually maintained content directory.
    if (!fs.existsSync(path.join(contentDir, ".git"))) {
      throw new Error("content/ exists but is not a Git checkout. Unset CONTENT_REPO_URL to use local content.");
    }
    execFileSync("git", ["fetch", "--depth", "1", "origin", branch], { cwd: contentDir, stdio: "inherit" });
    execFileSync("git", ["checkout", "--detach", "FETCH_HEAD"], { cwd: contentDir, stdio: "inherit" });
  } else {
    execFileSync("git", ["clone", "--depth", "1", "--branch", branch, "--", repoUrl, contentDir], { stdio: "inherit" });
  }
  console.log("Content fetched successfully.");
}
