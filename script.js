let gpsData = [];
let fixturesData = {};
let playerData = [];

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
                <img src="${homeLogoUrl}" alt="${homeTeam} logo" class="team-logo-small">
                <span class="team-name">${fixture.home_team}</span>
            </td>
            <td>${fixture.score}</td>
            <td class="team-cell">
                <img src="${awayLogoUrl}" alt="${awayTeam} logo" class="team-logo-small">
                <span class="team-name">${fixture.away_team}</span>
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
            displayTopPlayers();
        })
        .catch(error => console.error('Error loading data:', error));
}

async function displayTopPlayers() {
    const categories = ['TotalDistance', 'HsrDistance', 'SprintDistance'];
    const categoryNames = {
        'TotalDistance': 'Total Distance',
        'HsrDistance': 'HSR Distance',
        'SprintDistance': 'Sprint Distance'
    };

    for (const category of categories) {
        const topPlayers = gpsData
            .sort((a, b) => b[category] - a[category])
            .slice(0, 5);

        let html = `<h3>${categoryNames[category]}</h3><table>
            <tr>
                <th>Player</th>
                <th>Team</th>
                <th>${categoryNames[category]}</th>
                <th>Matchday</th>
                <th>Opponent</th>
            </tr>`;
        
        for (const player of topPlayers) {
            const playerInfo = playerData.find(p => 
                (p.Player === player.Player && p.teamName === player.Team) || 
                (p.playerFullName === player.Player && p.teamName === player.Team) ||
                (p.firstName && p.lastName && 
                 player.Player.includes(p.firstName) && 
                 player.Player.includes(p.lastName) && 
                 p.teamName === player.Team)
            );
            
            const playerFullName = playerInfo ? playerInfo.playerFullName : player.Player;
            const playerImageFileName = playerFullName.replace(/ /g, '_') + '.webp';
            const teamLogoUrl = await getTeamLogoUrl(player.Team);
            
        html += `<tr>
            <td class="player-cell">
                <div class="player-info">
                    <img src="player-images/${playerImageFileName}" 
                         alt="${playerFullName}" 
                         class="player-image"
                         onerror="this.onerror=null; this.src='player-images/default.webp';">
                    <span class="player-name">${playerFullName}</span>
                </div>
            </td>
            <td class="team-cell">
                <img src="${teamLogoUrl}" alt="${player.Team} logo" class="team-logo-small">
                <span class="team-name">${player.Team}</span>
            </td>
            <td>${player[category]}</td>
            <td>${player.Matchday}</td>
            <td>${player.Opponent}</td>
        </tr>`;
    }

        html += '</table>';
        document.getElementById(category.toLowerCase().replace('distance', '-distance')).innerHTML = html;
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

            let tableHtml = '<table><tr><th>Position</th><th>Club</th><th>Matches</th><th>W</th><th>D</th><th>L</th><th>Goals</th><th>+/-</th><th>Pts</th></tr>';
    for (let index = 0; index < tableData.length; index++) {
        const team = tableData[index];
        const teamName = season === "24_25" ? team.Club_0 : team.Team;
        const logoUrl = await getTeamLogoUrl(teamName);
        
        const highlightClass = index === 0 ? "highlight-green" : index >= tableData.length - 2 ? "highlight-red" : "";
        tableHtml += `<tr class="${highlightClass}">
            <td>${index + 1}</td>
            <td class="team-cell">
                <img src="${logoUrl}" alt="${teamName} logo" class="team-logo-small">
                <span class="team-name">${teamName}</span>
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
    const cleanedTeam = cleanTeamName(team);
    // Use the full name if available, otherwise use the original name
    const fullTeamName = shortNameMapping[cleanedTeam] || cleanedTeam;

    const logoFileName = fullTeamName.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.webp';
    const logoUrl = `team-logos/${logoFileName}`;
    
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(logoUrl);
        img.onerror = () => {
            // Try to find a flexible match
            const flexibleMatch = Object.entries(logoMap).find(([key, value]) => 
                fullTeamName.toLowerCase().includes(key.toLowerCase()) || 
                key.toLowerCase().includes(fullTeamName.toLowerCase())
            );
            if (flexibleMatch) {
                resolve(`team-logos/${flexibleMatch[1]}`);
            } else {
                console.log(`No logo found for team: ${fullTeamName}`);
                resolve('team-logos/default_logo.webp');
            }
        };
        img.src = logoUrl;
    });
}
// Make sure to define logoMap at the top of your file or import it from teams.js
