#include "User.hpp"
#include <emscripten/bind.h>
#include <string>

using namespace emscripten;

User::User(int64_t userid,
           const std::string& first_name,
           const std::string& last_name,
           const std::string& username,
           const std::string& password_hashed,
           const std::string& salt)
  : userid(userid),
    first_name(first_name),
    last_name(last_name),
    username(username),
    password_hashed(password_hashed),
    salt(salt) {}

void User::setUserId(int64_t userid) {
  this->userid = userid;
}

json User::toJson() const {
    json j;

    j["userid"] = userid;
    j["first_name"] = first_name;
    j["last_name"] = last_name;
    j["username"] = username;
    j["password_hashed"] = password_hashed;
    j["salt"] = salt;

    return j;
}

void User::setFirstName(const std::string& first_name) {
  this->first_name = first_name;
}

void User::setLastName(const std::string& last_name) {
  this->last_name = last_name;
}

void User::setUsername(const std::string& username) {
  this->username = username;
}

void User::setPasswordHashed(const std::string& password_hashed) {
  this->password_hashed = password_hashed;
}

void User::setSalt(const std::string& salt) {
  this->salt = salt;
}

int64_t User::getUserId() const {
  return userid;
}

const std::string& User::getFirstName() const {
  return first_name;
}

const std::string& User::getLastName() const {
  return last_name;
}

const std::string& User::getUsername() const {
  return username;
}

const std::string& User::getPasswordHashed() const {
  return password_hashed;
}

const std::string& User::getSalt() const {
  return salt;
}


EMSCRIPTEN_BINDINGS(user_module) {
  class_<User>("User")
    .constructor<int64_t, const std::string&, const std::string&, const std::string&, const std::string&, const std::string&>()
    .property("userid", &User::getUserId, &User::setUserId)
    .property("first_name", &User::getFirstName, &User::setFirstName)
    .property("last_name", &User::getLastName, &User::setLastName)
    .property("username", &User::getUsername, &User::setUsername)
    .property("password_hashed", &User::getPasswordHashed, &User::setPasswordHashed)
    .property("salt", &User::getSalt, &User::setSalt)
  ;
}
