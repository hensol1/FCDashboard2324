let gpsData = [];
let fixturesData = {};
let playerData = [];
let playerNameMapping = {};

function createPlayerNameMapping() {
    playerNameMapping = {}; // Reset the mapping
    playerData.forEach(player => {
        playerNameMapping[player.Player] = player.playerFullName;
    });
    console.log('Player name mapping created:', playerNameMapping);
}


const shortNameMapping = {
    'M. Tel Aviv': 'Maccabi Tel Aviv',
    'H. Tel Aviv': 'Hapoel Tel Aviv',
    'M. Haifa': 'Maccabi Haifa',
    'H. Beer Sheva': 'Hapoel Beer Sheva',
    'B. Jerusalem': 'Beitar Jerusalem',
    'M. Petah Tikva': 'Maccabi Petah Tikva',
    'H. Jerusalem': 'Hapoel Jerusalem',
    'M. Bnei Reineh': 'Maccabi Bnei Raina',
    'H. Petah Tikva': 'Hapoel Petah Tikva',
    'FC Ashdod': 'Ashdod',
    // Add more mappings as needed
};

const logoMap = {
    "Maccabi Tel Aviv": "maccabi_tel_aviv.webp",
    "Hapoel Tel Aviv": "hapoel_tel_aviv.webp",
    "Beitar Jerusalem": "beitar_jerusalem.webp",
    "Maccabi Haifa": "maccabi_haifa.webp",
    "Bnei Sakhnin": "bnei_sakhnin.webp",
    "Hapoel Hadera": "hapoel_hadera.webp",
    "Maccabi Petah Tikva": "maccabi_petah_tikva.webp",
    "Hapoel Beer Sheva": "hapoel_be_er_sheva.webp",
    "Maccabi Netanya": "maccabi_netanya.webp",
    "Hapoel Jerusalem": "hapoel_jerusalem.webp",
    "Maccabi Bnei Raina": "maccabi_bnei_raina.webp",
    "Ashdod": "ashdod.webp",
    "Hapoel Haifa": "hapoel_haifa.webp",
    "Hapoel Petah Tikva": "hapoel_petah_tikva.webp",
    // Add more entries as needed
};

function cleanTeamName(teamName) {
    if (!teamName) return ''; // Return empty string if teamName is undefined or null
    // Remove standings and extra spaces
    return teamName.replace(/^\(\d+\.\)\s*/, '').replace(/\s*\(\d+\.\)$/, '').trim();
}

document.addEventListener('DOMContentLoaded', function() {
    updateStandings();
    loadGPSData();
    loadFixtures();

    // Add event listener for season change
    document.getElementById('season').addEventListener('change', updateStandings);
});

function loadFixtures() {
    fetch('fixtures.json')
        .then(response => response.json())
        .then(data => {
            fixturesData = data;
            populateMatchdayDropdown(data);
            displayFixtures(Object.keys(data)[0]); // Display first matchday by default
        })
        .catch(error => console.error('Error loading fixtures:', error));
}

function populateMatchdayDropdown(data) {
    const dropdown = document.getElementById('matchday-select');
    dropdown.innerHTML = '';
    Object.keys(data).forEach(matchday => {
        const option = document.createElement('option');
        option.value = matchday;
        option.textContent = matchday;
        dropdown.appendChild(option);
    });
    
    // Add event listener for dropdown change
    dropdown.addEventListener('change', (event) => {
        displayFixtures(event.target.value);
    });
}

async function displayFixtures(selectedMatchday) {
    const fixturesContent = document.getElementById('fixtures-content');
    const fixtures = fixturesData[selectedMatchday];
    
    if (!fixtures) {
        fixturesContent.innerHTML = '<p>No fixtures available for this matchday.</p>';
        return;
    }

    let html = `<h3>${selectedMatchday}</h3>`;
    html += '<table><tr><th>Home Team</th><th>Score</th><th>Away Team</th></tr>';
    
    for (const fixture of fixtures) {
        const homeTeamClean = cleanTeamName(fixture.home_team);
        const awayTeamClean = cleanTeamName(fixture.away_team);
        
        const homeTeam = shortNameMapping[homeTeamClean] || homeTeamClean;
        const awayTeam = shortNameMapping[awayTeamClean] || awayTeamClean;
        
        const homeLogoUrl = await getTeamLogoUrl(homeTeam);
        const awayLogoUrl = await getTeamLogoUrl(awayTeam);
        
html += `<tr>
    <td class="team-cell">
        <a href="${getTeamPageUrl(homeTeam)}">
            <img src="${homeLogoUrl}" alt="${homeTeam} logo" class="team-logo-small">
            <span class="team-name">${fixture.home_team}</span>
        </a>
    </td>
    <td>${fixture.score}</td>
    <td class="team-cell">
        <a href="${getTeamPageUrl(awayTeam)}">
            <img src="${awayLogoUrl}" alt="${awayTeam} logo" class="team-logo-small">
            <span class="team-name">${fixture.away_team}</span>
        </a>
    </td>
</tr>`;

    }
    
    html += '</table>';
    fixturesContent.innerHTML = html;
}

