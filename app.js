const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

const app = express();

app.use(express.json());

let db = null;

const initializeDbAndServer = async () => {
    try {
        db = await open ({
            filename: dbPath,
            driver:sqlite3.Database,
        });
        app.listen(3001, () => {
            console.log("Server is Running at http://localhost:3001/")
        })
    }
    catch (e) {
        console.log(`DB Error: ${e.message}`);
        process.exit(1);
    }
};
initializeDbAndServer();

const convertPlayerDetailsDbObjectToResponseObject = (dbObject) =>{
    return {
        playerId : dbObject.player_id,
        playerName : dbObject.player_name,
    };
};

const convertMatchDetailsDbObjectToResponseObject = (dbObject) => {
    return {
        matchId : dbObject.match_id,
        match : dbObject.match,
        year : dbObject.year,
    };
};

const convertPlayerMatchDbObjectToResponseObject = (dbObject) => {
    return {
        playerMatchId : dbObject.player_match_id,
        playerId : dbObject.player_id,
        matchId : dbObject.match_id,
        score : dbObject.score,
        fours : dbObject.fours,
        sixes : dbObject.sixes,
    };
};


app.get("/players/", async (request, response) => {
    const getAllPlayersQuery = `SELECT * FROM player_details;`;
    const playersArray = await db.all(getAllPlayersQuery);
    response.send(
        playersArray.map((eachPlayer) =>
        convertPlayerDetailsDbObjectToResponseObject(eachPlayer))
    );
});

app.get("/players/:playerId/", async (request, response) => {
    const { playerId } = request.params;
    const getPlayerQuery = `SELECT * FROM player_details WHERE player_id = ${playerId};`;
    const player = await db.get(getPlayerQuery);
    response.send(convertPlayerDetailsDbObjectToResponseObject(player));
});

app.put("/players/:playerId/", async (request, response) => {
    const { playerId } = request.params;
    const { playerName } = request.body;
    const updatePlayerNameQuery = `UPDATE player_details 
    SET 
    player_name = '${playerName}'
    WHERE 
    player_id = ${playerId};`;
    await db.run(updatePlayerNameQuery);
    response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
    const { matchId } = request.params;
    const getMatchDetailsQuery = `SELECT * FROM match_details WHERE match_id = ${matchId};`;
    const match = await db.get(getMatchDetailsQuery);
    response.send(convertMatchDetailsDbObjectToResponseObject(match));
});

app.get("/players/:playerId/matches", async (request, response) => {
    const { playerId } = request.params;
    const getAllMatchesQuery = `SELECT * FROM  player_match_score 
    NATURAL JOIN match_details
    WHERE player_id = ${playerId};`;
    const playerMatchesArray = await db.all(getAllMatchesQuery);
    response.send(
        playerMatchesArray.map((eachMatch) =>
        convertMatchDetailsDbObjectToResponseObject(eachMatch))
    );
});

app.get("/matches/:matchId/players", async (request, response) => {
    const { matchId } = request.params;
    const getPlayersOfMatchQuery = `SELECT 
    * FROM 
    player_match_score  NATURAL JOIN 
    player_details
    WHERE 
    match_id = ${matchId};`;
    const playersOfMatchArray = await db.all(getPlayersOfMatchQuery);
    response.send(
        playersOfMatchArray.map((eachPlayer) =>
        convertPlayerDetailsDbObjectToResponseObject(eachPlayer))
    );
});

app.get("/players/:playerId/playerScores", async (request, response) => {
    const { playerId } = request.params;
    const getTotalScoresOfPlayer = `SELECT player_id AS playerId,
    player_name AS playerName, 
    SUM(score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes 
    FROM player_match_score 
    NATURAL JOIN player_details 
    WHERE 
    player_id = ${playerId};`;
    const playerStats = await db.get(getTotalScoresOfPlayer);
    response.send(playerStats);
});
module.exports = app;


