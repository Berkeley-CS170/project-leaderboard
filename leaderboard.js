
const sizes = ['small', 'medium', 'large'];
const numInputsPerSize = 10;

function pullLeaderboard(graphName, firebase, callback) {
    firebase.database().ref("leaderboard").orderByChild("input").equalTo(graphName).once("value", function(snapshot) {
      const entries = [];
      snapshot.forEach((item) => entries.push([item.val()["leaderboard_name"], item.val()["score"]]));
      const sortedEntries = entries.sort((elem1, elem2) => elem1[1] - elem2[1]);
      callback(sortedEntries);
    });
}

function formatLeaderboard(sortedEntries) {
  const table = document.createElement('table');
  table.className = 'table';
  let currentRank = 1;
  let prevValue = -1;
  for (let i = 0; i < sortedEntries.length; i++) {
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

      if (score != prevValue) {
        currentRank = i + 2;
        prevValue = score;
      }

      row.appendChild(score);
      table.appendChild(row);
  }
  return table;
}

function createLeaderboard(leaderboardEntries) {
  console.log(leaderboardEntries);
  if (leaderboardEntries === null) {
      document.getElementById('leaderboard').innerHTML += `<div class="row">No submissions exist for ${graphName}.in`;
  } else {
      document.getElementById('leaderboard').appendChild(
        formatLeaderboard(leaderboardEntries)
      );
  }
}

function generateLeaderboard(graphName, firebase) {
    document.getElementById("leaderboard").innerHTML = "";

    if (graphName === null) {
      computeFullLeaderboard(firebase, createLeaderboard);
    } else {
      pullLeaderboard(graphName, firebase, createLeaderboard);
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
