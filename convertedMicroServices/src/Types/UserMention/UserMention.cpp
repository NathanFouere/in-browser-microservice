#include "UserMention.hpp"
#include <emscripten/bind.h>

using namespace emscripten;


void UserMention::setUserId(int64_t _user_id) {
    this->user_id = _user_id;
}

int64_t UserMention::getUserId() const {
    return this->user_id;
}

void UserMention::setUsername(const std::string& _username) {
    this->username = _username;
}

std::string UserMention::getUsername() const {
    return this->username;
}
EMSCRIPTEN_BINDINGS(user_mention_module) {
    class_<UserMention>("UserMention")
        .constructor<>()
        .property("user_id", &UserMention::getUserId, &UserMention::setUserId)
        .property("username", &UserMention::getUsername, &UserMention::setUsername)
    ;
}
