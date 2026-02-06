#pragma once

#include <cstdint>
#include <iostream>

class Media {
    public:
        Media(): media_id(0), media_type() {
        }
        int64_t media_id;
        std::string media_type;
        int64_t getMediaId() const;
        void setMediaId(int64_t _media_id);
        std::string getMediaType() const;
        void setMediaType(std::string _media_type);
};
