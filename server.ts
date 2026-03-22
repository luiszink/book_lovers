import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = parseInt(process.env.PORT || "3001", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new SocketIOServer(httpServer, {
    path: "/api/socketio",
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    // Join a highlight room
    socket.on("join-highlight", (highlightId: string) => {
      socket.join(`highlight:${highlightId}`);
    });

    // Broadcast new comment to the highlight room
    socket.on(
      "new-comment",
      (data: { highlightId: string; comment: unknown }) => {
        socket
          .to(`highlight:${data.highlightId}`)
          .emit("new-comment", data.comment);
      }
    );

    // Typing indicator
    socket.on(
      "typing",
      (data: { highlightId: string; userName: string }) => {
        socket
          .to(`highlight:${data.highlightId}`)
          .emit("user-typing", data.userName);
      }
    );
  });

  httpServer.listen(port, "0.0.0.0", () => {
    console.log(`> Ready on http://0.0.0.0:${port}`);
  });
});
