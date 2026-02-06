#pragma once

#include <string>

class UserMention {
    public:
        UserMention() noexcept
                    : user_id(0),
                    username() {
        }
        void setUserId(int64_t _user_id);
        int64_t getUserId() const;
        void setUsername(const std::string& _username);
        std::string getUsername() const;
    private:
        int64_t user_id;
        std::string username;
};
