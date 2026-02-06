#pragma once

#include "../Types/UserMention/UserMention.hpp"
#include <vector>

class UserMentionHandler {
    public:
        UserMentionHandler();
        std::vector<UserMention> ComposeUserMentions(const std::vector<std::string> &usernames);
};
