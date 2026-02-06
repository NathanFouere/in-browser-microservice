#include "Creator.hpp"
#include <emscripten/bind.h>

using namespace emscripten;

Creator Creator::fromJson(const json& j) {
    Creator c;
    c.setUserId(j.at("user_id").get<int64_t>());
    c.setUsername(j.at("username").get<std::string>());
    return c;
}

int64_t Creator::getUserId() const {
    return this->user_id;
}

void Creator::setUserId(int64_t _user_id) {
    this->user_id = _user_id;
}

std::string Creator::getUsername() const {
    return this->username;
}

void Creator::setUsername(std::string _username) {
    this->username = _username;
}

json Creator::toJson() const {
    json j;
    j["user_id"] = user_id;
    j["username"] = username;
    return j;
}

EMSCRIPTEN_BINDINGS(creator_module) {
    class_<Creator>("Creator")
        .constructor<>()
        .property("user_id", &Creator::getUserId, &Creator::setUserId)
        .property("username", &Creator::getUsername, &Creator::setUsername)
    ;
}
