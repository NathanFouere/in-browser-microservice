import { Peer } from "peerjs";

export default class PeerjsService {
  constructor() {
    this.peer = new Peer();
    this.conn = null;
  }

  connectToPeer(peerId) {
    this.conn = this.peer.connect(peerId);
    this.conn.on("open", () => {
      console.log("Connected to peer: " + peerId);
    });
  }

  sendMessage(message) {
    if (this.conn && this.conn.open) {
      this.conn.send(message);
      console.log("Sent message: " + message);
    }
  }
}
