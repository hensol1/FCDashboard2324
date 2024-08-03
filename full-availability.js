let availabilityData = [];
let trainingData = [];
let playerData = [];
let playerNameMapping = {};
let currentSortColumn = '';
let isAscending = true;

function loadData() {
    Promise.all([
        fetch('Availability.json').then(response => response.json()),
        fetch('Training.json').then(response => response.json()),
        fetch('Data_P90.json').then(response => response.json())
    ])
    .then(([availabilityJson, trainingJson, playerJson]) => {
        availabilityData = availabilityJson;
        trainingData = trainingJson;
        playerData = playerJson;
        createPlayerNameMapping();
        displayFullAvailability();
        displayFullTrainingMissed();
        setupTabs();
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
        html += `<th class="sortable" data-category="${category}" data-table="availability">${category} ▼▲</th>`;
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
    document.querySelectorAll('.sortable[data-table="availability"]').forEach(th => {
        th.addEventListener('click', () => sortTable(th.dataset.category, 'availability'));
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

function displayFullTrainingMissed() {
    let html = '<table class="compact-table">';
    html += '<tr><th>Player</th><th>Team</th>';
    html += '<th class="sortable" data-category="% Miss" data-table="training">% Miss ▼▲</th>';
    html += '<th class="sortable" data-category="Total" data-table="training">Total ▼▲</th></tr>';

    trainingData.forEach(player => {
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
            <td>${player['% Miss']}</td>
            <td>${player['Total']}</td>
        </tr>`;
    });

    html += '</table>';
    document.getElementById('full-training-missed-content').innerHTML = html;

    // Add event listeners for sorting
    document.querySelectorAll('.sortable[data-table="training"]').forEach(th => {
        th.addEventListener('click', () => sortTable(th.dataset.category, 'training'));
    });
}

function sortTable(category, table) {
    if (currentSortColumn === category) {
        isAscending = !isAscending;
    } else {
        currentSortColumn = category;
        isAscending = true;
    }

    const dataToSort = table === 'availability' ? availabilityData : trainingData;

    dataToSort.sort((a, b) => {
        let valueA = a[category];
        let valueB = b[category];

        if (typeof valueA === 'string') valueA = valueA.replace('%', '');
        if (typeof valueB === 'string') valueB = valueB.replace('%', '');

        valueA = parseFloat(valueA) || 0;
        valueB = parseFloat(valueB) || 0;

        return isAscending ? valueA - valueB : valueB - valueA;
    });

    if (table === 'availability') {
        displayFullAvailability();
    } else {
        displayFullTrainingMissed();
    }
}


function setupTabs() {
    const tabs = document.querySelectorAll('.tab-button');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.getAttribute('data-tab');
            
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            
            tab.classList.add('active');
            document.getElementById(target).classList.add('active');

            // Update the URL hash without triggering a page reload
            history.pushState(null, '', `#${target}`);
        });
    });

    // Handle initial hash on page load
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
}
function handleHashChange() {
    const hash = window.location.hash.substring(1);
    if (hash === 'training-missed') {
        const trainingTab = document.querySelector('.tab-button[data-tab="training-missed"]');
        if (trainingTab) {
            trainingTab.click();
        }
    }
}


document.addEventListener('DOMContentLoaded', loadData);