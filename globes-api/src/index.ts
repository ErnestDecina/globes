import Logger from "./utils/logger";
import { createExpressServer } from "./server";
import { application_name, is_development } from "./config/application.config";
import { express_port, api_version } from "./config/express.config";
import { DatabasePostgres } from "./database";
import { openAI } from "./utils/openai";
import { Server, Socket } from "socket.io";
import http from "http";
import sync from "./database/sync";

DatabasePostgres;
openAI;
const express_server = createExpressServer();
const server = http.createServer(express_server);
const io = new Server(server, { cors: { origin: "*" } });

interface ClientSocket extends Socket {
    uuid?: string;
}

io.on("connection", (socket: ClientSocket) => {
    console.log("A user connected:", socket.id);

    socket.on("connect_to_uuid", (uuid: string) => {
        socket.join(uuid);
        socket.uuid = uuid;
        console.log(`User ${socket.id} joined UUID room: ${uuid}`);
        socket.emit("connected_to_uuid", `Connected to room: ${uuid}`);
    });

    socket.on("start_powerpoint_presentation", (slideCount: string) => {
        if (!socket.uuid) return;
        console.log(`Start PowerPoint from ${socket.id} in room ${socket.uuid}`);
        console.log(slideCount)
        io.to(socket.uuid).emit("start_powerpoint_presentation", slideCount);
    });

    socket.on("stop_powerpoint_presentation", () => {
        if (!socket.uuid) return;
        console.log(`Stop PowerPoint from ${socket.id} in room ${socket.uuid}`);
        io.to(socket.uuid).emit("stop_powerpoint_presentation", false);
    });

    socket.on("increment_slide_index", (index: string) => {
        if (!socket.uuid) return;
        console.log(`Increment slide in room ${socket.uuid}: ${index}`);
        io.to(socket.uuid).emit("increment_slide_index", index);
    });

    socket.on("decrement_slide_index", (index: string) => {
        if (!socket.uuid) return;
        console.log(`Decrement slide in room ${socket.uuid}: ${index}`);
        io.to(socket.uuid).emit("decrement_slide_index", index);
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
        if (socket.uuid) {
            io.to(socket.uuid).emit("message", `User ${socket.id} has disconnected`);
        }
    });
});


server.listen(express_port, () => {
    Logger.info(`Application "${application_name}" with API version ${api_version}`);
    Logger.info(`App is listening on  http://localhost:${express_port}/`);
});

