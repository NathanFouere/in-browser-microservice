import * as Y from "yjs";
import { WebrtcProvider } from "y-webrtc";
import { IndexeddbPersistence } from "y-indexeddb";

const sharedDoc = new Y.Doc();
const docName = "shared-doc";
// clients connected to the same room-name share document updates

const signalingServerIp = "192.168.1.18"; // TODO => il faut le définir à chaque fois !

const provider = new WebrtcProvider("shared-room", sharedDoc, {
  signaling: ["ws://" + signalingServerIp + ":4444"],
});

const persistence = new IndexeddbPersistence(docName, sharedDoc);

export { sharedDoc, persistence, provider };
