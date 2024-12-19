const fs = require("fs");
const path = require("path");
const request = require("request-promise");
const headers = require("./src/utils/headers");
const { URL } = require("./src/config/config");

function calculateTileNumber(latitude, longitude, zoom) {
  var numTiles = 1 << zoom;
  var tileX = Math.floor(((longitude + 180) / 360) * numTiles);
  var tileY = Math.floor(
    ((1 -
      Math.log(
        Math.tan((latitude * Math.PI) / 180) +
          1 / Math.cos((latitude * Math.PI) / 180)
      ) /
        Math.PI) /
      2) *
      numTiles
  );
  return [tileX, tileY];
}

const checkoutSingle = async function (x, y, z, filename, maptype, suffix) {
  var pathname = `tiles/{filename}/{z}/{x}/{y}.${suffix}`.format({
    x: x,
    y: y,
    z: z,
    filename: filename,
  });
  var abspath = path.resolve(pathname);
  if (!fs.existsSync(abspath)) {
    await _download(x, y, z, pathname, maptype);
  } else {
    fs.stat(abspath, async function (err, stats) {
      if (err) {
        await _download(x, y, z, pathname, maptype);
        return;
      }
      if (!stats.size) {
        fs.unlinkSync(path);
        await _download(x, y, z, pathname, maptype);
      }
    });
  }
};

const _download = async function (x, y, z, filename, maptype) {
  var url = URL[maptype].format({ x: x, y: y, z: z, s: random(1, 4) });
  var pathname = path.dirname(filename);
  mkdirsSync(pathname);
  if (!fs.existsSync(filename)) {
    console.log("开始下载：", pathname);
    await request(
      {
        url: url,
        headers: headers,
        encoding: "binary",
      },
      (err, response) => {
        if (err) {
          throw new Error(`出现异常，在${x}${y}${z}`);
        }
        fs.writeFileSync(filename, response.body, "binary");
      }
    );
  }
};
const random = function (start, end) {
  return Math.floor(Math.random() * (end - start + 1)) + start;
};

String.prototype.format = function (json) {
  var temp = this;
  for (var key in json) {
    temp = temp.replace("{" + key + "}", json[key]);
  }
  return temp;
};

Number.prototype.toRad = function () {
  return (this * Math.PI) / 180;
};
const mkdirsSync = function (dirpath, mode) {
  if (!fs.existsSync(dirpath)) {
    var pathtmp;
    dirpath.split("/").forEach(function (dirname) {
      if (pathtmp) {
        pathtmp = path.join(pathtmp, dirname);
      } else {
        pathtmp = dirname;
      }
      if (!fs.existsSync(pathtmp)) {
        if (!fs.mkdirSync(pathtmp, mode)) {
          return false;
        }
      }
    });
  }
  return true;
};

async function procesLatlng(
  jingdu1,
  weidu1,
  jingdu2,
  weidu2,
  zoom,
  filename,
  maptype,
  suffix
) {
  const tileNumber1 = calculateTileNumber(weidu1, jingdu1, zoom);
  const tileNumber2 = calculateTileNumber(weidu2, jingdu2, zoom);
  console.log("西北角：" + tileNumber1, tileNumber2);
  console.log(`
        西北角瓦片起始编号：文件夹:${tileNumber1[0]},瓦片id:${tileNumber1[1]}
        东南角瓦片结束编号：文件夹:${tileNumber2[0]},瓦片id:${tileNumber2[1]}
        `);
  const folderNum = tileNumber2[0] - tileNumber1[0] + 1;
  const fileNum = tileNumber2[1] - tileNumber1[1] + 1;
  let all = folderNum * fileNum;
  let total = 0;
  console.log("\x1b[32m%s\x1b[0m", `瓦片总数共计：${all} 张。`);
  console.log("\x1b[32m%s\x1b[0m", "...准备拉取...");
  console.log("\x1b[32m%s\x1b[0m", "...开始拉取...");
  for (let fileNum = tileNumber1[0]; fileNum <= tileNumber2[0]; fileNum++) {
    for (let imgNum = tileNumber1[1]; imgNum <= tileNumber2[1]; imgNum++) {
      console.log(
        "\x1b[32m%s\x1b[0m",
        `正在 拉取 供应商【${maptype}】【经纬度范围爬取功能】 第 ${
          total + 1
        } 张 瓦片`
      );
      await checkoutSingle(fileNum, imgNum, zoom, filename, maptype, suffix);
      console.log("\x1b[32m%s\x1b[0m", `第 ${total + 1} 张拉取完成。`);
      total += 1;
      console.log("\x1b[32m%s\x1b[0m", `剩余 ${all - total} 张。`);
    }
  }
  console.log(
    "\x1b[31m%s\x1b[0m",
    `全部拉取完成。。。
        地图瓦片爬取 全地图 全供应商 【开源软件】
        认准：Tzzzzzz.
        真实可靠！ 
        `
  );
}
