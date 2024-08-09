let playersData = [];
let physicalData = [];

document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    let team = urlParams.get('team');
    console.log("Team from URL (encoded):", team);
    
    // Decode the team name without any modifications
    team = decodeURIComponent(team);
    console.log("Team name (decoded):", team);
    
    if (!team) {
        console.error("No team specified in URL");
        document.getElementById('team-name').textContent = 'Team Not Specified';
        return;
    }
    
    loadData(team);
    setupTabs();
});

function loadData(team) {
    Promise.all([
        fetch('Data_P90.json').then(response => response.json()),
        fetch('GPS.json').then(response => response.json())
    ]).then(([players, physical]) => {
        playersData = players;
        physicalData = physical;
        console.log("Players data loaded:", playersData.length, "players");
        console.log("Physical data loaded:", physicalData.length, "entries");
        console.log("Sample player data:", playersData[0]);
        
        document.getElementById('team-name').textContent = `${team} Roster`;
        loadTeamLogo(team);
        loadTeamRoster(team);
    }).catch(error => console.error('Error loading data:', error));
}

function loadTeamLogo(team) {
    const logoImg = document.getElementById('team-logo');
    const logoFileName = team.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.webp';
    logoImg.src = `team-logos/${logoFileName}`;
    logoImg.alt = `${team} logo`;
    logoImg.onerror = function() {
        this.src = 'team-logos/default_logo.webp';
        this.onerror = null;
    };
}

function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));
            
            button.classList.add('active');
            document.getElementById(`${tabName}-container`).classList.add('active');
        });
    });
}


function loadTeamRoster(team) {
    console.log("Loading roster for team:", team);
    let teamPlayers = playersData.filter(player => player.teamName === team);
    
    // If no players found, try matching without special characters and case-insensitive
    if (teamPlayers.length === 0) {
        const normalizedTeam = team.replace(/[^a-zA-Z0-9 ]/g, '').toLowerCase();
        teamPlayers = playersData.filter(player => 
            player.teamName.replace(/[^a-zA-Z0-9 ]/g, '').toLowerCase() === normalizedTeam
        );
    }
    console.log("Team players:", teamPlayers);
    const rosterContainer = document.getElementById('roster-container');

    if (!rosterContainer) {
        console.error("Roster container not found!");
        return;
    }

    if (teamPlayers.length === 0) {
        console.log("No players found for this team");
        rosterContainer.innerHTML = '<p>No players found for this team.</p>';
        return;
    }

    const positionGroups = {
        'Goalkeepers': ['Goalkeeper'],
        'Defenders': ['Centre Back', 'Right Back', 'Left Back', 'Central Defender'],
        'Midfielders': ['Central Midfielder', 'Defensive Midfielder', 'Centre Attacking Midfielder'],
        'Attackers': ['Left Winger', 'Right Winger', 'Centre Forward', 'Second Striker'],
        'Others': ['N/A']
    };

    function getPositionGroup(position) {
        for (const [group, positions] of Object.entries(positionGroups)) {
            if (positions.includes(position)) {
                return group;
            }
        }
        return 'Others';
    }

    const groupedPlayers = {
        'Goalkeepers': [],
        'Defenders': [],
        'Midfielders': [],
        'Attackers': [],
        'Others': []
    };

    teamPlayers.forEach(player => {
        const group = getPositionGroup(player.Position);
        groupedPlayers[group].push(player);
    });

    rosterContainer.innerHTML = '';

    // Define the order of position groups
    const orderedGroups = ['Goalkeepers', 'Defenders', 'Midfielders', 'Attackers', 'Others'];

    orderedGroups.forEach(group => {
        const players = groupedPlayers[group];
        if (players.length > 0) {
            const groupElement = document.createElement('div');
            groupElement.classList.add('position-group');
            groupElement.innerHTML = `<h2>${group}</h2>`;
            rosterContainer.appendChild(groupElement);

            const playersContainer = document.createElement('div');
            playersContainer.classList.add('players-container');
            groupElement.appendChild(playersContainer);

            players.forEach(player => createPlayerCard(player, team, playersContainer));
        }
    });
}

function createPlayerCard(player, team, container) {
    console.log("Processing player:", player.playerFullName);
    const playerPhysical = physicalData.find(p => 
        p.Player === player.Player || 
        p.Player === player.playerFullName ||
        p.Player.includes(player.lastName)
    );
    
    const haifaPhysical = team === "Maccabi Haifa" ? physicalData.find(p => 
        p.Team === "Haifa" && (
            p.Player === player.Player || 
            p.Player === player.playerFullName ||
            p.Player.includes(player.lastName)
        )
    ) : null;

    const playerPhysicalData = playerPhysical || haifaPhysical;

    const playerElement = document.createElement('div');
    playerElement.classList.add('player-card');
    
    const imageFileName = player.playerFullName.replace(/[^a-zA-Z0-9]/g, '_') + '.webp';
    const imageUrl = `player-images/${imageFileName}`;
    
    loadPlayerImage(imageUrl, playerElement);

    // Add sash for winter transfers
    let sashHTML = '';
    if (player.winter === "in") {
        sashHTML = '<div class="sash winter-arrival">Winter Arrival</div>';
    } else if (player.winter === "out") {
        sashHTML = '<div class="sash winter-departure">Winter Departure</div>';
    }
        if (player.winter === "out loan") {
        sashHTML = '<div class="sash out-for-loan">Out for Loan</div>';
    } else if (player.winter === "on loan") {
        sashHTML = '<div class="sash on-loan">On Loan</div>';
    }

    playerElement.innerHTML = `
        ${sashHTML}
        <div class="player-info">
            <h3>${player.playerFullName}</h3>
            <p>${player.Position || 'N/A'}</p>
            <p>Age: ${player.Age || 'N/A'}</p>
            <p>Games: ${player.GM || 'N/A'} | Goals: ${player.Goal || '0'}</p>
            <a href="player-page.html?id=${player.playerId}" class="player-link">View Profile</a>
        </div>
    `;
    container.appendChild(playerElement);
}

function loadPlayerImage(imageUrl, playerElement) {
    const img = new Image();
    img.onload = function() {
        playerElement.style.backgroundImage = `url('${imageUrl}')`;
    };
    img.onerror = function() {
        console.log(`Image not found for player: ${imageUrl}`);
        console.log("Attempting to load default image");
        playerElement.style.backgroundImage = `url('player-images/default.webp')`;
    };
    img.src = imageUrl;
}