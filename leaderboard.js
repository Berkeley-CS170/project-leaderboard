
const sizes = ['small', 'medium', 'large'];
const numInputsPerSize = 10;
const leaderboardData = {};

function generateLeaderboard(data, graphName) {
    const names = {};
    for (let i = 0; i < sizes.length; i++) {
      const size = sizes[i];
      for (let j = 1; j <= numInputsPerSize; j++) {
        leaderboardData[`${size}-${j}`] = {};
      }
    }
    for (let i = 0; i < data.length; i++) {
        const submission = data[i];
        const hash = submission['hash'];
        const leaderboardName = submission['leaderboard_name'];
        const timestamp = Date.parse(submission['timestamp']);
        for (let key of Object.keys(leaderboardData)) {
            if (leaderboardData[key].hasOwnProperty(hash)) {
                leaderboardData[key][hash] = Math.min(parseFloat(submission[key]), leaderboardData[key][hash]);
            } else {
                leaderboardData[key][hash] = parseFloat(submission[key])
            }
            if (!names.hasOwnProperty(hash) || names[hash]['timestamp'] < timestamp) {
                names[hash] = {leaderboardName, timestamp};
            }
        }
    }
    const leaderboards = {};

    if (graphName == null) {
        document.getElementById("leaderboard").innerHTML = "";
        for (let key of Object.keys(leaderboardData)) {
          const sortedEntries = Object.entries(leaderboardData[key]).sort(function compare(elem1, elem2) {
              return elem1[1] - elem2[1];
          });
          leaderboards[key] = createLeaderboardList(names, sortedEntries);
          document.getElementById("leaderboard").innerHTML += createLeaderboardCard(key);
          document.getElementById(`${key}-leaderboard-snippet`).appendChild(
              createLeaderboardList(names, sortedEntries.slice(0, 10))
          );
        }
    } else {
      document.getElementById("leaderboard").innerHTML = "";
      if (leaderboardData.hasOwnProperty(graphName)) {
          const sortedEntries = Object.entries(leaderboardData[graphName]).sort(function compare(elem1, elem2) {
              return elem1[1] - elem2[1];
          });
          document.getElementById('leaderboard').appendChild(
              createLeaderboardList(names, sortedEntries)
          );
      } else {
          document.getElementById('leaderboard').innerHTML += `<div class="row">Input name ${graphName}.in does not exist`;
      }

    }




}

function createLeaderboardCard(graphName) {
    return `<div class="card">
        <h5 class="card-header">
            <a data-toggle="collapse" href="#collapse-${graphName}" aria-expanded="true" aria-controls="collapse" id="heading" class="d-block">
                <i class="fa fa-chevron-down pull-right"></i>
                ${graphName}
            </a>
        </h5>
        <div id="collapse-${graphName}" class="collapse" aria-labelledby="heading">
            <div class="card-body" id="${graphName}-leaderboard-snippet">
            <a href="?graph=${graphName}">View full input leaderboard</a>
            </div>
        </div>
    </div>`
}



function createLeaderboardList(names, sortedEntries) {
    const table = document.createElement('table');
    table.className = 'table';
    for (let i = 0; i < sortedEntries.length; i++) {
        const row = document.createElement('tr');
        entry = sortedEntries[i];
        const name = document.createElement('td');
        name.innerHTML = names[entry[0]]['leaderboardName'];
        row.appendChild(name);
        const score = document.createElement('td');
        score.innerHTML = entry[1];
        row.appendChild(score);
        table.appendChild(row);
    }
    return table;
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
