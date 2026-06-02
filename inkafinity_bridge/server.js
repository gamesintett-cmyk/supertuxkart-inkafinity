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

function writeCommand(action, target, duration) {
  action = String(action || "boost").toLowerCase();
  target = String(target || "player").toLowerCase();
  duration = String(duration || "5").replace(/[^0-9.]/g, "") || "5";

  const allowedActions = new Set(["boost", "nitro", "slow", "anvil", "parachute", "shield", "bubblegum", "cake", "bowling", "plunger", "rubberball", "zipper", "swatter", "matamoscas", "banana", "gum", "bubblegum_obstacle", "spin", "trompo", "freeze", "congelar", "reverse_controls", "reverse", "invert", "oil", "patinar", "teleport_random", "teleport_last", "teleport_leader", "swap_positions", "swap", "launch_up", "launch", "jump", "giant_kart", "giant", "tiny_kart", "tiny", "spawn_obstacle", "obstacle"]);
  if (!allowedActions.has(action)) {
    throw new Error("Accion no soportada todavia: " + action);
  }

  fs.writeFileSync(COMMAND_FILE, `action=${action}&target=${target}&duration=${duration}`, "utf8");
  return { action, target, duration, file: COMMAND_FILE };
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
http://127.0.0.1:${PORT}/action?action=slow&target=random&duration=5
http://127.0.0.1:${PORT}/action?action=anvil&target=leader
http://127.0.0.1:${PORT}/action?action=cake&target=player
http://127.0.0.1:${PORT}/action?action=bowling&target=random
http://127.0.0.1:${PORT}/action?action=plunger&target=player
http://127.0.0.1:${PORT}/swatter?kart=1
http://127.0.0.1:${PORT}/banana?target=random
http://127.0.0.1:${PORT}/gum?target=leader


Nuevos v4:
http://127.0.0.1:${PORT}/spin?target=random
http://127.0.0.1:${PORT}/freeze?target=leader&duration=10
http://127.0.0.1:${PORT}/reverse_controls?kart=1
http://127.0.0.1:${PORT}/oil?target=random
http://127.0.0.1:${PORT}/teleport_random?kart=1
http://127.0.0.1:${PORT}/teleport_leader?target=last
http://127.0.0.1:${PORT}/teleport_last?target=leader
http://127.0.0.1:${PORT}/swap_positions?target=leader
http://127.0.0.1:${PORT}/launch_up?target=random
http://127.0.0.1:${PORT}/giant_kart?kart=1
http://127.0.0.1:${PORT}/tiny_kart?kart=1
http://127.0.0.1:${PORT}/spawn_obstacle?target=leader

Duracion opcional para slow/freeze:
http://127.0.0.1:${PORT}/slow?kart=1&duration=5
http://127.0.0.1:${PORT}/freeze?kart=1&duration=10

Targets:
player, leader, last, random, kart1, kart2, kart3...
`);
    }

    if (url.pathname === "/action") {
      const action = url.searchParams.get("action") || url.searchParams.get("item") || "boost";
      const target = url.searchParams.get("target") || (url.searchParams.get("kart") ? `kart${url.searchParams.get("kart")}` : "player");
      const duration = url.searchParams.get("duration") || url.searchParams.get("seconds") || "5";
      const result = writeCommand(action, target, duration);
      return send(res, 200, `OK ${result.action} -> ${result.target} (${result.duration}s)\n${result.file}`);
    }

    // Short aliases
    const alias = url.pathname.replace("/", "").toLowerCase();
    if (["boost", "nitro", "slow", "anvil", "parachute", "shield", "bubblegum", "cake", "bowling", "plunger", "rubberball", "zipper", "swatter", "matamoscas", "banana", "gum", "bubblegum_obstacle", "spin", "trompo", "freeze", "congelar", "reverse_controls", "reverse", "invert", "oil", "patinar", "teleport_random", "teleport_last", "teleport_leader", "swap_positions", "swap", "launch_up", "launch", "jump", "giant_kart", "giant", "tiny_kart", "tiny", "spawn_obstacle", "obstacle"].includes(alias)) {
      const target = url.searchParams.get("target") || (url.searchParams.get("kart") ? `kart${url.searchParams.get("kart")}` : "player");
      const duration = url.searchParams.get("duration") || url.searchParams.get("seconds") || "5";
      const result = writeCommand(alias, target, duration);
      return send(res, 200, `OK ${result.action} -> ${result.target} (${result.duration}s)\n${result.file}`);
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
