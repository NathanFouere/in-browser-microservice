import * as Y from "yjs";
import { WebrtcProvider } from "y-webrtc";
import { IndexeddbPersistence } from "y-indexeddb";

const ydoc = new Y.Doc();
const docName = "test";
// clients connected to the same room-name share document updates

const signalingServerIp = "192.168.1.19"; // TODO => il faut le définir à chaque fois !

const provider = new WebrtcProvider("test-room", ydoc, {
  signaling: ["ws://" + signalingServerIp + ":4444"],
});

export const persistence = new IndexeddbPersistence(docName, ydoc);

export default ydoc;
