document.addEventListener('DOMContentLoaded', function() {
  updateStandings();
  loadFixtures();

  // Add event listener for season change
  document.getElementById('season').addEventListener('change', updateStandings);
});

function loadFixtures() {
  fetch('fixtures.json')
    .then(response => response.json())
    .then(data => {
      const matchdaySelect = document.getElementById('matchday-select');
      const fixturesContent = document.getElementById('fixtures-content');

      // Populate matchday dropdown
      for (let i = 1; i <= 26; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `Matchday ${i}`;
        matchdaySelect.appendChild(option);
      }

      // Display first matchday by default
      displayMatchday(data, 1);

      // Add event listener for matchday change
      matchdaySelect.addEventListener('change', function() {
        displayMatchday(data, this.value);
      });
    })
    .catch(error => {
      console.error('Error loading fixtures:', error);
      document.getElementById('fixtures-content').textContent = 'Error loading fixtures';
    });
}

function displayMatchday(data, matchday) {
  const fixturesContent = document.getElementById('fixtures-content');
  const matchdayData = data[`${matchday}.Matchday`];

  if (matchdayData) {
    let tableHtml = `
      <table id="fixtures-table">
        <thead>
          <tr>
            <th>Home Team</th>
            <th>Score</th>
            <th>Away Team</th>
          </tr>
        </thead>
        <tbody>
    `;
    matchdayData.forEach(match => {
      tableHtml += `
        <tr>
          <td>${match.home_team}</td>
          <td>${match.score}</td>
          <td>${match.away_team}</td>
        </tr>
      `;
    });
    tableHtml += '</tbody></table>';
    fixturesContent.innerHTML = tableHtml;
  } else {
    fixturesContent.textContent = 'No fixtures found for this matchday';
  }
}