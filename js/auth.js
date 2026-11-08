"use strict";
(async () => {
  const UI = HubUI;
  const emailRule = (v) =>
    !v.trim()
      ? "Enter your email address."
      : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
        ? "Use a complete email address, such as name@example.com."
        : "";
  document.querySelectorAll(".js-login-form").forEach((form) => {
    UI.bindForm(
      form,
      { email: emailRule, password: (v) => (v ? "" : "Enter your password.") },
      async (data, f) => {
        const user = await HubStore.login(
          String(data.get("email")),
          String(data.get("password")),
        );
        if (!user) {
          UI.errorFor(
            f.elements.password,
            "Email or password is incorrect. Please try again.",
          );
          f.elements.password.focus();
          return;
        }
        f.reset();
        UI.clearErrors(f);
        UI.status(f, "Signed in. Opening your workspace…", true);
        const next = new URLSearchParams(location.search).get("next");
        const allowed = ["dashboard.html", "study-plan.html", "resources.html"];
        location.href = allowed.includes(next) ? next : "dashboard.html";
      },
    );
  });
  const signup = document.getElementById("signup-form");
  if (signup) {
    signup.elements.password.addEventListener("input", () => {
      const confirm = signup.elements.confirmPassword;
      if (confirm.getAttribute("aria-invalid") === "true")
        UI.errorFor(
          confirm,
          confirm.value === signup.elements.password.value
            ? ""
            : "The passwords do not match.",
        );
    });
    UI.bindForm(
      signup,
      {
        fullName: (v) =>
          v.trim().length < 2
            ? "Enter your full name."
            : v.trim().length > 50
              ? "Keep your name within 50 characters."
              : "",
        email: emailRule,
        password: (v) =>
          v.length < 12
            ? "Use at least 12 characters."
            : !/[a-z]/.test(v) ||
                !/[A-Z]/.test(v) ||
                !/[0-9]/.test(v) ||
                !/[\W_]/.test(v)
              ? "Include uppercase, lowercase, a number and a symbol."
              : "",
        confirmPassword: (v, f) =>
          !v
            ? "Confirm your password."
            : v !== f.elements.password.value
              ? "The passwords do not match."
              : "",
        field: (v) => (!v ? "Choose your main interest." : ""),
      },
      async (data, form) => {
        await HubStore.register(
          {
            name: String(data.get("fullName")).trim(),
            email: String(data.get("email")).trim(),
            field: String(data.get("field")),
          },
          String(data.get("password")),
        );
        form.reset();
        UI.clearErrors(form);
        UI.status(
          form,
          "Your account is ready for this session. You can now log in.",
          true,
        );
        document.getElementById("signup-next").hidden = false;
      },
    );
  }
})();
