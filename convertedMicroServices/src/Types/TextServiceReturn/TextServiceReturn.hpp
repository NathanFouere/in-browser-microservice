#pragma once

#include <string>
#include <vector>
#include "../UserMention/UserMention.hpp"

class TextServiceReturn {
  public:
    TextServiceReturn(
        const std::string& text
    );
    void setText(const std::string& _text);
    std::string getText() const;
    void setUserMentions(const std::vector<UserMention>& _user_mentions);
    std::vector<UserMention> getUserMentions() const;
    
  private:
    std::string text;
    
};