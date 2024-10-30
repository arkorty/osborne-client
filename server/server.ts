import { WebSocketServer, WebSocket } from "ws";

interface TextUpdate {
  type: "text-update";
  content: string;
  code: string;
}

interface InitialContent {
  type: "initial-content";
  content: string;
  code: string;
}

interface JoinRoom {
  type: "join-room";
  code: string;
}

type Message = TextUpdate | InitialContent | JoinRoom;

interface Room {
  content: string;
  clients: Set<WebSocket>;
}

const PORT = 8080;
const wss = new WebSocketServer({
  port: PORT,
  host: "0.0.0.0",
});

const rooms = new Map<string, Room>();

wss.on("connection", (ws: WebSocket) => {
  console.log("Client connected");
  let currentRoom: string | null = null;

  ws.on("message", (message: Buffer) => {
    try {
      const parsedMessage = JSON.parse(message.toString()) as Message;

      switch (parsedMessage.type) {
        case "join-room": {
          if (currentRoom && rooms.has(currentRoom)) {
            rooms.get(currentRoom)?.clients.delete(ws);
            if (rooms.get(currentRoom)?.clients.size === 0) {
              rooms.delete(currentRoom);
            }
          }

          currentRoom = parsedMessage.code;
          if (!rooms.has(currentRoom)) {
            rooms.set(currentRoom, {
              content: "",
              clients: new Set([ws]),
            });
          } else {
            rooms.get(currentRoom)?.clients.add(ws);
          }

          const initialMessage: InitialContent = {
            type: "initial-content",
            content: rooms.get(currentRoom)?.content || "",
            code: currentRoom,
          };
          ws.send(JSON.stringify(initialMessage));
          break;
        }

        case "text-update": {
          if (!currentRoom) break;

          const code = rooms.get(currentRoom);
          if (!code) break;

          code.content = parsedMessage.content;

          code.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(parsedMessage));
            }
          });
          break;
        }
      }
    } catch (error) {
      console.error("Error processing message:", error);
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    if (currentRoom && rooms.has(currentRoom)) {
      const code = rooms.get(currentRoom)!;
      code.clients.delete(ws);
      if (code.clients.size === 0) {
        rooms.delete(currentRoom);
      }
    }
  });
});

console.log(`WebSocket server is running on ws://localhost:${PORT}`);
