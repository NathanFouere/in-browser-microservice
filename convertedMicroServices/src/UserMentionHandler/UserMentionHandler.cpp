#include "UserMentionHandler.hpp"
#include <emscripten/bind.h>
#include <iostream>

using namespace emscripten;

UserMentionHandler::UserMentionHandler() {

}

std::vector<UserMention> ComposeUserMentions(const std::vector<std::string> &usernames) {
     std::cout << "Composer UserMentions appelé" << std::endl;

     UserMention* fakeUserMention = new UserMention();

    std::vector<UserMention> fakeUserMentions = {*fakeUserMention};

    return fakeUserMentions;
}

EMSCRIPTEN_BINDINGS(user_mention_handler_module) {
    class_<UserMentionHandler>("UserMentionHandler")
        .constructor<>()
        .function("ComposeUserMentions", &ComposeUserMentions);
}
