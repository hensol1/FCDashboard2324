let playerData = null;
let gpsData = null;

document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const playerId = urlParams.get('id');
    
    if (!playerId) {
        console.error("No player ID specified");
        document.body.innerHTML = '<h1>Player Not Found</h1>';
        return;
    }
    
    loadPlayerData(playerId);
    setupTabs();
});

function loadPlayerData(playerId) {
    Promise.all([
        fetch('Data_P90.json').then(response => response.json()),
        fetch('GPS.json').then(response => response.json())
    ]).then(([players, gps]) => {
        playerData = players.find(p => p.playerId === playerId);
        
        if (!playerData) {
            console.error("Player not found");
            document.body.innerHTML = '<h1>Player Not Found</h1>';
            return;
        }
        
        // Use all GPS data, not just for the current player
        gpsData = gps;
        
        console.log("Player Data:", playerData);
        console.log("GPS Data:", gpsData);
        
        // Calculate minutes ranking
        const minutesRanking = calculateMinutesRanking(players, playerData);
        
        // Calculate stat rankings
        const rankings = calculateRankings(players, playerData);
        
        displayPlayerInfo(minutesRanking);
        displayFootballData(rankings);
        displayFitnessData();
    }).catch(error => console.error('Error loading data:', error));
}


function getPlayerCategory(position) {
    const categories = {
        'Defenders': ['Centre Back', 'Right Back', 'Left Back', 'Central Defender'],
        'Midfielders': ['Central Midfielder', 'Defensive Midfielder', 'Centre Attacking Midfielder'],
        'Attackers': ['Left Winger', 'Right Winger', 'Centre Forward', 'Second Striker']
    };

    for (let [category, positions] of Object.entries(categories)) {
        if (positions.includes(position)) {
            return category;
        }
    }
    return 'Other';
}

function calculateMinutesRanking(allPlayers, currentPlayer) {
    const sortedPlayers = allPlayers.sort((a, b) => b.Min - a.Min);
    const playerRank = sortedPlayers.findIndex(player => player.playerId === currentPlayer.playerId) + 1;
    return playerRank;
}

function calculateRankings(allPlayers, currentPlayer) {
    const eligiblePlayers = allPlayers.filter(player => player.Min >= 500);
    const playerCategory = getPlayerCategory(currentPlayer.Position);
    const categoryPlayers = eligiblePlayers.filter(player => getPlayerCategory(player.Position) === playerCategory);

    const rankings = {};
    const categoryRankings = {};

    const statsToRank = ["Touches", "PsAtt", "Pass%", "Ps%InA3rd", "Chance", "Ast", "xA", "Goal", "ExpG", "ShotExcBlk", "Shot", "SOG", "OnTarget%", "Tackle%", "Duel%", "Aerial%", "Recovery"];
    const higherIsBetterStats = ["Pass%", "Ps%InA3rd", "OnTarget%", "Tackle%", "Duel%", "Aerial%"];

    statsToRank.forEach(stat => {
        let sortedPlayers, sortedCategoryPlayers;
        if (higherIsBetterStats.includes(stat)) {
            sortedPlayers = eligiblePlayers.sort((a, b) => parseFloat(b[stat]) - parseFloat(a[stat]));
            sortedCategoryPlayers = categoryPlayers.sort((a, b) => parseFloat(b[stat]) - parseFloat(a[stat]));
        } else {
            sortedPlayers = eligiblePlayers.sort((a, b) => b[stat] - a[stat]);
            sortedCategoryPlayers = categoryPlayers.sort((a, b) => b[stat] - a[stat]);
        }
        
        const playerRank = sortedPlayers.findIndex(player => player.playerId === currentPlayer.playerId) + 1;
        const categoryRank = sortedCategoryPlayers.findIndex(player => player.playerId === currentPlayer.playerId) + 1;
        
        rankings[stat] = playerRank;
        categoryRankings[stat] = categoryRank;
    });

    return { overall: rankings, category: categoryRankings, playerCategory };
}

