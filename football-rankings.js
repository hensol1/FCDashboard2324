let playerData = [];
let currentSort = { column: '', direction: 'desc' };
let currentFilters = {
    search: '',
    club: '',
    position: '',
    age: ''
};

const positionCategories = {
    'Defenders': ['Centre Back', 'Right Back', 'Left Back', 'Central Defender'],
    'Midfielders': ['Central Midfielder', 'Defensive Midfielder', 'Centre Attacking Midfielder'],
    'Attackers': ['Left Winger', 'Right Winger', 'Centre Forward', 'Second Striker']
};

const statCategories = {
    'passing': ['Touches', 'PsAtt', 'Pass%', 'Ps%InA3rd', 'Chance', 'Ast', 'xA'],
    'shooting': ['Goal', 'ExpG', 'ShotExcBlk', 'Shot', 'SOG', 'OnTarget%'],
    'defense': ['Tackle%', 'Duel%', 'Aerial%', 'Recovery']
};

function loadData() {
    fetch('Data_P90.json')
        .then(response => response.json())
        .then(data => {
            playerData = data;
            populateClubFilter();
            displayFootballRankings();
            setupTabs();
            setupFilters();
        })
        .catch(error => console.error('Error loading data:', error));
}

function displayFootballRankings() {
    const filteredPlayers = getFilteredPlayers();

    Object.entries(statCategories).forEach(([category, stats]) => {
        let html = '<table class="compact-table">';
        html += '<tr><th>Rank</th><th>Player</th><th>Team</th><th>Position</th><th>Age</th><th>Matches</th>'; // Added Matches
        stats.forEach(stat => {
            html += `<th class="sortable" data-stat="${stat}">${stat} ${getSortIndicator(stat)}</th>`;
        });
        html += '</tr>';

        let players = filteredPlayers.filter(player => player.Min >= 500);

        players.sort((a, b) => b[currentSort.column || stats[0]] - a[currentSort.column || stats[0]]);
        if (currentSort.direction === 'asc') {
            players.reverse();
        }

        players.forEach((player, index) => {
            html += `<tr>
                <td>${index + 1}</td>
                <td class="player-cell">
                    <a href="player-page.html?id=${player.playerId}" class="player-link">
                        <img src="player-images/${player.playerFullName.replace(/ /g, '_')}.webp" alt="${player.playerFullName}" class="player-image" onerror="this.onerror=null; this.src='player-images/default.webp';">
                        <span class="player-name">${player.Player}</span>
                    </a>
                </td>
                <td class="team-cell">
                    <img src="${getTeamLogoUrl(player.teamName)}" alt="${player.teamName} logo" class="team-logo-small">
                    <a href="${getTeamPageUrl(player.teamName)}" class="team-name">${player.teamName}</a>
                </td>
                <td>${player.Position}</td>
                <td>${player.Age}</td>
                <td>${player.GM}</td>`; // Added Matches (GM)
            stats.forEach(stat => {
                html += `<td>${player[stat]}</td>`;
            });
            html += '</tr>';
        });

        html += '</table>';
        document.getElementById(category).innerHTML = html;
    });

    setupSorting();
}

function getSortIndicator(stat) {
    if (currentSort.column === stat) {
        return currentSort.direction === 'desc' ? '▼' : '▲';
    }
    return '';
}

function setupSorting() {
    const sortableHeaders = document.querySelectorAll('.sortable');
    sortableHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const stat = header.dataset.stat;
            if (currentSort.column === stat) {
                currentSort.direction = currentSort.direction === 'desc' ? 'asc' : 'desc';
            } else {
                currentSort.column = stat;
                currentSort.direction = 'desc';
            }
            displayFootballRankings();
        });
    });
}

function getFilteredPlayers() {
    return playerData.filter(player => {
        const matchesSearch = player.playerFullName.toLowerCase().includes(currentFilters.search.toLowerCase());
        const matchesClub = !currentFilters.club || player.teamName === currentFilters.club;
        const matchesPosition = !currentFilters.position || (positionCategories[currentFilters.position] && positionCategories[currentFilters.position].includes(player.Position)) || player.Position === 'N/A';
        const matchesAge = !currentFilters.age || checkAgeFilter(player.Age, currentFilters.age);

        return matchesSearch && matchesClub && matchesPosition && matchesAge;
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
        // Set the first tab (Passing) as active by default
    tabs[0].classList.add('active');
    document.getElementById('passing').classList.add('active');

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
    currentFilters = {
        search: '',
        club: '',
        position: '',
        age: ''
    };
    displayFootballRankings();
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
    currentFilters = {
        search: document.getElementById('player-search').value,
        club: document.getElementById('club-filter').value,
        position: document.getElementById('position-filter').value,
        age: document.getElementById('age-filter').value
    };
    displayFootballRankings();
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