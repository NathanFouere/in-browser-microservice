#include "PostType.hpp"
#include <emscripten/bind.h>

using namespace emscripten;

EMSCRIPTEN_BINDINGS(posttype_module) {
    enum_<PostType::type>("PostType")
      .value("POST", PostType::POST)
      .value("REPOST", PostType::REPOST)
      .value("REPLY", PostType::REPLY)
      .value("DM", PostType::DM);
}
