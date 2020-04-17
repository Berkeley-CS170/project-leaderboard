
const sizes = ['small', 'medium', 'large'];
const numInputsPerSize = 10;

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
        const leaderboard = await pullLeaderboard(`${size}-${j}`, firebase);
        const ranks = getRanks(leaderboard);
        for (let i = 0; i < leaderboard.length; i++) {
          entry = leaderboard[i];
          name = entry[0];
          score = entry[1];
          
          if (!namesAndRanks.hasOwnProperty(name)) {
            namesAndRanks[name] = [];
          }

          namesAndRanks[name].push(ranks[i]);
        }
        totalInputs++;
      }
    }
    const finalEntries = [];
    for (let name in namesAndRanks) {
      const scores = namesAndRanks[name];
      if (scores.length == totalInputs) {
        const average = scores.reduce((a, b) => a + b) / totalInputs;
        finalEntries.push([name, average]);
      }
    }
    return finalEntries.sort((elem1, elem2) => elem1[1] - elem2[1]);
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

function formatLeaderboard(sortedEntries, header) {
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr>
      <th>#</th>
      <th>${header[0]}</th>
      <th>${header[1]}</th>
    </tr>
  `;
  table.appendChild(thead);
  table.className = 'table';
  ranks = getRanks(sortedEntries);
  for (let i = 0; i < sortedEntries.length; i++) {
      const currentRank = ranks[i];
      const row = document.createElement('tr');
      entry = sortedEntries[i];
      const rank = document.createElement('th');
      rank.innerHTML = currentRank;
      row.appendChild(rank);
      const name = document.createElement('td');
      name.innerHTML = entry[0];
      row.appendChild(name);
      const score = document.createElement('td');
      score.innerHTML = entry[1];

      row.appendChild(score);
      table.appendChild(row);
  }
  return table;
}

function createLeaderboard(leaderboardEntries, header) {
  if (leaderboardEntries === null) {
      document.getElementById('leaderboard').innerHTML += `<div class="row">No submissions exist for ${graphName}.in`;
  } else {
      document.getElementById('leaderboard').appendChild(
        formatLeaderboard(leaderboardEntries, header)
      );
  }
}

async function generateLeaderboard(graphName, firebase) {
    let entries = null;
    let header = null;
    if (graphName === null) {
      entries = await computeFullLeaderboard(firebase);
      header = ["Team Name", "Average Rank"];
    } else {
      entries = await pullLeaderboard(graphName, firebase);
      header = ["Team Name", "Average Pairwise Distance"];
    }
    document.getElementById("leaderboard").innerHTML = "";
    createLeaderboard(entries, header);
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
