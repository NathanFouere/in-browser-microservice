#pragma once

#include "../Types/User/User.hpp"
#include <memory>

class SessionStorageUserService {
public:
  SessionStorageUserService();
  User getLoggedUser();
  User *getUserInLocalStorage();
  void setLoggedUser(User user);
  void removeLoggedUser();

private:
  std::unique_ptr<User> loggedUser;
};
