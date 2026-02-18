
var browserDefaultsUrl = "https://browserdefaults.microsoft.com/";
var defaultPC = "U558";

function getBrowserDefaultDetails(channelID) {
    return new Promise((resolve) => {
        console.log("Enter getBrowserDefaultDetails");

        var details = {
            pc: "U558",
            channel: channelID,
            _dpc: channelID,
            MachineID: guid()
        };
        chrome.storage.local.get('pc', (items) => {
            if (!items.pc) {
                chrome.cookies.getAll({}, function (cookies) {

                    for (var i in cookies) {
                        cookieFound = false;
                        if (cookies[i].name == "PCCode") {
                            defaultPC = cookies[i].value;
                            cookieFound = true;
                            details.pc = defaultPC;
                        }
                        else if (cookies[i].name == "channel") {
                            details.channel = cookies[i].value;
                            cookieFound = true;
                        }
                        //Remove cookies value
                        if (cookieFound) {
                            var url = "http" + (cookies[i].secure ? "s" : "") + "://" + cookies[i].domain + cookies[i].path;
                            chrome.cookies.remove({ "url": url, "name": cookies[i].name });
                        }
                    }
                    chrome.storage.local.set(details, () => { resolve(details) });
                });

                chrome.cookies.get({ url: browserDefaultsUrl, name: 'PCCode' }, function (cookie) {
                    if (cookie) {
                        defaultPC = cookie.value;
                        details.pc = defaultPC;
                        chrome.cookies.remove({ url: browserDefaultsUrl, name: 'PCCode' });
                    }
                    chrome.storage.local.set(details, () => { resolve(details) });
                });
                chrome.cookies.get({ url: browserDefaultsUrl, name: 'channel' }, function (cookie) {
                    if (cookie) {
                        details.channel = cookie.value;
                        chrome.cookies.remove({ url: browserDefaultsUrl, name: 'channel' });
                    }
                    chrome.storage.local.set(details, () => { resolve(details) });
                });

                console.log("Exit getBrowserDefaultDetails");


            }
        });

    });
}



