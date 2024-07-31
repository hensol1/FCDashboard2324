let gpsData = [];
let playerData = [];
let playerNameMapping = {};

function createPlayerNameMapping() {
    playerNameMapping = {};
    playerData.forEach(player => {
        playerNameMapping[player.Player] = player.playerFullName;
    });
}

function loadData() {
    Promise.all([
        fetch('GPS.json').then(response => response.json()),
        fetch('Data_P90.json').then(response => response.json())
    ])
    .then(([gpsJson, playerJson]) => {
        gpsData = gpsJson;
        playerData = playerJson;
        createPlayerNameMapping();
        displayFullRankings();
        setupTabs();
    })
    .catch(error => console.error('Error loading data:', error));
}

function calculatePlayerAverages(data) {
    const playerAverages = {};
    data.forEach(entry => {
        if (!playerAverages[entry.Player]) {
            playerAverages[entry.Player] = {
                Team: entry.Team,
                Position: entry.Position,
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

    return playerAverages;
}

function displayFullRankings() {
    const playerAverages = calculatePlayerAverages(gpsData);
    const categories = ['TotalDistance', 'HsrDistance', 'SprintDistance'];
    const categoryNames = {
        'TotalDistance': 'Total Distance',
        'HsrDistance': 'HSR Distance',
        'SprintDistance': 'Sprint Distance'
    };

    categories.forEach(category => {
        const sortedPlayers = Object.entries(playerAverages)
            .sort((a, b) => b[1][category] - a[1][category]);

        let html = '<table class="compact-table">';
        html += '<tr><th>Rank</th><th>Player</th><th>Team</th><th>Position</th><th>Average</th><th>Matches</th></tr>';

        sortedPlayers.forEach((player, index) => {
            const [playerName, stats] = player;
            const fullName = playerNameMapping[playerName] || playerName;
            html += `<tr>
                <td>${index + 1}</td>
                <td class="player-cell">
                    <img src="player-images/${fullName.replace(/ /g, '_')}.webp" alt="${fullName}" class="player-image" onerror="this.onerror=null; this.src='player-images/default.webp';">
                    <span class="player-name">${playerName}</span>
                </td>
                <td class="team-cell">
                    <img src="${getTeamLogoUrl(stats.Team)}" alt="${stats.Team} logo" class="team-logo-small">
                    <a href="${getTeamPageUrl(stats.Team)}" class="team-name">${stats.Team}</a>
                </td>
                <td>${stats.Position}</td>
                <td>${stats[category].toFixed(2)}</td>
                <td>${stats.MatchCount}</td>
            </tr>`;
        });

        html += '</table>';

        document.getElementById(category.toLowerCase().replace('distance', '-distance')).innerHTML = html;
    });
}
function getTeamLogoUrl(team) {
    if (!team) return 'team-logos/default_logo.webp';
    const cleanedTeam = team.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    return `team-logos/${cleanedTeam}.webp`;
}

function getTeamPageUrl(teamName) {
    return `team-roster.html?team=${encodeURIComponent(teamName)}`;
}

function setupTabs() {
    const tabs = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            tab.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
}
document.addEventListener('DOMContentLoaded', loadData);