﻿import nconf = require('nconf');
import I = require('../Interfaces');

class Settings implements I.Settings {

    get requestPaths():I.RequestPaths {
        return nconf.get('requestPaths') as I.RequestPaths;
    }

    set requestPaths(newValue:I.RequestPaths) {
        nconf.set('requestPaths', newValue);
    }

    get delayForListGames(): number {
        return nconf.get('delayForListGames') as number;
    }

    get timeoutForRequestPost(): number {
        return nconf.get('timeoutForRequestPost') as number;
    }

    get defaultMapName(): string {
        return nconf.get('defaultMapName') as string;
    }

    get defaultGameType(): string {
        return nconf.get('defaultGameType') as string;
    }
}

let defaultSettings:I.Settings = {
    requestPaths: {
        gameServers: ["http://127.0.0.1:11000"],
        lobbiesLoadBalanced: "http://127.0.0.1:10000/v1",
        lobbies: ["http://127.0.0.1:10200/v1"],
        playerAccounts: ["https://127.0.0.1"],
        chatServers: ["http://127.0.0.1:10400"],
        chatServersSocketHost: "127.0.0.1",
        chatServersSocketPort: 10700,
        lobbiesSocketHost: "127.0.0.1",
        playerStats: "http://127.0.0.1:10500/v1"
    },
    delayForListGames: 2000,
    timeoutForRequestPost: 10000,
    defaultMapName: "SacredArena",
    defaultGameType: "TheMaestrosGame.TMRoundBasedGameInfo"
};

nconf.file('./config/settings.json')
    .defaults(defaultSettings);

let settings: I.Settings = new Settings();
export = settings;