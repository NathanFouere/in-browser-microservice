export default class ShardingService {
  constructor(ydoc, persistence, provider) {
    this.ydoc = ydoc;
    this.persistence = persistence;
    this.provider = provider;

    this.provider.awareness.on("change", this.handleAwarenessChange);
  }

  handleAwarenessChange = ({ added, updated, removed }) => {
    const states = this.provider.awareness.getStates();

    added.forEach((clientID) => {
      console.log("added :", clientID, states.get(clientID));
    });

    updated.forEach((clientID) => {
      console.log("updated :", clientID, states.get(clientID));
    });

    removed.forEach((clientID) => {
      console.log("removed :", clientID);
    });
  };
}
