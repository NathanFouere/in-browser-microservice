export default class ShardingService {
  constructor(ydoc, persistence, provider, annuaireService) {
    this.ydoc = ydoc;
    this.persistence = persistence;
    this.provider = provider;
    this.annuaireService = annuaireService;

    this.provider.awareness.on("change", this.handleAwarenessChange);
  }

  handleAwarenessChange = ({ added, updated, removed }) => {
    const states = this.provider.awareness.getStates();
    added.forEach((clientID) => {
      const clientState = states.get(clientID);
      console.log("added :", clientID, clientState);

      if (clientState?.user != undefined) {
        this.annuaireService.addLoggedUser(
          clientState.user.userId,
          clientState.user.username,
          clientState.user.clientId,
        );
      }
    });

    updated.forEach((clientID) => {
      const clientState = states.get(clientID);
      console.log("updated :", clientID, clientState);

      if (clientState?.user != undefined) {
        this.annuaireService.addLoggedUser(
          clientState.user.userId,
          clientState.user.username,
          clientState.user.clientId,
        );
      }
    });

    removed.forEach((clientID) => {
      console.log("removed :", clientID);
      const clientState = states.get(clientID);

      if (clientState?.user != undefined) {
        this.annuaireService.removeLoggedUser(clientState.user.userId);
      }
    });
  };
}
