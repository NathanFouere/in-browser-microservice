import { Peer } from "peerjs";

export default class PeerjsService {
  constructor(peerId, peerjsReceiverService) {
    this.peer = new Peer(peerId);
    this.peerjsReceiverService = peerjsReceiverService;
    this.conn = null;
    this.activePeerJsConnections = {};

    this.peer.on("connection", (conn) => {
      console.log("connection from:", conn.peer);
      this.conn = conn;

      conn.on("open", () => {
        console.log("connection established with:", conn.peer);
      });

      conn.on("data", (data) => {
        console.log("Received message:", data);
      });

      conn.on("close", () => {
        console.log("connection closed:", conn.peer);
      });

      conn.on("error", (err) => {
        console.error("connection error:", err);
      });
    });

    console.log("peer js service initialized with peerid", peerId);
  }

  connectToPeer(peerId) {
    console.log("Connecting to peer with id: " + peerId + " " + Date.now());
    this.conn = this.peer.connect(peerId);
    this.conn.on("open", () => {
      console.log("Connected to peer: " + peerId);
    });
    this.conn.on("error", (err) => {
      console.error("Connection error to peer " + peerId, err);
    });
    this.conn.on("close", () => {
      console.log("Connection closed to peer: " + peerId);
    });
    this.conn.on("data", (data) => {
      console.log("Received message:", data);
      this.peerjsReceiverService.handleMessage(data);
    });
  }

  sendMessage(message) {
    if (this.conn && this.conn.open) {
      this.conn.send(message);
      console.log("Sent message: " + message);
    }
  }

  closeConnection() {
    if (this.conn) {
      this.conn.close();
    }
  }
}
