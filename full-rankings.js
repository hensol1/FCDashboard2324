let gpsData = [];
let playerData = [];
let playerNameMapping = {};

const positionCategories = {
    'Defenders': ['Centre Back', 'Right Back', 'Left Back', 'Central Defender'],
    'Midfielders': ['Central Midfielder', 'Defensive Midfielder', 'Centre Attacking Midfielder'],
    'Attackers': ['Left Winger', 'Right Winger', 'Centre Forward', 'Second Striker']
};

function createPlayerNameMapping() {
    playerNameMapping = {};
    playerData.forEach(player => {
        playerNameMapping[player.playerFullName] = player.Player;
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
        populateClubFilter();
        displayFullRankings();
        setupTabs();
        setupFilters();
    })
    .catch(error => console.error('Error loading data:', error));
}

function calculatePlayerAverages(data) {
    const playerAverages = {};
    data.forEach(entry => {
        const playerInfo = playerData.find(p => p.Player === entry.Player);
        if (!playerInfo) return;
        
        const fullName = playerInfo.playerFullName;
        if (!playerAverages[fullName]) {
            playerAverages[fullName] = {
                Team: playerInfo.teamName,
                Position: playerInfo.Position,
                Age: playerInfo.Age,
                TotalDistance: 0,
                HsrDistance: 0,
                SprintDistance: 0,
                TotalMinutes: 0,
                MatchCount: 0
            };
        }
        playerAverages[fullName].TotalDistance += entry.TotalDistance;
        playerAverages[fullName].HsrDistance += entry.HsrDistance;
        playerAverages[fullName].SprintDistance += entry.SprintDistance;
        playerAverages[fullName].TotalMinutes += entry.Minutes;
        playerAverages[fullName].MatchCount++;
    });

    Object.keys(playerAverages).forEach(player => {
        const avg = playerAverages[player];
        if (avg.MatchCount >= 10 && avg.TotalMinutes >= 500) {
            avg.TotalDistance = avg.TotalDistance / avg.MatchCount;
            avg.HsrDistance = avg.HsrDistance / avg.MatchCount;
            avg.SprintDistance = avg.SprintDistance / avg.MatchCount;
            
            // Calculate overall fitness score
            avg.OverallFitness = (
                (avg.TotalDistance / 10000) + // Normalize to ~0-1 range
                (avg.HsrDistance / 1000) +    // Normalize to ~0-1 range
                (avg.SprintDistance / 300)    // Normalize to ~0-1 range
            ) / 3; // Average of the three normalized scores
        } else {
            delete playerAverages[player];
        }
    });

    return playerAverages;
}

function displayFullRankings(filteredPlayers = null) {
    const playerAverages = calculatePlayerAverages(gpsData);
    const categories = ['TotalDistance', 'HsrDistance', 'SprintDistance'];
    const categoryNames = {
        'TotalDistance': 'Total Distance',
        'HsrDistance': 'HSR Distance',
        'SprintDistance': 'Sprint Distance'
    };

    categories.forEach(category => {
        let sortedPlayers = Object.entries(playerAverages)
            .sort((a, b) => b[1][category] - a[1][category]);

        if (filteredPlayers) {
            sortedPlayers = sortedPlayers.filter(([playerName]) => filteredPlayers.includes(playerName));
        }

        let html = '<table class="compact-table">';
        html += '<tr><th>Rank</th><th>Player</th><th>Team</th><th>Position</th><th>Age</th><th>Average</th><th>Matches</th></tr>';

        sortedPlayers.forEach((player, index) => {
            const [playerFullName, stats] = player;
            const shortName = playerNameMapping[playerFullName] || playerFullName;
            const playerInfo = playerData.find(p => p.playerFullName === playerFullName);
            const playerId = playerInfo ? playerInfo.playerId : '';

            html += `<tr>
                <td>${index + 1}</td>
                <td class="player-cell">
                    <a href="player-page.html?id=${playerId}" class="player-link">
                        <img src="player-images/${playerFullName.replace(/ /g, '_')}.webp" alt="${playerFullName}" class="player-image" onerror="this.onerror=null; this.src='player-images/default.webp';">
                        <span class="player-name">${shortName}</span>
                    </a>
                </td>
                <td class="team-cell">
                    <img src="${getTeamLogoUrl(stats.Team)}" alt="${stats.Team} logo" class="team-logo-small">
                    <a href="${getTeamPageUrl(stats.Team)}" class="team-name">${stats.Team}</a>
                </td>
                <td>${stats.Position}</td>
                <td>${stats.Age}</td>
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

function populateClubFilter() {
    const clubs = [...new Set(playerData.map(player => player.teamName))];
    const clubFilter = document.getElementById('club-filter');
    clubs.forEach(club => {
        const option = document.createElement('option');
        option.value = club;
        option.textContent = club;
        clubFilter.appendChild(option);
    });
}

function clearFilters() {
    document.getElementById('player-search').value = '';
    document.getElementById('club-filter').value = '';
    document.getElementById('position-filter').value = '';
    document.getElementById('age-filter').value = '';
    applyFilters(); // Re-apply filters (which will now show all players)
}


function setupFilters() {
    const playerSearch = document.getElementById('player-search');
    const clubFilter = document.getElementById('club-filter');
    const positionFilter = document.getElementById('position-filter');
    const ageFilter = document.getElementById('age-filter');
    const clearFiltersButton = document.getElementById('clear-filters');

    [playerSearch, clubFilter, positionFilter, ageFilter].forEach(filter => {
        filter.addEventListener('change', applyFilters);
    });

    playerSearch.addEventListener('input', applyFilters);
    clearFiltersButton.addEventListener('click', clearFilters);
}


function applyFilters() {
    const searchTerm = document.getElementById('player-search').value.toLowerCase();
    const clubFilter = document.getElementById('club-filter').value;
    const positionFilter = document.getElementById('position-filter').value;
    const ageFilter = document.getElementById('age-filter').value;

    const filteredPlayers = playerData.filter(player => {
        const matchesSearch = player.playerFullName.toLowerCase().includes(searchTerm);
        const matchesClub = !clubFilter || player.teamName === clubFilter;
        const matchesPosition = !positionFilter || (positionCategories[positionFilter] && positionCategories[positionFilter].includes(player.Position)) || player.Position === 'N/A';
        const matchesAge = !ageFilter || checkAgeFilter(player.Age, ageFilter);

        return matchesSearch && matchesClub && matchesPosition && matchesAge;
    }).map(player => player.playerFullName);

    displayFullRankings(filteredPlayers);
}

function checkAgeFilter(age, filter) {
    age = parseInt(age);
    switch (filter) {
        case 'U20':
            return age <= 20;
        case 'U23':
            return age <= 23;
        case 'U30':
            return age <= 30;
        default:
            return true;
    }
}

document.addEventListener('DOMContentLoaded', loadData);