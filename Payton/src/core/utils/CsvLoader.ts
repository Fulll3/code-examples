var csv = require('csv-parser');
var fs = require('fs');

export async function loadCsv<T>(filePath: string): Promise<any> {
  const results = [];

  await new Promise<void>((resolve, reject) => {
    try {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => {
          results.push(data);
        })
        .on('end', function () {
          resolve();
        });
    } catch (err) {
      reject(err);
    }
  });

  return results;
}