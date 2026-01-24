export default class AnnuaireService {
  static STORAGE_KEY = "annuaire";

  constructor(clientId) {
    const stored = sessionStorage.getItem(AnnuaireService.STORAGE_KEY);

    this.clientId = clientId;
    this.loggedUsers = stored ? new Map(JSON.parse(stored)) : new Map();
  }

  addLoggedUser(userId, username, clientId) {
    if (clientId == this.clientId) {
      // On ne gere pas l'utilisateur courant
      return;
    }
    console.log("Added user of id " + userId + " with name " + username);

    this.loggedUsers.set(userId, { username, clientId });
    this.saveInSessionStorage();
  }

  removeLoggedUser(userId) {
    if (clientId == this.clientId) {
      // On ne gere pas l'utilisateur courant
      return;
    }
    console.log("Removed user of id " + userId);

    this.loggedUsers.delete(userId);
    this.saveInSessionStorage();
  }

  getListOfUsers() {
    const users = [];
    for (const [userId, user] of this.loggedUsers.entries()) {
      users.push({ userId, username: user.username, clientId: user.clientId });
    }
    return users;
  }

  saveInSessionStorage() {
    sessionStorage.setItem(
      AnnuaireService.STORAGE_KEY,
      JSON.stringify([...this.loggedUsers]),
    );
  }
}
