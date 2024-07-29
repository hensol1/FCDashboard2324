let playersData = [];
let physicalData = [];

document.addEventListener('DOMContentLoaded', function() {
    Promise.all([
        fetch('Data_P90.json').then(response => response.json()),
        fetch('GPS.json').then(response => response.json())
    ]).then(([players, physical]) => {
        playersData = players;
        physicalData = physical;
        console.log("Players data:", playersData);
        console.log("Physical data:", physicalData);
        loadTeamsData();
    }).catch(error => console.error('Error loading data:', error));
});

function loadTeamsData() {
    // Extract unique team names from both data sources
    const teamsFromPlayers = new Set(playersData.map(player => player.teamName).filter(Boolean));
    const teamsFromPhysical = new Set(physicalData.map(data => data.Team).filter(Boolean));
    
    // Combine teams from both sources
    let teams = [...new Set([...teamsFromPlayers, ...teamsFromPhysical])];
    
    // Remove duplicate Haifa team
    teams = teams.filter(team => team !== "Haifa");

    console.log("Unique teams:", teams);

    const teamsContainer = document.getElementById('teams-container');
    if (!teamsContainer) {
        console.error("Teams container not found");
        return;
    }

    if (teams.length === 0) {
        teamsContainer.innerHTML = '<p>No teams found</p>';
        return;
    }

    teams.forEach(team => {
        if (!team) return; // Skip if team name is null or undefined

        const teamElement = document.createElement('div');
        teamElement.classList.add('team-card');
        
        const logoImg = document.createElement('img');
        const logoFileName = team.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.webp';
        logoImg.src = `team-logos/${logoFileName}`;
        logoImg.alt = `${team} logo`;
        logoImg.classList.add('team-logo');
        logoImg.onerror = function() {
            // If the exact match fails, try a more flexible match
            const flexibleMatch = Object.keys(logoMap).find(key => 
                team.toLowerCase().includes(key.toLowerCase()) || 
                key.toLowerCase().includes(team.toLowerCase())
            );
            if (flexibleMatch) {
                this.src = `team-logos/${logoMap[flexibleMatch]}`;
            } else {
                this.src = 'team-logos/default_logo.webp';
            }
            this.onerror = null;
        };
        
        teamElement.innerHTML = `
            <h2>${team}</h2>
            <button onclick="viewTeamRoster('${team.replace(/'/g, "\\'")}')">View Stats</button>
        `;
        
        teamElement.insertBefore(logoImg, teamElement.firstChild);
        teamsContainer.appendChild(teamElement);
    });
}

function viewTeamRoster(team) {
    const encodedTeam = encodeURIComponent(team);
    console.log("Navigating to team roster:", team, "Encoded:", encodedTeam);
    window.location.href = `team-roster.html?team=${encodedTeam}`;
}

// Add this mapping object at the top of your file
const logoMap = {
    "Maccabi Tel Aviv": "maccabi_tel_aviv.webp",
    "Hapoel Tel Aviv": "hapoel_tel_aviv.webp",
    "Beitar Jerusalem": "beitar_jerusalem.webp",
    "Maccabi Haifa": "maccabi_haifa.webp",
    "Bnei Sakhnin": "bnei_sakhnin.webp",
    // Add more mappings as needed
};