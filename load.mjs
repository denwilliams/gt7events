import fs from "fs";

const eventId = 11015;

// async function fetchRaceList() {
//   try {
//     const response = await fetch(
//       "https://static.gt7.game.gran-turismo.com/championship/seasons/6/all.json"
//     );
//     if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
//     return await response.json();
//   } catch (error) {
//     console.error("Error fetching race list:", error);
//     return null;
//   }
// }

async function fetchEventParams(eventNumber) {
  try {
    const response = await fetch(
      `https://static.gt7.game.gran-turismo.com/event/params/${eventNumber}.json`
    );
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(
      `Error fetching event parameters for event ${eventNumber}:`,
      error
    );
    return null;
  }
}

async function fetchLapTimes(boardId, page = 0) {
  try {
    const response = await fetch(
      "https://web-api.gt7.game.gran-turismo.com/ranking/get_list_by_page",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          board_id: boardId,
          page: page,
        }),
      }
    );
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`Error fetching lap times for event ${eventId}:`, error);
    return null;
  }
}

const event = await fetchEventParams(eventId);
const online = event.result.online;
const { ranking_id: boardId, begin_date, end_date } = online;

if (!boardId) {
  console.log(`No event parameters available for event ${eventId}.`);
  process.exit(1);
} else {
  let allLapTimes = [];

  const lapTimesData = await fetchLapTimes(boardId, 0);
  const { list, total } = lapTimesData.result;
  const numPages = total; //Math.min(5, total);
  allLapTimes.push(...list);

  for (let page = 1; page < numPages; page++) {
    console.log(`Fetching page ${page + 1} of ${numPages}...`);
    const lapTimesPage = await fetchLapTimes(boardId, page);
    const { list } = lapTimesPage.result;
    allLapTimes.push(...list);
  }

  fs.writeFileSync(
    // `./data/${eventId}-board.json`,
    `./data/board.json`,
    JSON.stringify(allLapTimes),
    "utf8"
  );
  fs.writeFileSync(
    //   `./data/${eventId}-lap-times.json`,
    `./data/lap-times.json`,
    JSON.stringify(allLapTimes.map((l) => l.score)),
    "utf8"
  );
  for (let i = 0; i <= 5; i++) {
    fs.writeFileSync(
      //   `./data/${eventId}-lap-times-${i}.json`,
      `./data/lap-times-${i}.json`,
      JSON.stringify(
        allLapTimes
          .filter((l) => l.user.driver_rating === i)
          .map((l) => l.score)
      ),
      "utf8"
    );
  }
}
