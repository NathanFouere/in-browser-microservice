#include "Url.hpp"
#include <emscripten/bind.h>

using namespace emscripten;

std::string Url::getShortenedUrl() const {
    return this->shortened_url;
}

void Url::setShortenedUrl(const std::string& _shortened_url) {
    this->shortened_url = _shortened_url;
}

std::string Url::getExpandedUrl() const {
    return this->expanded_url;
}

void Url::setExpandedUrl(const std::string& _expanded_url) {
    this->expanded_url = _expanded_url;
}

EMSCRIPTEN_BINDINGS(url_module) {
    class_<Url>("Url")
        .constructor<>()
        .property("shortened_url", &Url::getShortenedUrl, &Url::setShortenedUrl)
        .property("expanded_url", &Url::getExpandedUrl, &Url::setExpandedUrl)
    ;
}
