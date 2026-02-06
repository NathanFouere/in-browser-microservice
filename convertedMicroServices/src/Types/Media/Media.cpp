#include "Media.hpp"
#include <emscripten/bind.h>

using namespace emscripten;

int64_t Media::getMediaId() const {
    return this->media_id;
}

void Media::setMediaId(int64_t _media_id) {
    this->media_id = _media_id;
}

std::string Media::getMediaType() const {
    return this->media_type;
}

void Media::setMediaType(std::string _media_type) {
    this->media_type = _media_type;
}

EMSCRIPTEN_BINDINGS(media_module) {
    class_<Media>("Media")
      .constructor<>()
      .property("media_id", &Media::getMediaId, &Media::setMediaId)
      .property("media_type", &Media::getMediaType, &Media::setMediaType)
    ;
}