function displayPlayerInfo(minutesRanking) {
    document.getElementById('player-name').textContent = playerData.playerFullName;
    document.getElementById('player-image').src = `player-images/${playerData.playerFullName.replace(/[^a-zA-Z0-9]/g, '_')}.webp`;
    document.getElementById('player-info').innerHTML = `
        Age: ${playerData.Age}<br>
        Position: ${playerData.Position}<br>
    `;
    document.getElementById('team-name').textContent = playerData.teamName;
    document.getElementById('team-logo').src = `team-logos/${playerData.teamName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.webp`;
    
    const totalMinutes = playerData.Min;
    document.getElementById('total-minutes').textContent = `Total Minutes: ${totalMinutes}`;
    document.getElementById('minutes-ranking').textContent = `Minutes Ranking: ${minutesRanking}`;
}

function displayFootballData(rankings) {
    const footballDataContainer = document.getElementById('football-data');
    const statsToShow = ["Touches", "PsAtt", "Pass%", "Ps%InA3rd", "Chance", "Ast", "xA", "Goal", "ExpG", "ShotExcBlk", "Shot", "SOG", "OnTarget%", "Tackle%", "Duel%", "Aerial%", "Recovery"];
    const higherIsBetterStats = ["Pass%", "Ps%InA3rd", "OnTarget%", "Tackle%", "Duel%", "Aerial%"];

    function createTable(title, rankingData) {
        let html = `<h3>${title}</h3>`;
        html += '<table class="football-stats-table"><tr><th></th>';
        statsToShow.forEach(stat => {
            const arrow = higherIsBetterStats.includes(stat) ? '▲' : '▼';
            html += `<th>${stat} ${arrow}</th>`;
        });
        html += '</tr><tr><td>Value</td>';
        statsToShow.forEach(stat => {
            html += `<td>${playerData[stat]}</td>`;
        });
        html += '</tr><tr><td>Rank</td>';
        statsToShow.forEach(stat => {
            html += `<td>${rankingData[stat]}</td>`;
        });
        html += '</tr></table>';
        return html;
    }

    let html = createTable('Overall Rankings', rankings.overall);
    html += createTable(`${rankings.playerCategory} Rankings`, rankings.category);

    footballDataContainer.innerHTML = html;
}

function displayFitnessData() {
    const fitnessDataContainer = document.getElementById('fitness-data');
    
    if (gpsData.length === 0) {
        fitnessDataContainer.innerHTML = '<p>No fitness data available for this player.</p>';
        return;
    }
    
    const allPlayerAverages = calculateAllPlayerAverages(gpsData);
    const playerAverages = allPlayerAverages[playerData.Player] || allPlayerAverages[playerData.playerFullName];
    
    if (!playerAverages) {
        fitnessDataContainer.innerHTML = '<p>Insufficient fitness data for this player (less than 10 matches or 500 minutes played).</p>';
        return;
    }
    
    const playerRankings = calculatePlayerRankings(allPlayerAverages, playerData.Player);
    
    // Find the match with the highest total distance
    const bestMatch = gpsData
        .filter(match => match.Player === playerData.Player || match.Player === playerData.playerFullName)
        .reduce((best, current) => current.TotalDistance > best.TotalDistance ? current : best);

    let html = `
        <h3>Match Record</h3>
        <table class="fitness-stats-table">
            <tr>
                <th>Category</th>
                <th>Value</th>
                <th>Matchday</th>
                <th>Opponent</th>
            </tr>
            <tr>
                <td>Total Distance</td>
                <td>${bestMatch.TotalDistance.toFixed(2)} km</td>
                <td>${bestMatch.Matchday}</td>
                <td>${bestMatch.Opponent}</td>
            </tr>
            <tr>
                <td>HSR Distance</td>
                <td>${bestMatch.HsrDistance.toFixed(2)} km</td>
                <td>${bestMatch.Matchday}</td>
                <td>${bestMatch.Opponent}</td>
            </tr>
            <tr>
                <td>Sprint Distance</td>
                <td>${bestMatch.SprintDistance.toFixed(2)} km</td>
                <td>${bestMatch.Matchday}</td>
                <td>${bestMatch.Opponent}</td>
            </tr>
        </table>
        
        <h3>Player Average</h3>
        <table class="fitness-stats-table">
            <tr>
                <th>Category</th>
                <th>Value</th>
                <th>Rank</th>
            </tr>
            <tr>
                <td>Total Distance</td>
                <td>${playerAverages.TotalDistance.toFixed(2)} m</td>
                <td>${playerRankings.TotalDistance}</td>
            </tr>
            <tr>
                <td>HSR Distance</td>
                <td>${playerAverages.HsrDistance.toFixed(2)} m</td>
                <td>${playerRankings.HsrDistance}</td>
            </tr>
            <tr>
                <td>Sprint Distance</td>
                <td>${playerAverages.SprintDistance.toFixed(2)} m</td>
                <td>${playerRankings.SprintDistance}</td>
            </tr>
        </table>
    `;
    
    fitnessDataContainer.innerHTML = html;
}

