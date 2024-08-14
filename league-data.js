let leagueData = [];
let currentSort = { key: '', order: '' };

function loadData() {
    fetch('team_age_stats.json')
        .then(response => response.json())
        .then(data => {
            leagueData = data;
            displayAverageAgeTable();
            displayU21PercentageTable();
            setupTabs();
        })
        .catch(error => console.error('Error loading data:', error));
}

function displayAverageAgeTable() {
    const averageAgeData = leagueData.combinedData;
    const tableHtml = createTable(averageAgeData, 'AverageAge', 'AVERAGE AGE');
    document.getElementById('average-age').innerHTML = tableHtml;
    setupSorting('average-age', ['AverageAge', 'LeaguePosition']);
}

function displayU21PercentageTable() {
    const u21PercentageData = leagueData.combinedData;
    const tableHtml = createTable(u21PercentageData, 'PercentageU21', 'U21 PERCENTAGE');
    document.getElementById('u21-percentage').innerHTML = tableHtml;
    setupSorting('u21-percentage', ['PercentageU21', 'LeaguePosition']);
}

function createTable(data, sortKey, columnName) {
    let html = '<table class="compact-table">';
    html += createTableHeader(sortKey, columnName);
    html += createTableBody(data, sortKey);
    html += '</table>';
    return html;
}

function createTableHeader(sortKey, columnName) {
    return `<thead>
        <tr>
            <th>RANK</th>
            <th>TEAM</th>
            <th class="sortable" data-sort="${sortKey}">
                <span class="header-text">${columnName}</span>
                <span class="sort-indicator">▲▼</span>
            </th>
            <th class="sortable" data-sort="LeaguePosition">
                <span class="header-text">LEAGUE POSITION</span>
                <span class="sort-indicator">▲▼</span>
            </th>
        </tr>
    </thead>`;
}

function createTableBody(data, sortKey) {
    let html = '<tbody>';
    data.forEach((team, index) => {
        html += `<tr>
            <td>${index + 1}</td>
            <td class="team-cell">
                <div class="team-info">
                    <img src="${getTeamLogoUrl(team.Team)}" alt="${team.Team} logo" class="team-logo-small">
                    <span class="team-name">${team.Team}</span>
                </div>
            </td>
            <td>${team[sortKey].toFixed(2)}${sortKey === 'PercentageU21' ? '%' : ''}</td>
            <td>${team.LeaguePosition}</td>
        </tr>`;
    });
    html += '</tbody>';
    return html;
}


function getTeamLogoUrl(team) {
    if (!team) return 'team-logos/default_logo.webp';
    const cleanedTeam = team.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    return `team-logos/${cleanedTeam}.webp`;
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

function setupSorting(tableId, sortableColumns) {
    const table = document.getElementById(tableId);
    const headers = table.querySelectorAll('th.sortable');
    
    headers.forEach(header => {
        header.addEventListener('click', () => {
            const key = header.getAttribute('data-sort');
            if (sortableColumns.includes(key)) {
                sortTable(tableId, key);
            }
        });
    });
}

function sortTable(tableId, key) {
    const table = document.getElementById(tableId);
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));

    if (currentSort.key === key) {
        currentSort.order = currentSort.order === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.key = key;
        currentSort.order = 'asc';
    }

    rows.sort((a, b) => {
        let aValue = a.children[key === 'LeaguePosition' ? 3 : 2].textContent;
        let bValue = b.children[key === 'LeaguePosition' ? 3 : 2].textContent;

        if (key !== 'LeaguePosition') {
            aValue = parseFloat(aValue);
            bValue = parseFloat(bValue);
        } else {
            aValue = parseInt(aValue);
            bValue = parseInt(bValue);
        }

        if (aValue < bValue) return currentSort.order === 'asc' ? -1 : 1;
        if (aValue > bValue) return currentSort.order === 'asc' ? 1 : -1;
        return 0;
    });

    // Clear and repopulate tbody
    tbody.innerHTML = '';
    rows.forEach((row, index) => {
        row.firstElementChild.textContent = index + 1;
        tbody.appendChild(row);
    });

    // Update sorting indicators
    table.querySelectorAll('th.sortable').forEach(th => {
        const sortIndicator = th.querySelector('.sort-indicator');
        if (th.getAttribute('data-sort') === key) {
            sortIndicator.textContent = currentSort.order === 'asc' ? '▲' : '▼';
        } else {
            sortIndicator.textContent = '▲▼';
        }
    });
}

document.addEventListener('DOMContentLoaded', loadData);