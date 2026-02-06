#include "TextServiceReturn.hpp"
#include <emscripten/bind.h>

using namespace emscripten;

TextServiceReturn::TextServiceReturn(
    const std::string& text
): text(text) {
}

void TextServiceReturn::setText(const std::string& _text) {
    this->text = _text;
}

std::string TextServiceReturn::getText() const {
    return this->text;
}


EMSCRIPTEN_BINDINGS(text_service_return_module) {
    class_<TextServiceReturn>("TextServiceReturn")
        .constructor<std::string>()
        .property("text", &TextServiceReturn::getText, &TextServiceReturn::setText)
    ;
}