function calculatePlayerAverages(playerName, data) {
    const playerMatches = data.filter(match => match.Player === playerName || match.Player === playerData.Player);
    
    if (playerMatches.length < 10) {
        return null; // Not enough matches
    }

    const totalMinutes = playerMatches.reduce((sum, match) => sum + match.Minutes, 0);
    if (totalMinutes < 500) {
        return null; // Not enough minutes
    }

    const averages = {
        TotalDistance: 0,
        HsrDistance: 0,
        SprintDistance: 0,
        MatchCount: playerMatches.length
    };

    playerMatches.forEach(match => {
        averages.TotalDistance += match.TotalDistance;
        averages.HsrDistance += match.HsrDistance;
        averages.SprintDistance += match.SprintDistance;
    });

    averages.TotalDistance /= averages.MatchCount;
    averages.HsrDistance /= averages.MatchCount;
    averages.SprintDistance /= averages.MatchCount;

    return averages;
}

function calculateAllPlayerAverages(data) {
    const playerAverages = {};
    
    // Group data by player
    data.forEach(entry => {
        if (!playerAverages[entry.Player]) {
            playerAverages[entry.Player] = {
                TotalDistance: 0,
                HsrDistance: 0,
                SprintDistance: 0,
                TotalMinutes: 0,
                MatchCount: 0
            };
        }
        playerAverages[entry.Player].TotalDistance += entry.TotalDistance;
        playerAverages[entry.Player].HsrDistance += entry.HsrDistance;
        playerAverages[entry.Player].SprintDistance += entry.SprintDistance;
        playerAverages[entry.Player].TotalMinutes += entry.Minutes;
        playerAverages[entry.Player].MatchCount++;
    });

    // Calculate averages for each player
    Object.keys(playerAverages).forEach(player => {
        const avg = playerAverages[player];
        if (avg.MatchCount >= 10 && avg.TotalMinutes >= 500) {
            avg.TotalDistance = avg.TotalDistance / avg.MatchCount;
            avg.HsrDistance = avg.HsrDistance / avg.MatchCount;
            avg.SprintDistance = avg.SprintDistance / avg.MatchCount;
        } else {
            delete playerAverages[player];
        }
    });

    console.log("All Player Averages:", playerAverages);
    return playerAverages;
}

function calculateLeagueAverages(allPlayerAverages) {
    const leagueAverages = {
        TotalDistance: 0,
        HsrDistance: 0,
        SprintDistance: 0,
        playerCount: 0
    };

    Object.values(allPlayerAverages).forEach(player => {
        leagueAverages.TotalDistance += player.TotalDistance;
        leagueAverages.HsrDistance += player.HsrDistance;
        leagueAverages.SprintDistance += player.SprintDistance;
        leagueAverages.playerCount++;
    });

    leagueAverages.TotalDistance /= leagueAverages.playerCount;
    leagueAverages.HsrDistance /= leagueAverages.playerCount;
    leagueAverages.SprintDistance /= leagueAverages.playerCount;

    return leagueAverages;
}

function calculatePlayerRankings(allPlayerAverages, playerName) {
    const categories = ['TotalDistance', 'HsrDistance', 'SprintDistance'];
    const rankings = {};

    categories.forEach(category => {
        const sortedPlayers = Object.entries(allPlayerAverages)
            .sort((a, b) => b[1][category] - a[1][category]);
        
        const playerRank = sortedPlayers.findIndex(([name]) => name === playerName) + 1;

        rankings[category] = playerRank > 0 ? playerRank : 'N/A';
    });

    console.log("Calculated Rankings:", rankings);
    return rankings;
}

function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            button.classList.add('active');
            document.getElementById(tabName).classList.add('active');
        });
    });
}