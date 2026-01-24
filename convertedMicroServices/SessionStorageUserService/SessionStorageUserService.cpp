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

  return stringToNewUTF8(user_json_str);
});

EM_JS(void, add_user_in_session_storage_js, (const char *user_json_cstr), {
  const user_json_utf_8 = UTF8ToString(user_json_cstr);
  sessionStorage.setItem('user', user_json_utf_8);

  const userJson = JSON.parse(user_json_utf_8);
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

void SessionStorageUserService::setLoggedUser(User user) {
  this->loggedUser.reset(&user);
  add_user_in_session_storage_js(user.toJson().dump().c_str());
}

void SessionStorageUserService::removeLoggedUser() {
  this->loggedUser.reset(nullptr);
  remove_user_in_session_storage_js();
}

User *SessionStorageUserService::getUserInLocalStorage() {
  json userJson = json::parse(get_user_in_session_storage_js());
  if (userJson.empty())
    return nullptr;

  User *userFromJson = loadUserFromJson(userJson);

  return userFromJson;
}

EMSCRIPTEN_BINDINGS(session_storage_user_service) {
  class_<SessionStorageUserService>("SessionStorageUserService")
      .constructor<>()
      .function("setLoggedUser", &SessionStorageUserService::setLoggedUser)
      .function("getLoggedUser", &SessionStorageUserService::getLoggedUser)
      .function("removeLoggedUser",
                &SessionStorageUserService::removeLoggedUser);
}
