#include "TextHandler.hpp"
#include <emscripten/bind.h>

using namespace emscripten;

TextHandler::TextHandler(
    UserMentionHandler& userMentionHandler):
        userMentionHandler(userMentionHandler)
{

}

TextServiceReturn TextHandler::ComposeText(const std::string &text) {

    return *(new TextServiceReturn(
        text
    ));
}

EMSCRIPTEN_BINDINGS(text_handler_module) {
    class_<TextHandler>("TextHandler")
        .constructor<UserMentionHandler&>()
        .function("ComposeText", &TextHandler::ComposeText);
}
