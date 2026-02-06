#pragma once

#include <cstdint>
#include <iostream>
#include <string>
#include "../Types/Creator/Creator.hpp"
#include "../SocialGraphHandler/SocialGraphHandler.hpp"
#include "../UniqueIdHandler/UniqueIdHandler.hpp"
#include "../SessionStorageUserService/SessionStorageUserService.hpp"
#include <map>

class UserHandler {
    public:
        UserHandler(
            SocialGraphHandler& socialGraphHandler, 
            UniqueIdHandler& uniqueIdHandler,
            SessionStorageUserService& sessionStorageUserService
        );
        void RegisterUser(
            const std::string &,
            const std::string &,
            const std::string &,
            const std::string &
        );
        void RegisterUserWithId(
            const std::string &,
            const std::string &,
            const std::string &,
            const std::string &,
            int64_t
        );
        Creator ComposeCreatorWithUserId(
            int64_t,
            const std::string &
        );
        Creator ComposeCreatorWithUsername(
            const std::string &
        );
        bool Login(
            const std::string &,
            const std::string &
        );
        int64_t GetUserId(
            const std::string &username
        );
    private:
        SocialGraphHandler& socialGraphHandler;
        UniqueIdHandler& uniqueIdHandler;
        SessionStorageUserService& sessionStrageUserService;
};
