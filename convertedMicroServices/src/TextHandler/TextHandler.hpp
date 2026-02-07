#pragma once

#include "../UserMentionHandler/UserMentionHandler.hpp"
#include "../Types/TextServiceReturn/TextServiceReturn.hpp"
#include <regex>
#include <string>
#include <iostream>

class TextHandler {
    public:
        TextHandler(
            UserMentionHandler& userMentionHandler
        );
        TextServiceReturn ComposeText(const std::string &text);
        
    private:
        UserMentionHandler& userMentionHandler;
};