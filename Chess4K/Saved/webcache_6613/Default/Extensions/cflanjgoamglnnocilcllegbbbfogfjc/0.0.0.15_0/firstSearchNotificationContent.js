var listenerRef = function clickListener() {
    var searchNotification = document.querySelector(".firstSearchNotification");
    searchNotification.style.display = "none";
    window.removeEventListener("focus", listenerRef);
    window.removeEventListener("click", listenerRef);
    chrome.runtime.sendMessage("notificationDismissed");
}

if (!document.hasFocus()) {
    var body = document.querySelector("body");
    var firstSearchNotificationSource = "https://www.bing.com/browserextension/binghomepagesearch/firstsearchoverlay";
    var firstSearchNotificationFrame = createIframe(firstSearchNotificationSource, "firstSearchNotification");
    body.appendChild(firstSearchNotificationFrame);
    window.addEventListener("focus", listenerRef);
    window.addEventListener("click", listenerRef);
}

function createIframe(src, className = "") {
    var notificationFrame = document.createElement("iframe");
    notificationFrame.classList.add(className);
    notificationFrame.src = src;
    notificationFrame.style.top = "0";
    notificationFrame.style.left = "0";
    notificationFrame.style.zIndex = "1011";
    notificationFrame.style.width = "100vw";
    notificationFrame.style.height = "100%";
    notificationFrame.style.position = "fixed";
    notificationFrame.style.border = "none";
    return notificationFrame;
}