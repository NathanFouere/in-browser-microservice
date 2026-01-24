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
      const clientState = states.get(clientID);
      console.log("added :", clientID, clientState);

      if (clientState?.user != undefined) {
        console.log("username :", clientState.user.username);
        console.log("userId :", clientState.user.userId);
        console.log("clientId :", clientState.user.clientId);
      }
    });

    updated.forEach((clientID) => {
      const clientState = states.get(clientID);
      console.log("updated :", clientID, clientState);

      if (clientState?.user != undefined) {
        console.log("username :", clientState.user.username);
        console.log("userId :", clientState.user.userId);
        console.log("clientId :", clientState.user.clientId);
      }
    });

    removed.forEach((clientID) => {
      console.log("removed :", clientID);
    });
  };
}
