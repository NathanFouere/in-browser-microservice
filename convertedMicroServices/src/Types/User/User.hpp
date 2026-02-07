#pragma once
#include <cstdint>
#include <string>
#include <nlohmann/json.hpp>

using nlohmann::json;

class User {
  public:
  User(int64_t userid,
       const std::string& first_name,
       const std::string& last_name,
       const std::string& username,
       const std::string& password_hashed,
       const std::string& salt);

  void setUserId(int64_t userid);
  void setFirstName(const std::string& first_name);
  void setLastName(const std::string& last_name);
  void setUsername(const std::string& username);
  void setPasswordHashed(const std::string& password_hashed);
  void setSalt(const std::string& salt);
  int64_t getUserId() const;
  const std::string& getFirstName() const;
  const std::string& getLastName() const;
  const std::string& getUsername() const;
  const std::string& getPasswordHashed() const;
  const std::string& getSalt() const;
  json toJson() const;

  private:
    int64_t userid;
    std::string first_name;
    std::string last_name;
    std::string username;
    std::string password_hashed;
    std::string salt;
};