function loadGPSData() {
    Promise.all([
        fetch('GPS.json').then(response => response.json()),
        fetch('Data_P90.json').then(response => response.json())
    ])
        .then(([gpsJson, playerJson]) => {
            gpsData = gpsJson;
            playerData = playerJson;
            createPlayerNameMapping(); // Call this here
            console.log('GPS Data loaded:', gpsData);
            console.log('Player Data loaded:', playerData);
            displayTopPlayers();
        })
        .catch(error => console.error('Error loading data:', error));
}

function calculatePlayerAverages(data) {
    const playerAverages = {};
    data.forEach(entry => {
        if (!playerAverages[entry.Player]) {
            playerAverages[entry.Player] = {
                Team: entry.Team,
                TotalDistance: 0,
                HsrDistance: 0,
                SprintDistance: 0,
                MatchCount: 0
            };
        }
        playerAverages[entry.Player].TotalDistance += entry.TotalDistance;
        playerAverages[entry.Player].HsrDistance += entry.HsrDistance;
        playerAverages[entry.Player].SprintDistance += entry.SprintDistance;
        playerAverages[entry.Player].MatchCount++;
    });

    Object.keys(playerAverages).forEach(player => {
        const avg = playerAverages[player];
        if (avg.MatchCount >= 10) {  // Only calculate average for players with 10 or more matches
            avg.TotalDistance = avg.TotalDistance / avg.MatchCount;
            avg.HsrDistance = avg.HsrDistance / avg.MatchCount;
            avg.SprintDistance = avg.SprintDistance / avg.MatchCount;
        } else {
            delete playerAverages[player];  // Remove players with less than 10 matches
        }
    });

    return playerAverages;
}

function calculateTeamStats(data) {
    const teamStats = {};
    data.forEach(entry => {
        const key = `${entry.Team}-${entry.Matchday}`;
        if (!teamStats[key]) {
            teamStats[key] = {
                Team: entry.Team,
                Matchday: entry.Matchday,
                Opponent: entry.Opponent,
                TotalDistance: 0,
                HsrDistance: 0,
                SprintDistance: 0,
                PlayerCount: 0
            };
        }
        teamStats[key].TotalDistance += entry.TotalDistance;
        teamStats[key].HsrDistance += entry.HsrDistance;
        teamStats[key].SprintDistance += entry.SprintDistance;
        teamStats[key].PlayerCount++;
    });
    return Object.values(teamStats);
}

function calculateTeamAverages(teamStats) {
    const teamAverages = {};
    teamStats.forEach(stat => {
        if (!stat.Team) return; // Skip if Team is undefined
        if (!teamAverages[stat.Team]) {
            teamAverages[stat.Team] = {
                TotalDistance: 0,
                HsrDistance: 0,
                SprintDistance: 0,
                MatchCount: 0
            };
        }
        teamAverages[stat.Team].TotalDistance += stat.TotalDistance || 0;
        teamAverages[stat.Team].HsrDistance += stat.HsrDistance || 0;
        teamAverages[stat.Team].SprintDistance += stat.SprintDistance || 0;
        teamAverages[stat.Team].MatchCount++;
    });

    Object.keys(teamAverages).forEach(team => {
        const avg = teamAverages[team];
        avg.TotalDistance = avg.TotalDistance / avg.MatchCount;
        avg.HsrDistance = avg.HsrDistance / avg.MatchCount;
        avg.SprintDistance = avg.SprintDistance / avg.MatchCount;
    });

    return teamAverages;
}

