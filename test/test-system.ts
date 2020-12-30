import I = require('../Interfaces');
import assert = require('assert');
import should = require('should');
import settings = require('../config/settings');
import request = require('request');
import Q = require('q');
import net = require('net');
let logger = require('../logger');
import SplitStreamOnNewJSON = require('../SplitStreamOnNewJSON');

describe("System Functional Tests", () => {
    let playerInfos: Array<I.PlayerInfo>;
    const initialPlayerInventory: I.GetPlayerInventoryResponse = { inventoryIds: ["RoboMeister"] };
    const NUMBER_PLAYERS_PER_GAME: number = 6;
    const SEND_MESSAGE: string = "SendMessage";
    const GET_USERS: string = "GetUsers";
    const SWITCH_ROOM: string = "SwitchRoom";

    let chatMessage: String = "Test Message";

    beforeEach(() => {
        playerInfos = new Array<I.PlayerInfo>();
        
    });

    function assertResponseIsValid(error: any, response: any, body: any, callingUrl: string) {
        if (error) {
            assert.equal(error, null, "Request Post to " + callingUrl + " has error in assertResponseIsValid() " + error);
        }
        assert.ok(response != null, "Request Post to " + callingUrl + " has an empty response");
        assert.ok(body != null, "Request Post to " + callingUrl + " has an empty body");
        if (body.error) {
            assert.equal(error, null, "Request to " + callingUrl + " Post Body has error in assertResponseIsValid()");
        }
    }

    function getMOTD(): Q.Promise<I.GetMotdResponse> {
        let callingUrl: string = settings.requestPaths.lobbiesLoadBalanced + '/platformMOTD';
        let promise: Q.Promise<I.GetMotdResponse> = Q.Promise((resolve: (val: I.GetMotdResponse) => void, reject) => {
            request.post({
                uri: callingUrl,
                json: true
            }, (error: any, response: any, body: any) => {
                assertResponseIsValid(error, response, body, callingUrl);
                assert.ok(body.featureToggles != null, "Request Post to " + callingUrl + " is missing featureToggles in its body");
                assert.ok(body.featureToggles.isOnline != null, "Request Post to " + callingUrl + " is missing featureToggles.isOnline in its body");
                assert.ok(body.featureToggles.multiplayerEnabled != null, "Request Post to " + callingUrl + " is missing featureToggles.multiplayerEnabled in its body");
                assert.ok(body.MOTD != null, "Request Post to " + callingUrl + " is missing MOTD in its body");

                let getMotdResponse: I.GetMotdResponse = {
                    isOnline: body.isOnline,
                    MOTD: body.MOTD
                }

                resolve(getMotdResponse);
            });
        });
        return promise;
    }

    function createAccount(playerInfo: I.PlayerInfo): Q.Promise<I.CreateAccountResponse> {
        let callingUrl: string = settings.requestPaths.playerAccounts + '/createPlayer2';
        let promise: Q.Promise<I.CreateAccountResponse> = Q.Promise((resolve: (val: I.CreateAccountResponse) => void, reject) => {
            //Had to edit request.d.ts about for the form field to work.
            request.post({
                uri: callingUrl,
                timeout: settings.timeoutForRequestPost,
                strictSSL: false,
                json: true,
                form: {
                    playerName: playerInfo.playerName,
                    password: playerInfo.password,
                    email: playerInfo.email,
                    birthDate: "October 13, 1991 11:14:00",
                    steamUsername: playerInfo.playerName
                }
            }, (error: any, response: any, body: any) => {
                assertResponseIsValid(error, response, body, callingUrl);
                assert.ok(body.sessionToken != null, "Request Post to " + callingUrl + " is missing sessionToken in its body. " + JSON.stringify(body));

                let createAccountResponse: I.CreateAccountResponse = {
                    sessionToken: body.sessionToken
                }

                resolve(createAccountResponse);
            });
        });
        return promise;
    }

    function deleteAccount(playerInfo: I.PlayerInfo): Q.Promise<I.DeleteAccountResponse> {
        let callingUrl: string = settings.requestPaths.playerAccounts + '/deletePlayer2';
        let promise: Q.Promise<I.DeleteAccountResponse> = Q.Promise((resolve: (val: I.DeleteAccountResponse) => void, reject) => {
            //Had to edit request.d.ts about for the form field to work.
            request.post({
                uri: callingUrl,
                timeout: settings.timeoutForRequestPost,
                strictSSL: false,
                json: true,
                form: {
                    playerName: playerInfo.playerName,
                    password: playerInfo.password
                }
            }, (error: any, response: any, body: any) => {
                assertResponseIsValid(error, response, body, callingUrl);
                assert.ok(body.success != null, "Request Post to " + callingUrl + " is missing success in its body");

                let deleteAccountResponse: I.DeleteAccountResponse = {
                    success: body.success 
                }

                resolve(deleteAccountResponse);
            });
        });
        return promise;
    }

    function login(playerInfo: I.PlayerInfo): Q.Promise<I.LoginResponse> {
        let callingUrl: string = settings.requestPaths.playerAccounts + '/login';
        let promise: Q.Promise<I.LoginResponse> = Q.Promise((resolve: (val: I.LoginResponse) => void, reject) => {
            request.post({
                uri: callingUrl,
                timeout: settings.timeoutForRequestPost,
                strictSSL: false,
                json: true,
                form: {
                    playerName: playerInfo.playerName,
                    password: playerInfo.password
                }
            }, (error: any, response: any, body: any) => {
                assertResponseIsValid(error, response, body, callingUrl);
                assert.ok(body.sessionToken != null, "Request Post to " + callingUrl + " is missing sessionToken in its body");

                let loginResponse: I.LoginResponse = {
                    sessionToken: body.sessionToken
                }

                resolve(body);
            });
        });
        return promise;
    }

    function listGames(playerInfo: I.PlayerInfo): Q.Promise<I.ListGamesResponse> {
        let callingUrl: string = settings.requestPaths.lobbiesLoadBalanced + '/listGames';
        let promise: Q.Promise<I.ListGamesResponse> = Q.Promise((resolve: (val: I.ListGamesResponse) => void, reject) => {
            request.post({
                uri: callingUrl,
                timeout: settings.timeoutForRequestPost,
                json: true,
                form: {
                    playerName: playerInfo.playerName,
                    sessionToken: playerInfo.sessionToken
                }
            }, (error: any, response: any, body: any) => {
                assertResponseIsValid(error, response, body, callingUrl);
                let listGamesResponse: I.ListGamesResponse = new Array<I.GameLobbyInfo>();
                assert.ok(body.length != null, "Request Post to " + callingUrl + " is missing length in its body");
                for (let i = 0; i < body.length; i++) {
                    assert.ok(body[i] != null, "Request Post to " + callingUrl + " is missing lobbyGameInfo at index " + i + " in its body");
                    assert.ok(body[i].gameGUID != null, "Request Post to " + callingUrl + " is missing gameGUID in lobbyGameInfo at index " + i + "  in its body");
                    assert.ok(body[i].gameName != null, "Request Post to " + callingUrl + " is missing gameName in lobbyGameInfo at index " + i + "  in its body");
                    assert.ok(body[i].gameType != null, "Request Post to " + callingUrl + " is missing gameType in lobbyGameInfo at index " + i + "  in its body");
                    assert.ok(body[i].hostName != null, "Request Post to " + callingUrl + " is missing hostName in lobbyGameInfo at index " + i + "  in its body");
                    assert.ok(body[i].mapName != null, "Request Post to " + callingUrl + " is missing mapName in lobbyGameInfo at index " + i + "  in its body");
                    assert.ok(body[i].maxPlayers != null, "Request Post to " + callingUrl + " is missing maxPlayers in lobbyGameInfo at index " + i + "  in its body");
                    assert.ok(body[i].numOfPlayers != null, "Request Post to " + callingUrl + " is missing numOfPlayers in lobbyGameInfo at index " + i + "  in its body");
                    assert.ok(body[i].port != null, "Request Post to " + callingUrl + " is missing port in lobbyGameInfo at index " + i + "  in its body");
                    let gameLobbyInfo: I.GameLobbyInfo = {
                        gameGUID: body[i].gameGUID,
                        gameName: body[i].gameName,
                        gameType: body[i].gameType,
                        hostName: body[i].hostName,
                        mapName: body[i].mapName,
                        maxPlayers: body[i].maxPlayers,
                        numOfPlayers: body[i].numOfPlayers,
                        port: body[i].port
                    }
                    listGamesResponse.push(gameLobbyInfo);
                }
                resolve(listGamesResponse);
            });
        });
        return promise;
    }

    function hostGame(playerInfo: I.PlayerInfo, gameName: string, mapName: string, gameType: string): Q.Promise<I.HostGameResponse> {
        let callingUrl: string = settings.requestPaths.lobbiesLoadBalanced + '/hostGame';
        let promise: Q.Promise<I.HostGameResponse> = Q.Promise((resolve: (val: I.HostGameResponse) => void, reject) => {
            request.post({
                uri: callingUrl,
                timeout: settings.timeoutForRequestPost,
                json: true,
                form: {
                    playerName: playerInfo.playerName,
                    sessionToken: playerInfo.sessionToken,
                    gameName: gameName,
                    mapName: mapName,
                    gameType: gameType
                }
            }, (error: any, response: any, body: any) => {
                assertResponseIsValid(error, response, body, callingUrl);
                assert.ok(body.gameName != null, "Request Post to " + callingUrl + " is missing gameName in its body");
                assert.ok(body.gameGUID != null, "Request Post to " + callingUrl + " is missing gameGUID in its body");
                assert.ok(body.connectionKey != null, "Request Post to " + callingUrl + " is missing connectionKey in its body");
                assert.ok(body.port != null, "Request Post to " + callingUrl + " is missing port in its body");

                let hostGameResponse: I.HostGameResponse = {
                    connectionKey: body.connectionKey,
                    gameGUID: body.gameGUID,
                    gameName: body.gameName,
                    port: body.port
                }

                resolve(hostGameResponse);
            });
        });
        return promise;
    }

    function joinGame(playerInfo: I.PlayerInfo): Q.Promise<I.JoinGameResponse> {
        let callingUrl: string = settings.requestPaths.lobbiesLoadBalanced + '/joinGame';
        let promise: Q.Promise<I.JoinGameResponse> = Q.Promise((resolve: (val: I.JoinGameResponse) => void, reject) => {
            request.post({
                uri: callingUrl,
                timeout: settings.timeoutForRequestPost,
                json: true,
                form: {
                    playerName: playerInfo.playerName,
                    sessionToken: playerInfo.sessionToken,
                    gameGUID: playerInfo.gameGUID
                }
            }, (error: any, response: any, body: any) => {
                assertResponseIsValid(error, response, body, callingUrl);
                assert.ok(body.connectionKey != null, "Request Post to " + callingUrl + " is missing connectionKey in its body");
                assert.ok(body.gameName != null, "Request Post to " + callingUrl + " is missing gameName in its body");
                assert.ok(body.gameType != null, "Request Post to " + callingUrl + " is missing gameType in its body");
                assert.ok(body.mapName != null, "Request Post to " + callingUrl + " is missing mapName in its body");
                assert.ok(body.numOfPlayers != null, "Request Post to " + callingUrl + " is missing numOfPlayers in its body");

                let joinGameResponse: I.JoinGameResponse = {
                    connectionKey: body.connectionKey,
                    gameName: body.gameName,
                    gameType: body.gameType,
                    mapName: body.mapName,
                    numOfPlayers: body.numOfPlayers
                }

                resolve(joinGameResponse);
            });
        });
        return promise;
    }

    function updateLobbyInfo(playerInfo: I.PlayerInfo, lobbyCommand: string, lobbyCommandParameters: string = null): Q.Promise<I.UpdateLobbyInfoResponse> {
        let callingUrl: string = settings.requestPaths.lobbiesLoadBalanced + '/updateLobbyInfo/' + lobbyCommand;
        let promise: Q.Promise<I.UpdateLobbyInfoResponse> = Q.Promise((resolve: (val: I.UpdateLobbyInfoResponse) => void, reject) => {
            request.post({
                uri: callingUrl,
                timeout: settings.timeoutForRequestPost,
                json: true,
                form: {
                    playerName: playerInfo.playerName,
                    sessionToken: playerInfo.sessionToken,
                    gameGUID: playerInfo.gameGUID,
                    lobbyCommandParameters: lobbyCommandParameters
                }
            }, (error: any, response: any, body: any) => {
                assertResponseIsValid(error, response, body, callingUrl);
                assert.ok(body.gameGUID != null, "Request Post to " + callingUrl + " is missing gameGUID in its body");
                assert.ok(body.gameName != null, "Request Post to " + callingUrl + " is missing gameName in its body");
                assert.ok(body.gameType != null, "Request Post to " + callingUrl + " is missing gameType in its body");
                assert.ok(body.host != null, "Request Post to " + callingUrl + " is missing host in its body");
                assert.ok(body.mapName != null, "Request Post to " + callingUrl + " is missing mapName in its body");
                assert.ok(body.numOfPlayers != null, "Request Post to " + callingUrl + " is missing numOfPlayers in its body");
                assert.ok(body.players != null, "Request Post to " + callingUrl + " is missing players in its body");
                assert.ok(body.players.length != null, "Request Post to " + callingUrl + " is missing players.length in its body");
                assert.ok(body.players.length == body.numOfPlayers, "Request Post to " + callingUrl + " has different values for players.length and numOfPlayers in its body");
                let updateLobbyInfoPlayers: Array<I.UpdateLobbyInfoPlayer> = new Array<I.UpdateLobbyInfoPlayer>() 
                for (let i = 0; i < body.players.length; i++) {
                    assert.ok(body.players[i] != null, "Request Post to " + callingUrl + " is missing udpateLobbyInfoPlayer at index " + i + "  in its body");
                    assert.ok(body.players[i].botDifficulty != null, "Request Post to " + callingUrl + " is missing botDifficulty in udpateLobbyInfoPlayer at index " + i + "  in its body");
                    assert.ok(body.players[i].commanderSelected != null, "Request Post to " + callingUrl + " is missing commanderSelected in udpateLobbyInfoPlayer at index " + i + "  in its body");
                    assert.ok(body.players[i].commanderSelectState != null, "Request Post to " + callingUrl + " is missing commanderSelectState in udpateLobbyInfoPlayer at index " + i + "  in its body");
                    assert.ok(body.players[i].isBot != null, "Request Post to " + callingUrl + " is missing isBot in udpateLobbyInfoPlayer at index " + i + "  in its body");
                    assert.ok(body.players[i].playerName != null, "Request Post to " + callingUrl + " is missing playerName in udpateLobbyInfoPlayer at index " + i + "  in its body");
                    assert.ok(body.players[i].teamNumber != null, "Request Post to " + callingUrl + " is missing teamNumber in udpateLobbyInfoPlayer at index " + i + "  in its body");

                    let updateLobbyInfoPlayer: I.UpdateLobbyInfoPlayer = {
                        botDifficulty: body.players[i].botDifficulty,
                        commanderSelected: body.players[i].commanderSelected,
                        commanderSelectState: body.players[i].commanderSelectState,
                        isBot: body.players[i].isBot,
                        playerName: body.players[i].playerName,
                        teamNumber: body.players[i].teamNumber
                    }
                    updateLobbyInfoPlayers.push(updateLobbyInfoPlayer);
                }
                assert.ok(body.status != null);

                let updateLobbyInfoResponse: I.UpdateLobbyInfoResponse = {
                    gameGUID: body.gameGUID,
                    gameName: body.gameName,
                    gameType: body.gameType,
                    host: body.host,
                    mapName: body.mapName,
                    numOfPlayers: body.numOfPlayers,
                    players: updateLobbyInfoPlayers,
                    status: body.status
                }

                resolve(updateLobbyInfoResponse);
            });
        });
        return promise;
    }

    function getGameServerDataFor(gameGUID:string): Q.Promise<any> {
        let promise: Q.Promise<any> = Q.Promise((resolve, reject) => {
            request.get({
                uri: settings.requestPaths.gameServers + '/getGameServerData',
                timeout: settings.timeoutForRequestPost
            }, (error: any, response: any, body: any) => {
                let responseBody: any = JSON.parse(body);
                for (let i: number = 0; i < body.length; ++i) {
                    if (responseBody[i].gameGUID == gameGUID) {
                        resolve(responseBody[i].jobID);
                        return;
                    }
                }
                resolve(null);
            });
        });
        return promise;
    }

    function killJobManually(jobId: string): Q.Promise<any> {
        let promise: Q.Promise<any> = Q.Promise((resolve, reject) => {
            request.get({
                uri: settings.requestPaths.gameServers + '/killJobManually?jobID=' + jobId,
                timeout: settings.timeoutForRequestPost
            }, (error: any, response: any, body: any) => {
                resolve(null);
            });
        });
        return promise;
    }

    function makeChatServerSocket(playerInfo: I.PlayerInfo, chatRoomName: String): Q.Promise<Q.Deferred<{}>> {
        return Q.Promise((resolve: (val: Q.Deferred<{}>) => void, reject) => {
            let socket: net.Socket = new net.Socket();
            playerInfo.splitter =  new SplitStreamOnNewJSON();
            let deferred: Q.Deferred<{}> = Q.defer();
            playerInfo.chatServerSocket = socket;
            let onSocketData: Function = function handleSocketData(data: any) {
                playerInfo.splitter.lookForJSON(data);
            };
            socket.on('data', onSocketData);
            socket.on('error', (error) => {
                logger.error(error);
                reject(error);
                deferred.reject(error);
            });
            socket.on('end', () => {
                logger.error("Chat Server Socket disconnected");
                //assert.equal("Disconnected Chat Server Socket");
                //reject("Disconnected from chat server socket early.");
            });
            socket.on('connect', (data: any) => {

            });
            let onData: Function = function handleChatData(chunk: any) {
                try {
                    let obj:any = JSON.parse(chunk);
                    if (obj.commandType) {
                        playerInfo.chatServerSocket.removeListener('data', onSocketData);
                        playerInfo.splitter.removeListener('data', handleChatData);
                        deferred.resolve(obj);
                    }
                } catch (err) {
                    logger.error(err);
                }
            };

            playerInfo.splitter.on('data', onData);

            socket.connect(settings.requestPaths.chatServersSocketPort, settings.requestPaths.chatServersSocketHost);
            let connectionJson: any = {
                room: chatRoomName,
                name: playerInfo.playerName
            }
            let message = JSON.stringify(connectionJson) + "\n";
            socket.write(new Buffer(message, 'utf8'), () => {
                resolve(deferred);
            });
        });
    }

    function getChatUsers(playerInfo: I.PlayerInfo, chatRoomName: String): void {
        let messageJson: any = {
            commandType: GET_USERS,
            room: chatRoomName,
        };
        let stringifiedMessage = JSON.stringify(messageJson) + "\n";
        playerInfo.chatServerSocket.write(new Buffer(stringifiedMessage, 'utf8'));
    }

    function switchChatRoom(playerInfo: I.PlayerInfo, newChatRoomName: String): Q.Promise<Q.Deferred<{}>> {
        return Q.Promise((resolve: (val: Q.Deferred<{}>) => void, reject) => {
            let deferred: Q.Deferred<{}> = Q.defer();
            let socket: net.Socket = playerInfo.chatServerSocket;
            let onSocketData: Function = function handleSocketData(data: any) {
                playerInfo.splitter.lookForJSON(data);
            };

            playerInfo.chatServerSocket.on('data', onSocketData);

            let onSplitterData: Function = function handleSplitterData(chunk: any) {
                try {
                    let obj: any = JSON.parse(chunk);
                    if (obj.commandType) {
                        playerInfo.chatServerSocket.removeListener('data', onSocketData);
                        playerInfo.splitter.removeListener('data', handleSplitterData);
                        deferred.resolve(obj);
                    }
                } catch (err) {
                    logger.error(err);
                }
            };
            playerInfo.splitter.on('data', onSplitterData);

            let messageJson: any = {
                commandType: SWITCH_ROOM,
                room: newChatRoomName,
            };
            let stringifiedMessage = JSON.stringify(messageJson) + "\n";
            playerInfo.chatServerSocket.write(new Buffer(stringifiedMessage, 'utf8'), () => {
                resolve(deferred);
            });
        });
    }
    
    function sendChatMessage(playerInfo: I.PlayerInfo, message: String): void {
        let messageJson = {
            commandType: SEND_MESSAGE,
            message: message,
        }
        let stringifiedMessage = JSON.stringify(messageJson) + "\n";
        playerInfo.chatServerSocket.write(new Buffer(stringifiedMessage, 'utf8'));
    }

    function makeLobbiesSocket(playerInfo: I.PlayerInfo): Q.Promise<Object> {
        return Q.Promise((resolve, reject) => {
            let socket: net.Socket = new net.Socket();
            let splitter = new SplitStreamOnNewJSON();
            playerInfo.lobbiesSocket = socket;
            socket.on('data', (data) => {
                splitter.lookForJSON(data);
            });
            socket.on('error', (error) => {
                logger.error(error);
                reject(error);
            });
            socket.on('end', () => {
                logger.error("Lobbies Socket disconnected");
                //assert.equal("Disconnected Lobbies Socket");
            });
            socket.on('connect', (data: any) => {

            });
            splitter.on('data', (chunk: any) => {
                let obj = JSON.parse(chunk);
                if (obj.command == "updateGameInfo") {
                    if (obj.body.status == "InGame") {
                        playerInfo.deferredInGamePromise.resolve();
                    }
                }
                resolve(obj);
            });

            socket.connect(playerInfo.lobbiesSocketPort, settings.requestPaths.lobbiesSocketHost);
            let connectionJson = {
                gameGUID: playerInfo.gameGUID,
                playerName: playerInfo.playerName,
                connectionKey: playerInfo.connectionKey
            }
            let message = JSON.stringify(connectionJson);
            socket.write(new Buffer(message, 'ascii'));
        });
    }
    
    function createPlayerInfo(randomNumber: number): I.PlayerInfo {
        let playerName: string = "Player" + randomNumber;
        let password: string = "letmein" + randomNumber; // so secure from us ;)
        let email: string = "email" + randomNumber + "@example.com";
        let deferredInGamePromise = Q.defer<any>();

        return {
            playerName: playerName,
            password: password,
            email: email,
            deferredInGamePromise: deferredInGamePromise,
            chatServerSocket: null,
            splitter: null
        };
    }

    function createRandomPlayerInfo(): I.PlayerInfo {
        let randomNumber: number = Math.round(Math.random() * 1000000000);
        return createPlayerInfo(randomNumber);
    }

    function hostGameAndMakeSocket(playerInfo: I.PlayerInfo): Q.Promise<Object> {
        let promise: Q.Promise<Object> = Q.fcall(() => { }).then(() => {
            return hostGame(playerInfos[0], "GameName " + playerInfo.playerName, settings.defaultMapName, settings.defaultGameType);
        }).then((res: I.HostGameResponse) => {
            playerInfo.gameGUID = res.gameGUID;
            playerInfo.connectionKey = res.connectionKey;
            playerInfo.lobbiesSocketPort = res.port;
            return makeLobbiesSocket(playerInfo);
        });
        return promise;
    }

    function createCreateAccountPromise(playerIndex: number): Q.Promise<void> {
        let promise: Q.Promise<void> = Q.fcall(() => { }).delay(200 * playerIndex).then(() => {
            playerInfos.push(createRandomPlayerInfo());
            return createAccount(playerInfos[playerIndex]);
        }).then((res: I.CreateAccountResponse) => {
            playerInfos[playerIndex].sessionToken = res.sessionToken;
        });

        return promise;
    }

    function createJoinGameAndMakeLobbiesSocketPromise(playerInfo: I.PlayerInfo): Q.Promise<Object> {
        let promise: Q.Promise<Object> = Q.delay(settings.delayForListGames).then(() => {
            return listGames(playerInfo);
        }).then((res: I.ListGamesResponse) => {
            assert.ok(res.length > 0, "listGames returned no lobbies in createJoinGameAndMakeSocketPromise");
            let lobby: I.GameLobbyInfo = res[0];
            playerInfo.gameGUID = lobby.gameGUID;
            playerInfo.lobbiesSocketPort = lobby.port;
            return joinGame(playerInfo);
        }).then((res: I.JoinGameResponse) => {
            playerInfo.connectionKey = res.connectionKey;
            return makeLobbiesSocket(playerInfo);
        });

        return promise;
    }

    function createGetEndGameStatsPromise(playerInfo: I.PlayerInfo): Q.Promise<any> {
        let callingUrl: string = settings.requestPaths.playerStats + '/getEndGamePlayerStats';
        let playerStatsJSONBody = {
            callingPlayerName: playerInfo.playerName,
            newGamesPlayed: 1,
            sessionToken: playerInfo.sessionToken,
            playerNames: playerInfos.map((playerInfo: I.PlayerInfo) => { return playerInfo.playerName; })
        };
        let promise: Q.Promise<any> = Q.Promise((resolve, reject) => {
            request.post({
                uri: callingUrl,
                timeout: settings.timeoutForRequestPost,
                form: {
                    playerStats: JSON.stringify(playerStatsJSONBody)
                }
            }, (error: any, response: any, body: any) => {
                assertResponseIsValid(error, response, body, callingUrl);
                let responseBody: any = JSON.parse(body);
                assert.ok(responseBody.endGamePlayerStats != null);
                assert.ok(responseBody.endGamePlayerStats.playerName != null);
                assert.ok(responseBody.endGamePlayerStats.currentXP != null);
                assert.ok(responseBody.endGamePlayerStats.currentLevel != null);
                assert.ok(responseBody.endGamePlayerStats.gamesPlayed != null);
                assert.ok(responseBody.endGamePlayerStats.xpForNextLevel != null);
                assert.ok(responseBody.endGamePlayerStats.xpDelta != null);
                assert.ok(responseBody.endGamePlayerStats.nextUnlockableLevel != null);
                assert.ok(responseBody.playerStatsList != null);
                for (let i = 0; i < responseBody.playerStatsList.length; i++) {
                    assert.ok(responseBody.playerStatsList[i].playerName != null);
                    assert.ok(responseBody.playerStatsList[i].currentXP != null);
                    assert.ok(responseBody.playerStatsList[i].currentLevel != null);
                    assert.ok(responseBody.playerStatsList[i].gamesPlayed != null);
                    assert.ok(responseBody.playerStatsList[i].xpForNextLevel != null);
                    assert.ok(responseBody.playerStatsList[i].xpDelta != null);
                }
                resolve(responseBody);
            });
        });

        return promise;
    }

    function processEndGameStats(localPlayerInfos: I.PlayerInfo[]): Q.Promise<any> {
        let callingUrl: string = settings.requestPaths.playerStats + '/processEndGameStats';
        let statsCall = {
            MapName: "fissure",
            GameLengthSeconds: 198,
            GameLengthRealSeconds: 202,
            NumHumanPlayers: NUMBER_PLAYERS_PER_GAME,
            NumBots: 0,
            ExitCondition: "Normative",
            GameGUID: localPlayerInfos[0].gameGUID,
            PlayerStats:[
                {
                    PlayerName: localPlayerInfos[0].playerName,
                    Outcome: "Won",
                    Commander: "HiveLord",
                    Race: "Alchemist",
                    AllyId: 0,
                    Kills: 0,
                    Deaths: 2,
                    Assists: 0
                }, {
                    PlayerName: localPlayerInfos[1].playerName,
                    Outcome: "Lost",
                    Commander: "HiveLord",
                    Race: "Alchemist",
                    AllyId: 0,
                    Kills: 0,
                    Deaths: 2,
                    Assists: 0
                }, {
                    PlayerName: localPlayerInfos[2].playerName,
                    Outcome: "Won",
                    Commander: "HiveLord",
                    Race: "Alchemist",
                    AllyId: 1,
                    Kills: 4,
                    Deaths: 0,
                    Assists: 2
                }, {
                    PlayerName: localPlayerInfos[3].playerName,
                    Outcome: "Lost",
                    Commander: "HiveLord",
                    Race: "Alchemist",
                    AllyId: 0,
                    Kills: 0,
                    Deaths: 2,
                    Assists: 0
                }, {
                    PlayerName: localPlayerInfos[4].playerName,
                    Outcome: "Won",
                    Commander: "HiveLord",
                    Race: "Alchemist",
                    AllyId: 1,
                    Kills: 1,
                    Deaths: 0,
                    Assists: 5
                }, {
                    PlayerName: localPlayerInfos[5].playerName,
                    Outcome: "Lost",
                    Commander: "HiveLord",
                    Race: "Alchemist",
                    AllyId: 1,
                    Kills: 1,
                    Deaths: 0,
                    Assists: 4
                }]
        };
        let promise: Q.Promise<any> = Q.Promise((resolve, reject) => {
            request.post({
                uri: callingUrl,
                timeout: settings.timeoutForRequestPost,
                json: true,
                body: { playerStats: JSON.stringify(statsCall) }
            }, (error: any, response: any, body: any) => {
                assertResponseIsValid(error, response, body, callingUrl);
                resolve(body);
            });
        });

        return promise;
    }

    function createChooseAndLockCommanderPromise(playerInfo: I.PlayerInfo): Q.Promise<I.UpdateLobbyInfoResponse> {
        let promise: Q.Promise<I.UpdateLobbyInfoResponse> = Q.fcall(() => {
            return updateLobbyInfo(playerInfo, "chooseCommander", "HiveLord");
        }).then(() => {
            return updateLobbyInfo(playerInfo, "lockCommander");
        });

        return promise;
    }

    function getPlayerInventory(playerInfo: I.PlayerInfo): Q.Promise<I.GetPlayerInventoryResponse> {
        let callingUrl: string = settings.requestPaths.playerStats + '/getPlayerInventory';
        let playerStatsJSONBody = {
            playerName: playerInfo.playerName,
        };
        let promise: Q.Promise<any> = Q.Promise((resolve, reject) => {
            request.post({
                uri: callingUrl,
                timeout: settings.timeoutForRequestPost,
                form: {
                    playerStats: JSON.stringify(playerStatsJSONBody)
                }
            }, (error: any, response: any, body: any) => {
                assertResponseIsValid(error, response, body, callingUrl);
                let responseBody: any = JSON.parse(body);
                assert.ok(responseBody.inventoryIds != null);
                resolve(responseBody);
            });
        });

        return promise;
    }

    it("1 Player Flow", () => {
        let finalPromise: Q.Promise<{}> = Q.fcall(() => { }).then(() => {
            return getMOTD();
            //Delay 1 sec until lobby listings are cleared out on the lobby server
        }).delay(1000).then((res: I.GetMotdResponse) => {
            logger.info("Received Message of the Day.");
            playerInfos.push(createRandomPlayerInfo());
            return createAccount(playerInfos[0]);
        }).then((res: I.CreateAccountResponse) => {
            logger.info("Created account.");
            playerInfos[0].sessionToken = res.sessionToken;
            return makeChatServerSocket(playerInfos[0], "allChat")
        }).then((getChatUsersDeferred: Q.Deferred<{}>) => {
            logger.info("Player connected to chat server.");
            getChatUsers(playerInfos[0], "allChat");
            return getChatUsersDeferred.promise;
        }).then((getChatUsersResponse: any) => {
            assert.equal(getChatUsersResponse.commandType, GET_USERS);
            assert.ok(getChatUsersResponse.users);
            assert.equal(getChatUsersResponse.users.toString(), new Array<string>(playerInfos[0].playerName).toString()); // janky but works for our purposes
            logger.info("Player received chat users.");
            return listGames(playerInfos[0]);
        }).then((res: I.ListGamesResponse) => {
            assert.equal(res.length, 0);
            return hostGame(playerInfos[0], "GameName " + playerInfos[0].playerName, settings.defaultMapName, settings.defaultGameType);
        }).then((res: I.HostGameResponse) => {
            logger.info("Game lobby hosted.");
            playerInfos[0].gameGUID = res.gameGUID;
            playerInfos[0].connectionKey = res.connectionKey;
            playerInfos[0].lobbiesSocketPort = res.port;
            return makeLobbiesSocket(playerInfos[0]);
        }).then(() => {
            return listGames(playerInfos[0]);
        }).then(() => {
            return switchChatRoom(playerInfos[0], "GameName " + playerInfos[0].playerName);
        }).then((chatMessageDeferred: Q.Deferred<{}>) => {
            logger.info("Player switched chat rooms.");
            sendChatMessage(playerInfos[0], chatMessage);
            return chatMessageDeferred.promise;
        }).then((chatMessageResponse: any) => {
            assert.equal(chatMessageResponse.commandType, SEND_MESSAGE);
            assert.deepEqual(chatMessageResponse.message, playerInfos[0].playerName + ": " + chatMessage);
            logger.info("Player received chat message.");
            return getPlayerInventory(playerInfos[0]);
        }).then((playerInventory: I.GetPlayerInventoryResponse) => {
            should.deepEqual(playerInventory, initialPlayerInventory);
            logger.info("Got initial player inventory.");
            return updateLobbyInfo(playerInfos[0], "lockTeams");
        }).then(() => {
            return createChooseAndLockCommanderPromise(playerInfos[0]);
        }).then(() => {
            logger.info("Player chose and locked commander.");
            //Verify game started
            //Verify you get credentials
            return playerInfos[0].deferredInGamePromise.promise;
        }).then(() => {
            logger.info("Player is in game.");
            return getGameServerDataFor(playerInfos[0].gameGUID);
        }).then((jobID: string) => {
            return killJobManually(jobID);
        }).finally(() => {
            return deleteAccount(playerInfos[0]);
        });
        return finalPromise;
    });

    function assertStatsUpdatedCorrectly(getEndGameStats: Array<I.GetEndGamePlayersStatsResponse>) {
        for (let i = 0; i < NUMBER_PLAYERS_PER_GAME; ++i) {
            let endGamePlayerStats = getEndGameStats[i].endGamePlayerStats;

            should.deepEqual(2, endGamePlayerStats.currentLevel);
            should.deepEqual(["Rosie"], endGamePlayerStats.lastUnlockedItemIds);
            should.deepEqual(4, endGamePlayerStats.nextUnlockableLevel);
            should.deepEqual(1, endGamePlayerStats.gamesPlayed);
        }
    }

    it("6 Players Flow", () => {
        let finalPromise: Q.Promise<any> = Q.fcall(() => {
            return getMOTD();
            //Delay 1 sec until lobby listings are cleared out on the lobby server
        }).delay(1000).then(() => {
            logger.info("Received message of the day.");
            let createAccountsPromises: Q.Promise<void>[] = [];
            for (let i = 0; i < NUMBER_PLAYERS_PER_GAME; i++) {
                createAccountsPromises.push(createCreateAccountPromise(i));
            }
            return Q.all(createAccountsPromises);
        }).then(() => {
            logger.info("Created accounts.");
            let getPlayerInventoryPromises = [];
            for (let i = 0; i < NUMBER_PLAYERS_PER_GAME; i++) {
                getPlayerInventoryPromises.push(getPlayerInventory(playerInfos[i]));
            }
            return Q.all(getPlayerInventoryPromises);
        }).then((res: Array<any>) => {
            for (let i = 0; i < res.length; i++) {
                should.deepEqual(res[i], initialPlayerInventory);
            }
            logger.info("Got initial player inventories.");

            let makeChatServerSocketPromises = [];
            for (let i = 0; i < NUMBER_PLAYERS_PER_GAME; i++) {
                makeChatServerSocketPromises.push(makeChatServerSocket(playerInfos[i], "allChat"));
            }
            return Q.all(makeChatServerSocketPromises);
            //Wait 1 s because the promise does not correctly wait until all players are connected to chat
        }).delay(1000).then((getUsersDeferreds: Array<Q.Deferred<{}>>) => {
            logger.info("Players connected to chat server.");

            let getChatUsersPromises: Array<Q.Promise<any>> = [];
            for (let i = 0; i < NUMBER_PLAYERS_PER_GAME; i++) {
                getChatUsers(playerInfos[i], "allChat");
                getChatUsersPromises.push(getUsersDeferreds[i].promise);
            }
            return Q.all(getChatUsersPromises);
        }).then((getChatUserResponses: Array<any>) => {
            for (let i = 0; i < NUMBER_PLAYERS_PER_GAME; i++) {
                let getChatUsersResponse: any = getChatUserResponses[i];
                assert.equal(getChatUsersResponse.commandType, GET_USERS);
                assert.ok(getChatUsersResponse.users);
                assert.strictEqual(getChatUsersResponse.users.length, NUMBER_PLAYERS_PER_GAME);
            }
            return hostGameAndMakeSocket(playerInfos[0]);
        }).then(() => {
            logger.info("Game lobby hosted.");
            let joinGameAndMakeLobbiesSocketPromises: Q.Promise<Object>[] = [];
            for (let i = 1; i < NUMBER_PLAYERS_PER_GAME; i++) {
                joinGameAndMakeLobbiesSocketPromises.push(createJoinGameAndMakeLobbiesSocketPromise(playerInfos[i]));
            }
            return Q.all(joinGameAndMakeLobbiesSocketPromises);
        }).then(() => {
            logger.info("Players joined lobby.");
            let switchChatRoomPromises = [];
            for (let i = 0; i < NUMBER_PLAYERS_PER_GAME; i++) {
                switchChatRoomPromises.push(switchChatRoom(playerInfos[i], "GameName " + playerInfos[0].playerName));
            }
            return Q.all(switchChatRoomPromises);
        }).then((chatMessageDeferreds: Array<Q.Deferred<{}>>) => {
            logger.info("Players swithced chat rooms.");
            let deferredChatResponsePromises = [];
            for (let i = 0; i < NUMBER_PLAYERS_PER_GAME; i++) {
                deferredChatResponsePromises.push(chatMessageDeferreds[i].promise);
            }
            sendChatMessage(playerInfos[0], chatMessage);
            return Q.all(deferredChatResponsePromises);
        }).then((res: Array<any>) => {
            for (let i = 0; i < res.length; i++) {
                let chatMessageResponse = res[i];
                assert.equal(chatMessageResponse.commandType, SEND_MESSAGE);
                assert.deepEqual(chatMessageResponse.message, playerInfos[0].playerName + ": " + chatMessage);
            }
            logger.info("Players received chat message.");
            return updateLobbyInfo(playerInfos[0], "lockTeams");
        }).then(() => {
            let chooseAndLockCommanderPromises: Q.Promise<I.UpdateLobbyInfoResponse>[] = [];
            for (let i = 0; i < NUMBER_PLAYERS_PER_GAME; i++) {
                chooseAndLockCommanderPromises.push(createChooseAndLockCommanderPromise(playerInfos[i]));
            }
            return Q.all(chooseAndLockCommanderPromises);
        }).then(() => {
            logger.info("Players chose and locked commanders.");
            //Verify game started
            //Verify you get credentials
            let deferredInGamePromises = [];
            for (let i = 0; i < NUMBER_PLAYERS_PER_GAME; i++) {
                deferredInGamePromises.push(playerInfos[i].deferredInGamePromise.promise);
            }
            return Q.all(deferredInGamePromises);
        }).then(() => {
            logger.info("Players are in game.");
            return getGameServerDataFor(playerInfos[0].gameGUID);
        }).then((jobID: string) => {
            return killJobManually(jobID);
        }).then(() => {
            return processEndGameStats(playerInfos);
        }).then(() => {
            let getEndGameStatsPromises: Q.Promise<any>[] = [];
            for (let i = 0; i < NUMBER_PLAYERS_PER_GAME; i++) {
                getEndGameStatsPromises.push(createGetEndGameStatsPromise(playerInfos[i]));
            }
            return Q.all(getEndGameStatsPromises);
         }).then((getEndGameStats: Array<I.GetEndGamePlayersStatsResponse>) => {
             assertStatsUpdatedCorrectly(getEndGameStats);
        }).finally(() => {
            logger.info("Deleting local test accounts.");
            let deleteAccountPromises: Q.Promise<I.DeleteAccountResponse>[] = [];
            for (let i = 0; i < NUMBER_PLAYERS_PER_GAME; i++) {
                deleteAccountPromises.push(deleteAccount(playerInfos[i]));
            }
            return Q.all(deleteAccountPromises);
        });

        return finalPromise;
    });

    //it.only("processEndGameStats", () => {
    //    playerInfos = [
    //        createPlayerInfo(550468137),
    //        createPlayerInfo(872186823),
    //        createPlayerInfo(689771359),
    //        createPlayerInfo(909885974),
    //        createPlayerInfo(378060339),
    //        createPlayerInfo(645041704)  
    //    ]
    //    playerInfos[0].gameGUID = "thing";
    //    return processEndGameStats(playerInfos);
    //});

    afterEach(() => {
        for (let i = 0; i < playerInfos.length; i++) {
            try {
                if (playerInfos[i].lobbiesSocket) {
                    playerInfos[i].lobbiesSocket.destroy();
                }
                if (playerInfos[i].chatServerSocket) {
                    playerInfos[i].chatServerSocket.destroy();
                }
            } catch (e) {
                logger.error("Error destroying sockets in after each", e);
            }
        }
    });

    function editPlayerStats(playerInfo: I.PlayerInfo, newPlayerStats: any): Q.Promise<any> {
        let callingUrl: string = settings.requestPaths.playerStats + '/editPlayerStats';
        let ps: string = JSON.stringify(newPlayerStats);
        return Q.Promise((resolve: () => void, reject: () => void) => {
            request.post({
                uri: callingUrl,
                timeout: settings.timeoutForRequestPost,
                json: true,
                body: { playerStats: JSON.stringify(newPlayerStats) }
            }, (error: any, response: any, body: any) => {
                if (error) {
                    console.error("Received error from edit player stats call", error);
                    reject();
                    return;
                }

                resolve();
            });
        });
    }

    // Update with 5 data for players to test
    let leaderboardPlayerStatsData: Array<Object> = [
        {
            currentXP: 1,
            currentLevel: 1,
            wins: 1,
            losses: 0,
            playerInventory: [],
            multiplayerWins: 5,
            multiplayerWinPercentage: 0.6,
            multiplayerKdRatio: 0.1,
            multiplayerXp: 5000
        },
        {
            currentXP: 1,
            currentLevel: 1,
            wins: 1,
            losses: 0,
            playerInventory: [],
            multiplayerWins: 5,
            multiplayerWinPercentage: 0.7,
            multiplayerKdRatio: 0,
            multiplayerXp: 4000
        },
        {
            currentXP: 1,
            currentLevel: 1,
            wins: 1,
            losses: 0,
            playerInventory: [],
            multiplayerWins: 5,
            multiplayerWinPercentage: 0.8,
            multiplayerKdRatio: 10,
            multiplayerXp: 4000
        },
        {
            currentXP: 1,
            currentLevel: 1,
            wins: 1,
            losses: 0,
            playerInventory: [],
            multiplayerWins: 5,
            multiplayerWinPercentage: 0.9,
            multiplayerKdRatio: 3.1,
            multiplayerXp: 2000
        },
        {
            currentXP: 1,
            currentLevel: 1,
            wins: 1,
            losses: 0,
            playerInventory: [],
            multiplayerWins: 5,
            multiplayerWinPercentage: 1.0,
            multiplayerKdRatio: 2,
            multiplayerXp: 1000
        }
    ];

    function editPlayerStatsLeaderboardValues(playerInfo: I.PlayerInfo, i: number): Q.Promise<any> {
        let newPlayerStats: any = leaderboardPlayerStatsData[i];
        newPlayerStats.playerUniqueName = playerInfo.playerName.toUpperCase();
        return editPlayerStats(playerInfo, newPlayerStats);
    }

    function expectedLeaderboardComparator(lhs: I.LeaderboardEntry, rhs: I.LeaderboardEntry): number {
        if (lhs.rank < rhs.rank) return -1;
        if (rhs.rank < lhs.rank) return 1;
        if (lhs.playerName < rhs.playerName) return -1;
        return 1;
    }

    function generateExpectedLeaderboardResponse(): I.GetLeaderboardResponse {
        let expectedLeaderboardResponse: I.GetLeaderboardResponse = {
            multiplayerXp: [
                {
                    playerName: null,
                    rank: 1,
                    value: 5000
                },
                {
                    playerName: null,
                    rank: 2,
                    value: 4000
                },
                {
                    playerName: null,
                    rank: 2,
                    value: 4000
                },
                {
                    playerName: null,
                    rank: 4,
                    value: 2000
                },
                {
                    playerName: null,
                    rank: 5,
                    value: 1000
                }
            ],
            multiplayerWinPercent: [
                {
                    playerName: null,
                    rank: 5,
                    value: 0.6
                },
                {
                    playerName: null,
                    rank: 4,
                    value: 0.7
                },
                {
                    playerName: null,
                    rank: 3,
                    value: 0.8
                },
                {
                    playerName: null,
                    rank: 2,
                    value: 0.9
                },
                {
                    playerName: null,
                    rank: 1,
                    value: 1.0
                }
            ],
            multiplayerKD: [
                {
                    playerName: null,
                    rank: 4,
                    value: 0.1
                },
                {
                    playerName: null,
                    rank: 5,
                    value: 0
                },
                {
                    playerName: null,
                    rank: 1,
                    value: 10
                },
                {
                    playerName: null,
                    rank: 2,
                    value: 3.1
                },
                {
                    playerName: null,
                    rank: 3,
                    value: 2
                }
            ]
        }

        for (let i: number = 0; i < playerInfos.length; i++) {
            expectedLeaderboardResponse.multiplayerXp[i].playerName = playerInfos[i].playerName.toUpperCase();
            expectedLeaderboardResponse.multiplayerKD[i].playerName = playerInfos[i].playerName.toUpperCase();
            expectedLeaderboardResponse.multiplayerWinPercent[i].playerName = playerInfos[i].playerName.toUpperCase();
        }

        expectedLeaderboardResponse.multiplayerXp = expectedLeaderboardResponse.multiplayerXp.sort(expectedLeaderboardComparator);
        expectedLeaderboardResponse.multiplayerWinPercent = expectedLeaderboardResponse.multiplayerWinPercent.sort(expectedLeaderboardComparator);
        expectedLeaderboardResponse.multiplayerKD = expectedLeaderboardResponse.multiplayerKD.sort(expectedLeaderboardComparator);

        return expectedLeaderboardResponse;
    }

    function getLeaderboard(): Q.Promise<I.GetLeaderboardResponse> {
        let callingUrl: string = settings.requestPaths.playerStats + '/getLeaderboard';
        let promise: Q.Promise<any> = Q.Promise((resolve, reject) => {
            request.post({
                uri: callingUrl,
                timeout: settings.timeoutForRequestPost
            }, (error: any, response: any, body: any) => {
                try {
                    assertResponseIsValid(error, response, body, callingUrl);
                    let responseBody: any = JSON.parse(body);


                    let expectedLeaderboardResponse = generateExpectedLeaderboardResponse();

                    should.deepEqual(responseBody, expectedLeaderboardResponse);

                    resolve(responseBody);
                } catch (error) {
                    reject(error);
                }
            });
        });

        return promise;
    }

    it("Leaderboard Flow", () => {
        return Q.fcall(() => {
            let createAccountsPromises: Q.Promise<void>[] = [];
            for (let i = 0; i < leaderboardPlayerStatsData.length; i++) {
                createAccountsPromises.push(createCreateAccountPromise(i));
            }
            return Q.all(createAccountsPromises);
        }).then(() => {
            logger.info("Created accounts.");
            let editPlayerStatsPromises: Array<Q.Promise<any>> = new Array<Q.Promise<any>>();
            for (let i = 0; i < leaderboardPlayerStatsData.length; i++) {
                editPlayerStatsPromises.push(editPlayerStatsLeaderboardValues(playerInfos[i], i));
            }
            return Q.all(editPlayerStatsPromises);
        }).then(() => {
            logger.info("Editted accounts to match expected.");
            return getLeaderboard();
        }).finally(() => {
            logger.info("Deleting local test accounts.");
            let deleteAccountPromises: Q.Promise<I.DeleteAccountResponse>[] = [];
            for (let i = 0; i < playerInfos.length; i++) {
                deleteAccountPromises.push(deleteAccount(playerInfos[i]));
            }
            return Q.all(deleteAccountPromises);
        });
    });
});
