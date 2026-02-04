import di from "../di.js";

function loginHandler(event) {
  event.preventDefault();

  const usernameInput = document.getElementById("username-input").value;
  const passwordInput = document.getElementById("password-input").value;

  const loginResponse = di.userHandler.Login(usernameInput, passwordInput);

  if (loginResponse == true) {
    window.location.href = "../src/main.html";
  } else {
    console.error("error while logging in");
  }
}

const loginForm = document.getElementById("userform");

loginForm.addEventListener("submit", loginHandler);
