import { Peer } from "peerjs";

export default class PeerjsService {
  constructor() {
    this.peer = new Peer();
    this.conn = null;

    console.log("peer js service initialized");
  }

  connectToPeer(peerId) {
    console.log("Connecting to peer with id: " + peerId + " " + Date.now());
    this.conn = this.peer.connect(peerId);
    this.conn.on("open", () => {
      console.log("Connected to peer: " + peerId);
    });
    this.conn.on("data", (data) => {
      console.log("Received message: " + data);
    });
  }

  sendMessage(message) {
    if (this.conn && this.conn.open) {
      this.conn.send(message);
      console.log("Sent message: " + message);
    }
  }
}
