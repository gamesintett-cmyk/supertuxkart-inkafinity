const http = require("http");
const fs = require("fs");
const os = require("os");
const path = require("path");

const PORT = Number(process.env.PORT || 5720);
const COMMAND_FILE = process.env.STK_INKAFINITY_COMMAND_FILE ||
  path.join(os.tmpdir(), "stk_inkafinity_command.txt");

function send(res, code, text) {
  res.writeHead(code, {
    "Content-Type": "text/plain; charset=utf-8",
    "Access-Control-Allow-Origin": "*"
  });
  res.end(text);
}

function writeCommand(action, target) {
  action = String(action || "boost").toLowerCase();
  target = String(target || "player").toLowerCase();

  const allowedActions = new Set(["boost", "nitro", "slow", "anvil", "parachute", "shield", "bubblegum", "cake", "bowling", "plunger", "rubberball", "zipper", "swatter", "matamoscas", "banana", "gum", "bubblegum_obstacle"]);
  if (!allowedActions.has(action)) {
    throw new Error("Accion no soportada todavia: " + action);
  }

  fs.writeFileSync(COMMAND_FILE, `action=${action}&target=${target}`, "utf8");
  return { action, target, file: COMMAND_FILE };
}

const server = http.createServer((req, res) => {
  try {
    const url = new URL(req.url, "http://127.0.0.1");

    if (url.pathname === "/" || url.pathname === "/help") {
      return send(res, 200,
`STK InkaFinity Bridge OK

Ejemplos:
http://127.0.0.1:${PORT}/action?action=boost&target=player
http://127.0.0.1:${PORT}/action?action=nitro&target=leader
http://127.0.0.1:${PORT}/action?action=slow&target=random
http://127.0.0.1:${PORT}/action?action=anvil&target=leader
http://127.0.0.1:${PORT}/action?action=cake&target=player
http://127.0.0.1:${PORT}/action?action=bowling&target=random
http://127.0.0.1:${PORT}/action?action=plunger&target=player
http://127.0.0.1:${PORT}/swatter?kart=1
http://127.0.0.1:${PORT}/banana?target=random
http://127.0.0.1:${PORT}/gum?target=leader

Targets:
player, leader, last, random, kart1, kart2, kart3...
`);
    }

    if (url.pathname === "/action") {
      const action = url.searchParams.get("action") || url.searchParams.get("item") || "boost";
      const target = url.searchParams.get("target") || (url.searchParams.get("kart") ? `kart${url.searchParams.get("kart")}` : "player");
      const result = writeCommand(action, target);
      return send(res, 200, `OK ${result.action} -> ${result.target}\n${result.file}`);
    }

    // Short aliases
    const alias = url.pathname.replace("/", "").toLowerCase();
    if (["boost", "nitro", "slow", "anvil", "parachute", "shield", "bubblegum", "cake", "bowling", "plunger", "rubberball", "zipper", "swatter", "matamoscas", "banana", "gum", "bubblegum_obstacle"].includes(alias)) {
      const target = url.searchParams.get("target") || (url.searchParams.get("kart") ? `kart${url.searchParams.get("kart")}` : "player");
      const result = writeCommand(alias, target);
      return send(res, 200, `OK ${result.action} -> ${result.target}\n${result.file}`);
    }

    return send(res, 404, "Ruta no encontrada. Usa /help");
  } catch (err) {
    return send(res, 500, "ERROR: " + err.message);
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log("STK InkaFinity Bridge listo");
  console.log("URL: http://127.0.0.1:" + PORT + "/help");
  console.log("Command file:", COMMAND_FILE);
});
