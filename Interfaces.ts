import net = require('net');
import SplitStreamOnNewJSON = require('./SplitStreamOnNewJSON');

export type ListGamesResponse = Array<GameLobbyInfo>;

export interface RequestPaths {
    lobbiesLoadBalanced: string,
    gameServers: Array<string>,
    lobbies: Array<string>,
    playerAccounts: Array <string>,
    chatServers: Array<string>,
    chatServersSocketHost: string,
    chatServersSocketPort: number,
    lobbiesSocketHost: string,
    playerStats: string
}

export interface Settings {
    requestPaths: RequestPaths;
    delayForListGames: number;
    timeoutForRequestPost: number;
    defaultMapName: string;
    defaultGameType: string;
}

export interface PlayerInfo {
    playerName: string;
    password: string;
    email: string;
    lobbiesSocketPort?: number;
    sessionToken?: string;
    gameGUID?: string;
    connectionKey?: string;
    lobbiesSocket?: net.Socket;
    chatServerSocket?: net.Socket;
    deferredInGamePromise?: any;
    splitter: SplitStreamOnNewJSON;
}

export interface GetMotdResponse {
    isOnline: boolean;
    MOTD: string;
}

export interface CreateAccountResponse {
    sessionToken: string;
}

export interface DeleteAccountResponse {
    success: boolean;
}

export interface LoginResponse {
    sessionToken: string;
}

export interface GameLobbyInfo {
    gameGUID: string;
    gameName: string;
    gameType: string;
    hostName: string;
    mapName: string;
    maxPlayers: number;
    numOfPlayers: number;
    port: number;
}

export interface HostGameResponse {
    connectionKey: string;
    gameGUID: string;
    gameName: string;
    port: number;
}

export interface JoinGameResponse {
    connectionKey: string;
    gameName: string;
    gameType: string;
    mapName: string;
    numOfPlayers: number;
}

export interface UpdateLobbyInfoResponse {
    gameGUID: string;
    gameName: string;
    gameType: string;
    host: string;
    mapName: string;
    numOfPlayers: number;
    players: Array<UpdateLobbyInfoPlayer>;
    status: string; 
}

export interface PlayerStats {
    playerName: string;
    currentXP: number;
    currentLevel: number;
    gamesPlayed: number;
    xpForNextLevel: number;
    xpDelta: number;
}

export interface EndGamePlayerStats {
    playerName: string;
    currentXP: number;
    currentLevel: number;
    gamesPlayed: number;
    xpForNextLevel: number;
    xpDelta: number;
    nextUnlockableLevel: number;
    lastUnlockedItemIds: Array<string>;
}

export interface GetEndGamePlayersStatsResponse {
    endGamePlayerStats: EndGamePlayerStats;
    playerStatsList: Array<PlayerStats>;
}

export interface UpdateLobbyInfoPlayer {
    botDifficulty: number;
    commanderSelected: string;
    commanderSelectState: string;
    isBot: boolean;
    playerName: string;
    teamNumber: number;
}

export interface GetPlayerInventoryResponse {
    inventoryIds: Array<string>
}

export interface LeaderboardEntry {
    playerName: string;
    rank: number;
    value: number;
}

export interface GetLeaderboardResponse {
    multiplayerXp: Array<LeaderboardEntry>;
    multiplayerWinPercent: Array<LeaderboardEntry>;
    multiplayerKD: Array<LeaderboardEntry>;
}
