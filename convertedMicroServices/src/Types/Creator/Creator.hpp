#pragma once
#include <cstdint>
#include <iostream>
#include <nlohmann/json.hpp>

using nlohmann::json;

class Creator {
    public:
        Creator() noexcept
                : user_id(0),
                username() {
        }
        static Creator fromJson(const json& j);
        json toJson() const;
        int64_t getUserId() const;
        void setUserId(int64_t _user_id);
        int64_t user_id;
        std::string getUsername() const;
        void setUsername(std::string _username);
        std::string username;
};
