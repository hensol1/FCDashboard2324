let availabilityData = [];
let playerData = [];
let playerNameMapping = {};
let currentSortColumn = '';
let isAscending = true;

function loadData() {
    Promise.all([
        fetch('Availability.json').then(response => response.json()),
        fetch('Data_P90.json').then(response => response.json())
    ])
    .then(([availabilityJson, playerJson]) => {
        availabilityData = availabilityJson;
        playerData = playerJson;
        createPlayerNameMapping();
        displayFullAvailability();
    })
    .catch(error => console.error('Error loading data:', error));
}

function createPlayerNameMapping() {
    playerNameMapping = {};
    playerData.forEach(player => {
        playerNameMapping[player.playerFullName] = player.Player;
    });
}

function displayFullAvailability() {
    const categories = ['% Use', 'Availability', 'Utilization'];
    
    let html = '<table class="compact-table">';
    html += '<tr>';
    html += '<th>Player</th><th>Team</th>';
    categories.forEach(category => {
        html += `<th class="sortable" data-category="${category}">${category} ▼▲</th>`;
    });
    html += '</tr>';

    availabilityData.forEach(player => {
        const playerInfo = playerData.find(p => p.playerFullName === player.Name);
        if (!playerInfo) return;

        html += `<tr>
            <td class="player-cell">
                <img src="player-images/${player.Name.replace(/ /g, '_')}.webp" alt="${player.Name}" class="player-image" onerror="this.onerror=null; this.src='player-images/default.webp';">
                <span class="player-name">${playerNameMapping[player.Name] || player.Name}</span>
            </td>
            <td class="team-cell">
                <img src="${getTeamLogoUrl(playerInfo.teamName)}" alt="${playerInfo.teamName} logo" class="team-logo-small">
                <a href="${getTeamPageUrl(playerInfo.teamName)}" class="team-name">${playerInfo.teamName}</a>
            </td>
            <td>${player['% Use']}</td>
            <td>${player['Availability']}</td>
            <td>${player['Utilization']}</td>
        </tr>`;
    });

    html += '</table>';
    document.getElementById('full-availability-content').innerHTML = html;

    // Add event listeners for sorting
    document.querySelectorAll('.sortable').forEach(th => {
        th.addEventListener('click', () => sortTable(th.dataset.category));
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

function sortTable(category) {
    if (currentSortColumn === category) {
        isAscending = !isAscending;
    } else {
        currentSortColumn = category;
        isAscending = true;
    }

    availabilityData.sort((a, b) => {
        const valueA = parseFloat(a[category].replace('%', ''));
        const valueB = parseFloat(b[category].replace('%', ''));
        return isAscending ? valueA - valueB : valueB - valueA;
    });

    displayFullAvailability();
}

document.addEventListener('DOMContentLoaded', loadData);