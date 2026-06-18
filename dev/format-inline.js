/* Format the inline <script> inside ../index.html with Prettier (dev-only).
   The app ships as a single no-build file, so this keeps the inline JS readable
   (one statement per line, consistent spacing) without adding a build step for users. */
const fs = require("fs");
const path = require("path");
const prettier = require("prettier");

const FILE = path.join(__dirname, "..", "index.html");

(async () => {
  const html = fs.readFileSync(FILE, "utf8");
  const m = html.match(/<script>([\s\S]*?)<\/script>/);
  if (!m) {
    console.error("no inline <script> found in index.html");
    process.exit(1);
  }
  const formatted = await prettier.format(m[1], {
    parser: "babel",
    printWidth: 100,
    tabWidth: 2,
    semi: true,
  });
  const out = html.replace(
    /<script>[\s\S]*?<\/script>/,
    () => "<script>\n" + formatted.trimEnd() + "\n</script>",
  );
  fs.writeFileSync(FILE, out);
  console.log(
    `formatted inline script: ${m[1].trim().split("\n").length} → ${formatted.trim().split("\n").length} lines`,
  );
})();
