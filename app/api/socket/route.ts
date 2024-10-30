import { NextRequest } from "next/server";
import { WebSocketServer } from "ws";

export async function GET(req: NextRequest) {
  const { socket } = req;
  if (!socket?.server?.wss) {
    const wss = new WebSocketServer({ noServer: true });
    socket.server.wss = wss;

    wss.on("connection", (ws) => {
      ws.on("message", (message) => {
        wss.clients.forEach((client) => {
          if (client.readyState === ws.OPEN) {
            client.send(message.toString());
          }
        });
      });
    });

    socket.on("upgrade", (request, socket, head) => {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    });
  }
  return new Response("WebSocket setup complete");
}
