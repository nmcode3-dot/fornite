import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const port = Number(process.env.PORT || 4173);

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8"
};

createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://localhost:${port}`);
    if (url.pathname === "/favicon.ico" || url.pathname.startsWith("/.well-known/")) {
      res.writeHead(204);
      res.end();
      return;
    }
    const requested = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
    const filePath = normalize(join(root, requested));
    if (!filePath.startsWith(root)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }
    const body = await readFile(filePath);
    res.writeHead(200, { "Content-Type": mime[extname(filePath)] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
}).listen(port, () => {
  console.log(`Skybreak Royale running at http://localhost:${port}`);
});
