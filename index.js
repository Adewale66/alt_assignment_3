import express from "express";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Server } from "socket.io";
import "dotenv/config";

const app = express();
const server = createServer(app);
const io = new Server(server);
const port = process.env.PORT || 3000;
const __dirname = dirname(fileURLToPath(import.meta.url));

const menu = new Map();
menu.set("5", "Caesar Salad");
menu.set("13", "Apple Pie");
menu.set("22", "Bruschetta");
menu.set("46", "Chocolate Lava Cake");
menu.set("6", "salad");
menu.set("8", "Chicken Alfredo");
menu.set("14", "onion rings");
menu.set("3", "ice cream");
menu.set("10", "Calamari");

app.use(express.static(join(__dirname, "public")));

app.get("/", (req, res) => {
	res.sendFile(join(__dirname, "public", "index.html"));
});

io.on("connection", (socket) => {
	let order = "";
	let orderinProgress = false;
	const orderHistory = [];

	socket.on("client message", (msg) => {
		switch (msg) {
			case "1":
				socket.emit("server message", JSON.stringify([...menu]));
				orderinProgress = true;
				break;
			case "99":
				if (order) {
					socket.emit(
						"server message",
						`Order #${Math.round(
							Math.random() * 100
						)} has been placed.`
					);
					orderHistory.push(order);
					order = "";
					orderinProgress = false;
				} else {
					socket.emit("server message", "No order to place.");
				}
				break;
			case "98":
				socket.emit("server message", JSON.stringify(orderHistory));
				break;
			case "97":
				if (order) {
					socket.emit("server message", `Current order: ${order}.`);
				} else {
					socket.emit("server message", "No order to show.");
				}
				break;
			case "0":
				if (order) {
					socket.emit("server message", "Order cancelled.");
					order = "";
				} else {
					socket.emit("server message", "No order to cancel.");
				}
				break;
			default:
				if (!orderinProgress) {
					socket.emit("server message", "Invalid command.");
				} else {
					const item = menu.get(msg);
					if (item) {
						if (order) {
							order = order + ", " + item;
						} else {
							order = item;
						}
						socket.emit(
							"server message",
							`Your current order: ${order}. Please enter the next order number or 99 to place the order.`
						);
					} else {
						socket.emit("server message", "Invalid option.");
					}
				}

				break;
		}
	});
});

server.listen(port, () => {
	console.log("Server is running on port " + port);
});
