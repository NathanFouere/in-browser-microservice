#include "SessionStorageUserService.hpp"

#include <emscripten.h>
#include <emscripten/bind.h>

using namespace emscripten;

static User* loadUserFromJson(json j) {
    User* user = new User(
        j["userid"].get<int>(),
        j["first_name"],
        j["last_name"],
        j["username"],
        j["password_hashed"],
        j["salt"]
    );

  return user;
}

EM_JS(char *, get_user_in_session_storage_js, (), {
  const user_json_str = sessionStorage.getItem('user');

  if (user_json_str === null || user_json_str === undefined) {
    return 0;
  }

  return stringToNewUTF8(user_json_str);
});


EM_JS(void, add_user_in_session_storage_js, (const char *user_json_cstr), {
  const user_json_utf_8 = UTF8ToString(user_json_cstr);
  sessionStorage.setItem('user', user_json_utf_8);

  const userJson = JSON.parse(user_json_utf_8);

  const username = userJson["username"];


  const userId = userJson["userid"];

  console.log("Adding user to awareness: ", username, userId);
  console.log("Module.sharedDoc.clientID: ", Module.mainProvider);
  Module.mainProvider.awareness.setLocalStateField('user', {
    username: username,
    userId: userId,
    clientId: Module.sharedDoc.clientID, // cf . https://docs.yjs.dev/api/about-awareness "The clientID is usually the ydoc.clientID."
  });
});

EM_JS(void, remove_user_in_session_storage_js, (), {
  sessionStorage.removeItem('user');
});

SessionStorageUserService::SessionStorageUserService() : loggedUser(nullptr) {}

User SessionStorageUserService::getLoggedUser() {
  if (this->loggedUser) {
    return *this->loggedUser;
  }

  auto userInLocalStorage = this->getUserInLocalStorage();
  if (userInLocalStorage != nullptr) {
    return *userInLocalStorage;
  }

  throw std::runtime_error("No logged user");
}

User* SessionStorageUserService::getNullableLoggedUser() {
  if (this->loggedUser) {
    return this->loggedUser.get();
  }

  auto userInLocalStorage = this->getUserInLocalStorage();
  if (userInLocalStorage != nullptr) {
    return userInLocalStorage;
  }

  return nullptr;
}

void SessionStorageUserService::setLoggedUser(User user) {
  this->loggedUser.reset(&user);
  add_user_in_session_storage_js(user.toJson().dump().c_str());
}

void SessionStorageUserService::removeLoggedUser() {
  this->loggedUser.reset(nullptr);
  remove_user_in_session_storage_js();
}

User* SessionStorageUserService::getUserInLocalStorage() {
  char* str = get_user_in_session_storage_js();
  if (!str) {
    return nullptr;
  }

  json userJson = json::parse(str);
  return loadUserFromJson(userJson);
}


EMSCRIPTEN_BINDINGS(session_storage_user_service) {
  class_<SessionStorageUserService>("SessionStorageUserService")
      .constructor<>()
      .function("setLoggedUser", &SessionStorageUserService::setLoggedUser)
      .function("getLoggedUser", &SessionStorageUserService::getLoggedUser)
      .function("removeLoggedUser", &SessionStorageUserService::removeLoggedUser);
}
