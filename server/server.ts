import { WebSocketServer, WebSocket } from "ws";

interface TextUpdate {
  type: "text-update";
  content: string;
  room: string;
}

interface InitialContent {
  type: "initial-content";
  content: string;
  room: string;
}

interface JoinRoom {
  type: "join-room";
  room: string;
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

// Keep track of rooms and their content
const rooms = new Map<string, Room>();

wss.on("connection", (ws: WebSocket) => {
  console.log("Client connected");
  let currentRoom: string | null = null;

  ws.on("message", (message: Buffer) => {
    try {
      const parsedMessage = JSON.parse(message.toString()) as Message;

      switch (parsedMessage.type) {
        case "join-room": {
          // Leave current room if any
          if (currentRoom && rooms.has(currentRoom)) {
            rooms.get(currentRoom)?.clients.delete(ws);
            if (rooms.get(currentRoom)?.clients.size === 0) {
              rooms.delete(currentRoom);
            }
          }

          // Join new room
          currentRoom = parsedMessage.room;
          if (!rooms.has(currentRoom)) {
            rooms.set(currentRoom, {
              content: "",
              clients: new Set([ws]),
            });
          } else {
            rooms.get(currentRoom)?.clients.add(ws);
          }

          // Send initial content
          const initialMessage: InitialContent = {
            type: "initial-content",
            content: rooms.get(currentRoom)?.content || "",
            room: currentRoom,
          };
          ws.send(JSON.stringify(initialMessage));
          break;
        }

        case "text-update": {
          if (!currentRoom) break;

          const room = rooms.get(currentRoom);
          if (!room) break;

          // Update the room content
          room.content = parsedMessage.content;

          // Broadcast to all clients in the room except sender
          room.clients.forEach((client) => {
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
      const room = rooms.get(currentRoom)!;
      room.clients.delete(ws);
      if (room.clients.size === 0) {
        rooms.delete(currentRoom);
      }
    }
  });
});

console.log(`WebSocket server is running on ws://localhost:${PORT}`);
