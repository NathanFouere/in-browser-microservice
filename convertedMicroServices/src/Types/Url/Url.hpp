#pragma once

#include <string>
class Url {
    public:
        Url() noexcept
            : shortened_url(),
            expanded_url() {
        }
        void setShortenedUrl(const std::string& _shortened_url);
        std::string getShortenedUrl() const;
        void setExpandedUrl(const std::string& _expanded_url);
        std::string getExpandedUrl() const;
    private:
        std::string shortened_url;
        std::string expanded_url;
};