function displayTopPlayers() {
    console.log('displayTopPlayers function called');
    const categories = ['TotalDistance', 'HsrDistance', 'SprintDistance'];
    const categoryNames = {
        'TotalDistance': 'Total Distance',
        'HsrDistance': 'HSR Distance',
        'SprintDistance': 'Sprint Distance'
    };

    console.log('GPS Data:', gpsData);
    const playerAverages = calculatePlayerAverages(gpsData);

    console.log('Player Averages:', playerAverages);

    for (const category of categories) {
        console.log(`Processing category: ${category}`);
        displayCategoryData(category, categoryNames[category], gpsData, playerAverages);
    }

    // Add event listeners for tab buttons
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            console.log('Tab button clicked:', button.getAttribute('data-tab'));
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            button.classList.add('active');
            document.getElementById(button.getAttribute('data-tab')).classList.add('active');
        });
    });
}
function displayCategoryData(category, categoryName, gpsData, playerAverages) {
    console.log(`displayCategoryData called for ${category}`);
    const playerMatchRecord = gpsData
        .sort((a, b) => b[category] - a[category])
        .slice(0, 5);

    const playerBestAvg = Object.entries(playerAverages)
        .sort((a, b) => b[1][category] - a[1][category])
        .slice(0, 5);

    console.log(`${category} - Player Match Record:`, playerMatchRecord);
    console.log(`${category} - Player Best Avg (10+ matches):`, playerBestAvg);

    const tabContents = {
        'player-match-record': createTable(playerMatchRecord, category, categoryName, 'Player'),
        'player-best-avg': createTable(playerBestAvg, category, categoryName, 'Player', true)
    };

    Object.entries(tabContents).forEach(([tabId, content]) => {
        console.log(`Updating tab content for ${tabId}`);
        const tab = document.getElementById(tabId);
        if (!tab) {
            console.error(`Tab element not found: ${tabId}`);
            return;
        }
        const categoryDiv = tab.querySelector(`#${category.toLowerCase().replace('distance', '-distance')}`) || 
                            document.createElement('div');
        categoryDiv.id = `${category.toLowerCase().replace('distance', '-distance')}`;
        categoryDiv.innerHTML = content;
        if (!tab.contains(categoryDiv)) {
            tab.appendChild(categoryDiv);
        }
    });
}
function createTable(data, category, categoryName, entityType, isAverage = false) {
    console.log(`createTable called for ${category}, ${entityType}, isAverage: ${isAverage}`);
    try {
        let html = `<h3>${categoryName}</h3><table class="compact-table">`;
        html += '<tr>';
        html += `<th>${entityType}</th>`;
        if (entityType === 'Player') {
            html += '<th>Team</th>';
        }
        html += `<th>${categoryName}</th>`;
        if (!isAverage) {
            html += '<th>Matchday</th>';
        }
        if ((entityType === 'Player' && !isAverage) || (entityType === 'Team' && !isAverage)) {
            html += '<th>Opponent</th>';
        }
        html += '</tr>';

        for (const item of data) {
            const entity = isAverage ? (item[0] || 'Unknown') : (item[entityType] || 'Unknown');
            const team = isAverage ? (item[1] && item[1].Team ? item[1].Team : 'Unknown') : (item.Team || 'Unknown');
            const value = isAverage ? (item[1] && item[1][category] ? item[1][category].toFixed(2) : 'N/A') : (item[category] || 'N/A');
            const opponent = item.Opponent || 'N/A';
            const matchCount = isAverage && entityType === 'Player' ? item[1].MatchCount : null;

            html += '<tr>';
            html += `<td class="${entityType.toLowerCase()}-cell">`;
            html += `<div class="${entityType.toLowerCase()}-info">`;
            
            if (entityType === 'Player') {
                const playerFullName = playerNameMapping[entity] || entity;
                    html += `<img src="player-images/${playerFullName.replace(/ /g, '_')}.webp" ` +
            `alt="${playerFullName}" ` +
            `class="player-image" ` +
            `onerror="this.onerror=null; this.src='player-images/default.webp';">`;
    html += `<span class="${entityType.toLowerCase()}-name">${entity}</span>`;

            } else {
                const teamPageUrl = getTeamPageUrl(entity);
                html += `<a href="${teamPageUrl}">`;
                html += `<img src="${getTeamLogoUrl(entity)}" alt="${entity} logo" class="team-logo-small">`;
                html += `<span class="team-name">${entity}</span>`;
            }
            html += '</div>';
            html += '</td>';

            if (entityType === 'Player') {
                html += '<td class="team-cell">';
                const teamPageUrl = getTeamPageUrl(team);
                html += `<a href="${teamPageUrl}">`;
                html += `<img src="${getTeamLogoUrl(team)}" alt="${team} logo" class="team-logo-small">`;
                html += `<span class="team-name">${team}</span>`;
                html += '</td>';
            }

            html += `<td>${value}${matchCount ? ` (${matchCount} matches)` : ''}</td>`;

            if (!isAverage) {
                html += `<td>${item.Matchday || 'N/A'}</td>`;
            }

            if ((entityType === 'Player' && !isAverage) || (entityType === 'Team' && !isAverage)) {
                html += `<td>${opponent}</td>`;
            }

            html += '</tr>';
        }

        html += '</table>';
        console.log('Generated HTML:', html);
        return html;
    } catch (error) {
        console.error('Error in createTable:', error);
        return `<p>Error generating table: ${error.message}</p>`;
    }
}

