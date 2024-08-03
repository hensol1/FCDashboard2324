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
    loadAvailabilityData();
    loadTrainingData();

    // Add event listener for season change
    document.getElementById('season').addEventListener('change', updateStandings);


});

function setupTabs(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container with id ${containerId} not found`);
        return;
    }
    const tabs = container.querySelectorAll('.tab-button');
    const contents = container.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.getAttribute('data-tab');
            
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            
            tab.classList.add('active');
            const targetContent = container.querySelector(`#${target}`);
            if (targetContent) {
                targetContent.classList.add('active');
            } else {
                console.error(`Target content #${target} not found`);
            }
        });
    });
}

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
        
        const homeLogoUrl = getTeamLogoUrl(homeTeam);
        const awayLogoUrl = getTeamLogoUrl(awayTeam);
        
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

/*availbility*/

function loadAvailabilityData() {
  fetch('Availability.json')
    .then(response => response.json())
    .then(data => {
      displayAvailabilityData(data);
    })
    .catch(error => console.error('Error loading Availability data:', error));
}

function displayAvailabilityData(data) {
  const categories = ['% Use', 'Availability', 'Utilization'];
  
  categories.forEach(category => {
    const sortedData = data.sort((a, b) => {
      const valueA = parseFloat(a[category].replace('%', '')) || 0;
      const valueB = parseFloat(b[category].replace('%', '')) || 0;
      return valueB - valueA;
    });

    const top3 = sortedData.slice(0, 3);
    
    // Find the bottom 3 players with actual names
    const bottom3 = sortedData.filter(player => player.Name && player.Name !== "Unknown Player")
                              .slice(-3)
                              .reverse();

    const contentId = category.toLowerCase().replace('% ', '') + '-content';
    const content = document.getElementById(contentId);
    if (!content) {
      console.error(`Element with id ${contentId} not found`);
      return;
    }

    let html = `<h3>${category}</h3><table class="compact-table">
      <tr>
        <th>Player</th>
        <th>${category}</th>
      </tr>
      <tr class="category-header">
        <td colspan="2">Top 3 Players</td>
      </tr>`;
    
    top3.forEach(player => {
      html += createAvailabilityPlayerRow(player, category);
    });
    
    html += `<tr class="category-header">
      <td colspan="2">Bottom 3 Players</td>
    </tr>`;
    
    bottom3.forEach(player => {
      html += createAvailabilityPlayerRow(player, category);
    });
    
    html += '</table>';
    content.innerHTML = html;
  });
}

function createAvailabilityPlayerRow(player, category) {
  const playerName = player.Name || 'Unknown Player';
  const playerFullName = playerNameMapping[playerName] || playerName;
  const value = player[category] || '0%';
  
  return `<tr>
    <td class="player-cell">
      <div class="player-info">
        <img src="player-images/${playerFullName.replace(/ /g, '_')}.webp" 
             alt="${playerFullName}" 
             class="player-image" 
             onerror="this.onerror=null; this.src='player-images/default.webp';">
        <span class="player-name">${playerName}</span>
      </div>
    </td>
    <td>${value}</td>
  </tr>`;
}

function createPlayerRow(player, category) {
  const playerName = player.Name || 'Unknown Player';
  const playerFullName = playerNameMapping[playerName] || playerName;
  const value = player[category] || 'N/A';
  
  return `<tr>
    <td class="player-cell">
      <img src="player-images/${playerFullName.replace(/ /g, '_')}.webp" 
           alt="${playerFullName}" 
           class="player-image" 
           onerror="this.onerror=null; this.src='player-images/default.webp';">
      <span>${playerName}</span>
    </td>
    <td>${value}</td>
  </tr>`;
}

// Update the document.addEventListener('DOMContentLoaded', ...) function
document.addEventListener('DOMContentLoaded', function() {
  updateStandings();
  loadGPSData();
  loadFixtures();
  loadAvailabilityData(); // Add this line to load the Availability data




  // Add event listener for season change
  document.getElementById('season').addEventListener('change', updateStandings);
    
      // Set up tabs for player stats and availability sections
  setupTabs('player-stats');
  setupTabs('future-section');

    
    // Add event listeners for player stats tab buttons
document.querySelectorAll('#player-stats .tab-button').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('#player-stats .tab-button').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('#player-stats .tab-content').forEach(content => content.classList.remove('active'));
    button.classList.add('active');
    document.getElementById(button.getAttribute('data-tab')).classList.add('active');
  });
});


// Add event listeners for availability tab buttons
document.querySelectorAll('#future-section .tab-button').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('#future-section .tab-button').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('#future-section .tab-content').forEach(content => content.classList.remove('active'));
    button.classList.add('active');
    document.getElementById(button.getAttribute('data-tab')).classList.add('active');
  });
});

});

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

function loadTrainingData() {
  fetch('training.json')
    .then(response => response.json())
    .then(data => {
      // Filter out empty entries and entries without a Name
      const filteredData = data.filter(player => player.Name && player.Name.trim() !== "");
      displayTrainingData(filteredData);
    })
    .catch(error => console.error('Error loading Training data:', error));
}

function displayTrainingData(data) {
  const sortedByPercent = [...data].sort((a, b) => {
    const valueA = parseFloat(a['% Miss'].replace('%', '')) || 0;
    const valueB = parseFloat(b['% Miss'].replace('%', '')) || 0;
    return valueB - valueA;
  });

  const sortedByTotal = [...data].sort((a, b) => {
    return parseInt(b.Total) - parseInt(a.Total);
  });

  displayTrainingTable(sortedByPercent.slice(0, 5), 'training-percent', '% Miss');
  displayTrainingTable(sortedByTotal.slice(0, 5), 'training-total', 'Total');

  // Set up tab switching for training data
  setupTabs('future-section');
}

function displayTrainingTable(data, contentId, sortColumn) {
  const content = document.getElementById(contentId);
  if (!content) {
    console.error(`Element with id ${contentId} not found`);
    return;
  }

  let html = `<h3>Top 5 Training Missed </h3><table class="compact-table">
    <tr>
      <th>Player</th>
      <th>% Miss</th>
      <th>Total</th>
    </tr>`;

  data.forEach(player => {
    html += createTrainingPlayerRow(player);
  });

  html += '</table>';
  content.innerHTML = html;
}

function createTrainingPlayerRow(player) {
  const playerName = player.Name || 'Unknown Player';
  const playerFullName = playerNameMapping[playerName] || playerName;
  const percentMiss = player['% Miss'] || '0%';
  const total = player.Total || '0';

  return `<tr>
    <td class="player-cell">
      <div class="player-info">
        <img src="player-images/${playerFullName.replace(/ /g, '_')}.webp" 
             alt="${playerFullName}" 
             class="player-image" 
             onerror="this.onerror=null; this.src='player-images/default.webp';">
        <span class="player-name">${playerName}</span>
      </div>
    </td>
    <td>${percentMiss}</td>
    <td>${total}</td>
  </tr>`;
}