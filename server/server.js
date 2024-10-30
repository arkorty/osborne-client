"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ws_1 = require("ws");
var PORT = 8080;
var wss = new ws_1.WebSocketServer({
    port: PORT,
    host: "0.0.0.0",
});
// Keep track of rooms and their content
var rooms = new Map();
wss.on("connection", function (ws) {
    console.log("Client connected");
    var currentRoom = null;
    ws.on("message", function (message) {
        var _a, _b, _c, _d;
        try {
            var parsedMessage_1 = JSON.parse(message.toString());
            switch (parsedMessage_1.type) {
                case "join-room": {
                    // Leave current room if any
                    if (currentRoom && rooms.has(currentRoom)) {
                        (_a = rooms.get(currentRoom)) === null || _a === void 0 ? void 0 : _a.clients.delete(ws);
                        if (((_b = rooms.get(currentRoom)) === null || _b === void 0 ? void 0 : _b.clients.size) === 0) {
                            rooms.delete(currentRoom);
                        }
                    }
                    // Join new room
                    currentRoom = parsedMessage_1.room;
                    if (!rooms.has(currentRoom)) {
                        rooms.set(currentRoom, {
                            content: "",
                            clients: new Set([ws]),
                        });
                    }
                    else {
                        (_c = rooms.get(currentRoom)) === null || _c === void 0 ? void 0 : _c.clients.add(ws);
                    }
                    // Send initial content
                    var initialMessage = {
                        type: "initial-content",
                        content: ((_d = rooms.get(currentRoom)) === null || _d === void 0 ? void 0 : _d.content) || "",
                        room: currentRoom,
                    };
                    ws.send(JSON.stringify(initialMessage));
                    break;
                }
                case "text-update": {
                    if (!currentRoom)
                        break;
                    var room = rooms.get(currentRoom);
                    if (!room)
                        break;
                    // Update the room content
                    room.content = parsedMessage_1.content;
                    // Broadcast to all clients in the room except sender
                    room.clients.forEach(function (client) {
                        if (client !== ws && client.readyState === ws_1.WebSocket.OPEN) {
                            client.send(JSON.stringify(parsedMessage_1));
                        }
                    });
                    break;
                }
            }
        }
        catch (error) {
            console.error("Error processing message:", error);
        }
    });
    ws.on("close", function () {
        console.log("Client disconnected");
        if (currentRoom && rooms.has(currentRoom)) {
            var room = rooms.get(currentRoom);
            room.clients.delete(ws);
            if (room.clients.size === 0) {
                rooms.delete(currentRoom);
            }
        }
    });
});
console.log("WebSocket server is running on ws://localhost:".concat(PORT));
