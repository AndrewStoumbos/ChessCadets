var bingUrl = "https://www.bing.com/";
var FeedbackFwlink = "https://go.microsoft.com/fwlink/?linkid=2138838";
var Market = "";
try {
    Market = chrome.i18n.getMessage("ExtnMarket");
    console.log("Try block - Market : " + Market);
}
catch (exception) {
    Market = navigator.language.toLocaleLowerCase();
    console.log("Catch block - Market : " + Market);
}
var ExtensionId = chrome.runtime.id;
var ExtensionVersion = chrome.runtime.getManifest().version;


var PING_ALARM = "CFL_PINGALARM";
let getPingAlarm = chrome.alarms.get(PING_ALARM);
getPingAlarm.then(dailyPingAlarm);

var BG_ALARM = "CFL_BGALARM";
let getBGAlarm = chrome.alarms.get(BG_ALARM);
getBGAlarm.then(dailyBgAlarm);

function dailyPingAlarm(alarm) {
    if (!alarm) {
        console.log("New alarm created: CFL_PINGALARM");
        chrome.alarms.create(PING_ALARM, {
            delayInMinutes: 2
        });
    }
    else {
        console.log("Existing Ping Alarm: " + alarm.name);
    }
}

function dailyBgAlarm(alarm) {
    if (!alarm) {
        console.log("New alarm created: CFL_BGALARM ");
        chrome.alarms.create(BG_ALARM, {
            delayInMinutes: 1
        });
    }
    else {
        console.log("Existing BG Alarm: " + alarm.name);
    }
}

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === BG_ALARM) {
        //Sets '_NTPC' & '_dpc' session cookies in bing.com domain whenever background.js gets executed
        setCookies();
        //To redirect feedback page while uninstalling the extension
        setFeedback();
    }
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === BG_ALARM) {
        var promise = new Promise((resolve, reject) => {
            chrome.storage.local.set({ "ExtnVersion": ExtensionVersion });
            chrome.storage.local.set({ "Migration": "True" });
            console.log("Inside onAlarm ");
            resolve("registry");
        });
        promise
            .then(getBrowserDefaultDetails)
            .then((details) => {
				
                dpcFromLocalstorage(details);

                setCookies();
                setFeedback();
            });
    }
});

chrome.management.onEnabled.addListener(function (ExtensionInfo) {
    var promise = new Promise((resolve, reject) => {
        chrome.storage.local.set({ "ExtnVersion": ExtensionVersion });
        chrome.storage.local.set({ "Migration": "True" });
        console.log("Inside - onEnabled");
        resolve("registry");
    });
    promise
        .then(getBrowserDefaultDetails)
        .then((details) => {

            dpcFromLocalstorage(details);

            setCookies();
            setFeedback();
        });
});

function dpcFromLocalstorage(details) {

    if (details.pc != "" && details.pc != undefined && details.channel != "" && details.channel != undefined) {
        chrome.storage.local.set({ "_dpc": details.pc + "_" + details.channel });
    
    }
    else if (details.channel != "" && details.channel != undefined) {
 
        chrome.storage.local.set({ "_dpc": details.channel });
    }
}

function setCookies() {
    var defaultPC = "U558";
    //Sets '_NTPC' session cookies in bing.com domain whenever background.js gets executed
    chrome.cookies.set({ url: bingUrl, domain: '.bing.com', name: '_NTPC', value: defaultPC }, function (cookie) { });

    //Sets '_dpc' session cookies in bing.com domain whenever background.js gets executed
    chrome.storage.local.get(['channel', '_dpc','pc'], function (items) {
        if (items.channel) {
            var _dpc = items._dpc;
            if (_dpc == undefined || _dpc == "" || _dpc == null) {
                _dpc = items.pc;
            }
            chrome.cookies.set({ url: bingUrl, domain: '.bing.com', name: '_DPC', value: _dpc }, function (cookie) {
            });
        }

    });
}

function setFeedback() {
    chrome.storage.local.get('MachineID', function (items) {
        //To redirect feedback page while uninstalling the extension
        var uninstallUrl = FeedbackFwlink + "&extnID=" + ExtensionId + "&mkt=" + Market + "&mid=" + items.MachineID + "&br=gc";
        //var uninstallUrl = FeedbackFwlink + "&extnID=cflanjgoamglnnocilcllegbbbfogfjc" + "&mkt=" + Market + "&mid=" + MachineID + "&br=gc";

        chrome.runtime.setUninstallURL(uninstallUrl);
    });
}

chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason == 'update') {
        console.log("Update Method");
        chrome.storage.local.set({ showFirstSearchNotification: false })
        chrome.storage.local.set({ "updatePingSent": "false" });
        chrome.storage.local.set({ "ExtensionUpdated": "true" });
        chrome.storage.local.get(["ExtnVersion", "Migration", "ExtensionUpdatepageshown","pc"], function (items) {
            if (!items.ExtnVersion || items.ExtnVersion != chrome.runtime.getManifest().version) {
                //Update version
                chrome.storage.local.set({ "ExtnVersion": ExtensionVersion });
                if(items.Migration && !items.pc)
				{
					chrome.storage.local.set({ "pc": "U558" });
				}
                //If user is updated directly to version 14 from version 11 - for inactive users
                if (!items.Migration && !items.ExtensionUpdatepageshown) {
                    console.log("Display Migration HTML");
                    showhtmlpage();
                }
            }
        });
    }
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === PING_ALARM) {
        chrome.storage.local.get(["ExtensionUpdated", "updatePingSent", "pc", "MachineID", "_dpc", "channel","BingDefaultsSet","Migration"], (items) => {
            if (items.ExtensionUpdated == "true" && items.updatePingSent == "false") {
                chrome.storage.local.set({ "updatePingSent": "true" });
				chrome.storage.local.set({ "ExtensionUpdated": "false" });
                console.log("Update ping");
                //Call for Update Ping
                SendPingDetails("3", items.pc, items.channel, items._dpc, items.MachineID);
            }
			if (items.Migration == "True" && !items.BingDefaultsSet) {
				console.log("es1 ping");
				chrome.storage.local.set({ "BingDefaultsSet": "done" });
			    SendPingDetails("1", items.pc, items.channel, items._dpc, items.MachineID);	
            }	
        });
    }
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === PING_ALARM) {
        chrome.tabs.onActivated.addListener(function () {
            chrome.storage.local.get(["PingDate", "DailyPingbyalarm", "pc", "MachineID", "_dpc", "channel"], (items) => {
                if ((!items.PingDate || items.PingDate != new Date().toDateString()) && !items.DailyPingbyalarm) {
                    //Call for daily Ping
                    console.log("dailyPingbyalarm");
                    SendPingDetails("2", items.pc, items.channel, items._dpc, items.MachineID);
                    var todate = new Date().toDateString();
                    chrome.storage.local.set({ "PingDate": todate });
                    chrome.storage.local.set({ "DailyPingbyalarm": "true" });
                }
            });
        });
    }
});

chrome.tabs.onActivated.addListener(function () {
    chrome.storage.local.get(["DailyPingbyalarm", "PingDate","pc", "MachineID", "_dpc", "channel"], (items) => {
        if (items.DailyPingbyalarm == "true") {
            if (!items.PingDate || items.PingDate != new Date().toDateString()) {
                //Call for daily Ping
                console.log("dailyPingbytab");
                SendPingDetails("2", items.pc, items.channel, items._dpc, items.MachineID);
                var todate = new Date().toDateString();
                chrome.storage.local.set({ "PingDate": todate });
            }
        }
    });
});

function showhtmlpage() {
    chrome.tabs.create({ url: "/Welcomepage/index.html?xid=3008&bmkt=" + Market });
    chrome.storage.local.set({ "ExtensionUpdatepageshown": "True" });
}

/* Function to create an unique machine id */
function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    var MachineGUID = s4() + s4() + s4() + s4() + s4() + s4() + s4() + s4();
    MachineGUID = MachineGUID.toLocaleUpperCase();
    return MachineGUID;
}

function SendPingDetails(status, pc, channel, dpc, machineId) {
    /**
    * Function create and send a ping cosmos
    * @param {any} status
    */
    var startIndex = navigator.userAgent.indexOf("(");
    var endIndex = navigator.userAgent.indexOf(")");
    var OS = navigator.userAgent.substring(startIndex + 1, endIndex).replace(/\s/g, '');
    var browserLanguage = navigator.language;

    var manifestData = chrome.runtime.getManifest();
    var ExtensionVersion = manifestData.version;

    var ExtensionName = manifestData.name.replace(/ /g, "").replace(/&/g, 'and');
    var ExtensionId = chrome.runtime.id;

    var BrowserVersion = navigator.userAgent.substr(navigator.userAgent.indexOf("Chrome")).split(" ")[0].replace("/", "");

    var _pc = !pc ? defaultPC : pc;
    var pingURL = 'http://g.ceipmsn.com/8SE/44?';
    var tVData = 'TV=is' + _pc + '|pk' + ExtensionName + '|tm' + browserLanguage + '|bv' + BrowserVersion + '|ex' + ExtensionId + '|es' + status;
    if (channel)
        tVData = tVData + "|ch" + channel;
    if (dpc)
        tVData = tVData + "|dp" + dpc;
    pingURL = pingURL + 'MI=' + machineId + '&LV=' + ExtensionVersion + '&OS=' + OS + '&TE=37&' + tVData;
    pingURL = encodeURI(pingURL);  // For HTML Encoding
    fetch(pingURL);
};

chrome.action.onClicked.addListener(function (tab) {
    var redirectURL = "http://www.bing.com/?pc=U558";
    chrome.storage.local.get('pc', (items) => {
        if (items.pc) {
            redirectURL = "http://www.bing.com/?pc=" + items.pc;
        }
        chrome.tabs.create({ url: redirectURL });
    });
});
