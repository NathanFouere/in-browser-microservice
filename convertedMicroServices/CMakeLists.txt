cmake_minimum_required(VERSION 3.13)
project(convertedMicroServices)

# Pour aller chercher les packages seulement dans l'env du shell nix (voire https://cmake.org/cmake/help/latest/variable/CMAKE_FIND_ROOT_PATH_MODE_PACKAGE.html)
set(CMAKE_FIND_ROOT_PATH_MODE_PACKAGE NONE)

include(FetchContent)
FetchContent_Declare(
  nlohmann_json
  GIT_REPOSITORY https://github.com/nlohmann/json.git
  GIT_TAG v3.11.3
)
FetchContent_MakeAvailable(nlohmann_json)

add_executable(
    convertedMicroServices
    src/Types/Creator/Creator.cpp
    src/Types/Media/Media.cpp
    src/Types/UserMention/UserMention.cpp
    src/Types/Url/Url.cpp
    src/Types/Post/Post.cpp
    src/Types/Post/PostType.cpp
    src/Types/User/User.cpp
    src/Types/TextServiceReturn/TextServiceReturn.cpp
    src/UniqueIdHandler/UniqueIdHandler.cpp
    src/MediaHandler/MediaHandler.cpp
    src/SocialGraphHandler/SocialGraphHandler.cpp
    src/UserHandler/UserHandler.cpp
    src/PostStorageHandler/PostStorageHandler.cpp
    src/UserMentionHandler/UserMentionHandler.cpp
    src/ComposePostHandler/ComposePostHandler.cpp
    src/TextHandler/TextHandler.cpp
    src/UserTimelineHandler/UserTimelineHandler.cpp
    src/HomeTimelineHandler/HomeTimelineHandler.cpp
    src/SessionStorageUserService/SessionStorageUserService.cpp
)

set_target_properties(convertedMicroServices PROPERTIES
    CXX_STANDARD 17
    OUTPUT_NAME convertedMicroServices
)

target_link_libraries(
    convertedMicroServices
    nlohmann_json::nlohmann_json
)

if(CMAKE_SYSTEM_NAME MATCHES "Emscripten")
    set_target_properties(convertedMicroServices PROPERTIES
        LINK_FLAGS "--bind -sALLOW_MEMORY_GROWTH=1 -sMODULARIZE=1 -sASYNCIFY -sEXPORT_ES6=1 -sEXPORTED_RUNTIME_METHODS=[\\\"stringToNewUTF8\\\"]"
    )
endif()
