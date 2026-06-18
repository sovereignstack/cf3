/* Cross-platform syntax check of the app's inline script.
   Extracts the single inline <script> from ../index.html and runs `node --check`
   on it. Uses the OS temp dir so it works on Windows as well as POSIX. */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const m = html.match(/<script>([\s\S]*?)<\/script>/);
if (!m) { console.error("no inline <script> found in index.html"); process.exit(1); }

const tmp = path.join(os.tmpdir(), "_tread_check.js");
fs.writeFileSync(tmp, m[1]);
execFileSync(process.execPath, ["--check", tmp], { stdio: "inherit" });
console.log("syntax OK");
