const byId = id => document.getElementById(id);
const isApple = /iPad|iPhone|iPod/i.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const isAndroid = /Android/i.test(navigator.userAgent);
const isPhone = isApple || isAndroid;
const launchURL = new URL("../", location.href);
const shareURL = "https://dreamscaperanch.com/carehub/install/";

// Some home-screen shortcuts reopen the page where they were added.
if (matchMedia("(display-mode: standalone)").matches || navigator.standalone === true) {
  location.replace(launchURL.href);
} else {
  byId("scan").hidden = isPhone;
  byId("iphone").hidden = isAndroid;
  byId("android").hidden = isApple;
  byId("copy-link").hidden = isPhone;
  byId("copy-link").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(shareURL);
      byId("copy-status").textContent = "Link copied. Paste it into your message to the helpers.";
    } catch {
      byId("copy-status").textContent = "Share this link: " + shareURL;
    }
  });

  let installOffer;
  window.addEventListener("beforeinstallprompt", event => {
    if (!isAndroid) return;
    event.preventDefault();
    installOffer = event;
    byId("native").hidden = false;
    byId("android").hidden = true;
  });
  byId("install").addEventListener("click", async () => {
    if (!installOffer) return;
    const offer = installOffer;
    installOffer = undefined;
    byId("native").hidden = true;
    try {
      await offer.prompt();
      const choice = await offer.userChoice;
      if (choice.outcome === "accepted") {
        byId("install-status").textContent = "Installation requested. Look for CareHub on your home screen.";
        return;
      }
    } catch { /* Browser menus remain available when the native offer expires. */ }
    byId("android").hidden = false;
  });
  window.addEventListener("appinstalled", () => {
    installOffer = undefined;
    byId("native").hidden = true;
    byId("install-status").textContent = "CareHub is installed. Open it from your home screen.";
  });
  if ("serviceWorker" in navigator && window.isSecureContext) {
    navigator.serviceWorker.register(new URL("phone-sw.js", launchURL)).catch(() => {
      // Manual home-screen steps also work in browsers that disable service workers.
    });
  }
}
