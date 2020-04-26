
const sizes = ['small', 'medium', 'large'];
const numInputsPerSize = 10;

let test = null;
let teams = null;

async function loadTeams(firebase) {
  const teamSet = new Set();
  await firebase.database().ref("leaderboard").orderByChild("leaderboard_name").once("value", 
  function(snapshot) {
    snapshot.forEach(function (item) {
      teamSet.add(item.val()["leaderboard_name"]);
    });
  });
  teams = Array.from(teamSet).slice();
}

async function loadAutocomplete(input, firebase) {
  await loadTeams(firebase);
  new Awesomplete(input, {list: teams});
}

async function pullLeaderboard(graphName, firebase) {
    const entries = [];
    await firebase.database().ref("leaderboard").orderByChild("input").equalTo(graphName).once("value", function(snapshot) {
      snapshot.forEach(function(item) {
        entries.push([item.val()["leaderboard_name"], item.val()["score"]]);
      });
    });
    return entries.sort((elem1, elem2) => elem1[1] - elem2[1]);
}

async function computeFullLeaderboard(firebase) {
    const namesAndRanks = {};
    let totalInputs = 0;
    for (let i = 0; i < sizes.length; i++) {
      const size = sizes[i];
      for (let j = 1; j <= numInputsPerSize; j++) {
        const graphName = `${size}-${j}`;
        const leaderboard = await pullLeaderboard(graphName, firebase);
        const ranks = getRanks(leaderboard);
        for (let i = 0; i < leaderboard.length; i++) {
          entry = leaderboard[i];
          name = entry[0];
          score = entry[1];

          if (!namesAndRanks.hasOwnProperty(name)) {
            namesAndRanks[name] = [];
          }

          namesAndRanks[name].push([graphName, ranks[i]]);
        }
        totalInputs++;
      }
    }
    const finalEntries = [];
    for (let name in namesAndRanks) {
      const scores = namesAndRanks[name];
      test = scores;
      if (scores.length == totalInputs) {
        const average = scores.reduce((a, b) => a + b[1], 0) / totalInputs;
        finalEntries.push([name, average]);
      }
    }
    return [namesAndRanks, finalEntries.sort((elem1, elem2) => elem1[1] - elem2[1])];
}

function getRanks(sortedEntries) {
    let currentRank = 0;
    let prevValue = -1;

    const ranks = [];

    for (let i = 0; i < sortedEntries.length; i++) {
        const entry = sortedEntries[i];

        if (entry[1] != prevValue) {
          currentRank++;
          prevValue = entry[1];
        }

        ranks.push(currentRank);
    }
    return ranks;
}

function formatTable(sortedEntries, header, addRanks) {
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const headerElements = [];
  header.forEach((elem) => headerElements.push(`<th>${elem}</th>`));
  thead.innerHTML = headerElements.join('\n');
  table.appendChild(thead);
  table.className = 'table';
  let ranks = null;
  if (addRanks) {
      ranks = getRanks(sortedEntries);
  }
  for (let i = 0; i < sortedEntries.length; i++) {
      const row = document.createElement('tr');
      entry = sortedEntries[i];
      if (addRanks) {
        const currentRank = ranks[i];
        const rank = document.createElement('th');
        rank.innerHTML = currentRank;
        row.appendChild(rank);
      }
      for (let j = 0; j < entry.length; j++) {
          const elem = document.createElement('td');
          elem.innerHTML = entry[j];
          row.appendChild(elem);
      }
      table.appendChild(row);
  }
  return table;
}

function createLeaderboard(leaderboardEntries, header, title) {
  for (let i = 0; i < leaderboardEntries.length; i++) {
    const entry = leaderboardEntries[i];
    entry[0] = `<a class="team-link" onclick="moveToTeam('${entry[0]}')">${entry[0]}</a>`;
  }
  document.getElementById('table-title').innerHTML = title;
  document.getElementById('table').appendChild(
    formatTable(leaderboardEntries, header, true)
  );
}

function createTeamView(teamEntries, teamName) {
  for (let i = 0; i < teamEntries.length; i++) {
    const entry = teamEntries[i];
    entry[0] = `<a class="leaderboard-link" onclick="moveToLeaderboard('${entry[0]}')">${entry[0]}</a>`;
  }
  document.getElementById('table-title').innerHTML = `Team <code>${teamName}</code>`;
  document.getElementById('table').appendChild(
    formatTable(teamEntries, ["Input Name", "Rank"], false)
  );
}

async function generateRanksForTeam(teamName, firebase) {
  fullLeaderboardResults = await computeFullLeaderboard(firebase);
  namesAndRanks = fullLeaderboardResults[0];
  return namesAndRanks.hasOwnProperty(teamName) ? namesAndRanks[teamName] : null;
}

async function generateTeamView(teamName, firebase) {
   const entries = await generateRanksForTeam(teamName, firebase);
   document.getElementById("table").innerHTML = '';
   if (entries == null) {
     const div = document.createElement('h1');
     div.innerHTML = 'Invalid team name';
     div.className = 'invalid';
     document.getElementById("table").appendChild(div);
   } else {
     createTeamView(entries, teamName);
   }
}

async function generateLeaderboard(graphName, firebase) {
    let entries = null;
    let header = null;
    let title = null;
    if (graphName === null) {
      fullLeaderboardResults = await computeFullLeaderboard(firebase);
      entries = fullLeaderboardResults[1];
      header = ["#", "Team Name", "Average Rank"];
      title = "";
    } else {
      entries = await pullLeaderboard(graphName, firebase);
      if (entries.length > 0) {
        header = ["#", "Team Name", "Average Pairwise Distance"];
        title = `<code>${graphName}.in</code>`;
      } else {
        header = [];
        title = "";
      }
    }
    document.getElementById("table").innerHTML = '';
    if (entries.length == 0) {
      const div = document.createElement('h1');
      div.innerHTML = 'Invalid input name';
      div.className = 'invalid';
      document.getElementById("table").appendChild(div);
    } else {
      createLeaderboard(entries, header, title);
    }
}

function getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split('&');
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        if (decodeURIComponent(pair[0]) == variable) {
            return decodeURIComponent(pair[1]);
        }
    }
    return null;
}
