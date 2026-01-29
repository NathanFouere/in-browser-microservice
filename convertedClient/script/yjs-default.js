import * as Y from "yjs";
import { WebrtcProvider } from "y-webrtc";
import { IndexeddbPersistence } from "y-indexeddb";
import {
  signalingServerIp,
  sharedDocName,
  sharedRoomName,
  personnalRoomName,
} from "./consts";

const sharedDoc = new Y.Doc();
// clients connected to the same room-name share document updates

const provider = new WebrtcProvider(sharedRoomName, sharedDoc, {
  signaling: ["ws://" + signalingServerIp + ":4444"],
});

const persistence = new IndexeddbPersistence(sharedDocName, sharedDoc);

const personnalDoc = new Y.Doc();

// ToDO => pas dingue comme implem
const personnalProvider = new WebrtcProvider(
  "personal-" + sharedRoomName,
  personnalDoc,
  {
    signaling: ["ws://" + signalingServerIp + ":4444"],
  },
);

const personnalPersistence = new IndexeddbPersistence(
  personnalRoomName,
  personnalDoc,
);

export {
  sharedDoc,
  persistence,
  provider,
  personnalDoc,
  personnalPersistence,
  personnalProvider,
};