async function updateStandings() {
    const season = document.getElementById('season').value;
    let filename;
    if (season === "24_25") {
        filename = "24_25.json";
    } else if (season === "23_24") {
        filename = "2324opta.json";
    } else {
        console.error("Unsupported season selected");
        return;
    }

    try {
        const response = await fetch(filename);
        const data = await response.json();
        let tableData;
        if (season === "24_25") {
            tableData = data[0].clubs;
        } else {
            tableData = data;
        }

        if (tableData && Array.isArray(tableData)) {
            tableData.sort((a, b) => {
                const pointsA = season === "24_25" ? parseInt(a.Pts) : a.P;
                const pointsB = season === "24_25" ? parseInt(b.Pts) : b.P;
                return pointsB - pointsA;
            });

            let tableHtml = '<table class="compact-table"><tr><th>Pos</th><th>Club</th><th>M</th><th>W</th><th>D</th><th>L</th><th>Goals</th><th>+/-</th><th>Pts</th></tr>';
            for (let index = 0; index < tableData.length; index++) {
                const team = tableData[index];
                const teamName = season === "24_25" ? team.Club_0 : team.Team;
                const logoUrl = await getTeamLogoUrl(teamName);
                const teamPageUrl = getTeamPageUrl(teamName);

                
                const highlightClass = index === 0 ? "highlight-green" : index >= tableData.length - 2 ? "highlight-red" : "";
tableHtml += `<tr class="${highlightClass}">
    <td>${index + 1}</td>
    <td class="team-cell">
        <a href="${teamPageUrl}">
            <img src="${logoUrl}" alt="${teamName} logo" class="team-logo-small">
            <span class="team-name">${teamName}</span>
        </a>
                    </td>
                    <td>${season === "24_25" ? team.Matches : team.GM}</td>
                    <td>${team.W}</td>
                    <td>${team.D}</td>
                    <td>${team.L}</td>
                    <td>${season === "24_25" ? team.Goals : team.GF + ':' + team.GA}</td>
                    <td>${season === "24_25" ? team['+/-'] : team.GD}</td>
                    <td>${season === "24_25" ? team.Pts : team.P}</td>
                </tr>`;
            }
            tableHtml += '</table>';
            document.getElementById('content1').innerHTML = tableHtml;
        } else {
            console.error('Unexpected JSON structure');
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('content1').innerHTML = 'Error loading data';
    }
}


function getTeamLogoUrl(team) {
    if (!team) return 'team-logos/default_logo.webp'; // Return default logo if team is undefined

    const cleanedTeam = cleanTeamName(team);
    // Use the full name if available, otherwise use the original name
    const fullTeamName = shortNameMapping[cleanedTeam] || cleanedTeam;

    const logoFileName = fullTeamName.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.webp';
    const logoUrl = `team-logos/${logoFileName}`;
    
    // Remove the Promise and just return the URL
    return logoUrl;
}

function getTeamPageUrl(teamName) {
    // Encode the entire team name without modifying it
    return `team-roster.html?team=${encodeURIComponent(teamName)}`;
}

function prepareFullRankingsData() {
    const playerAverages = calculatePlayerAverages(gpsData);
    return playerAverages;
}
