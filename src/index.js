/* 
just toy module
exposing lsof as node function
*/
const { spawn } = require("child_process");
const { LineStream } = require("byline");
const { promisify } = require("util");
const path = require("path");
const assert = require("assert");
module.exports = Object.assign(lsof, { assertOpen, assertNotOpen });

function lsof(cb) {
  return cb ? _lsof(cb) : promisify(_lsof)();
}

function assertOpen(filter) {
  if (typeof filter === "string") {
    let normalized = path.normalize(filter);
    filter = (({ NAME }) => NAME === normalized);
  }
  // throws
  return lsof((err, data) => {
    if (err) throw err;
    var r = data.some(filter);
    assert(r, `lsof does not contain items matching ${filter}`)
  });
}

function assertNotOpen(filter) {
  // TODO: dry
  if (typeof filter === "string") {
    let normalized = path.normalize(filter);
    filter = (({ NAME }) => NAME === normalized);
  }
  // throws
  return lsof((err, data) => {
    if (err) throw err;
    var r = !data.some(filter);

    assert(r, `lsof does not contain items matching ${filter}`)
  });

}


function _lsof(cb) {
  let header;
  let data = [];
  spawn('lsof', ["-p", process.pid])
    .stdout.pipe(new LineStream({ encoding: "utf8" }))
    .on("data", function(line) {
      if (header == null) header = line;
      else data.push(line);
    })
    .on("end", function() {
      //['COMMAND   ','PID   ',....],
      let cols = header.match(/(\s*[^\s]+(\s|$))/g);
      // TODO: refactor !!!
      // TODO: use lsof -F for porcelain output (parsable)
      let r = data.map(line => {
        let o = {};
        let i = 0;
        cols.forEach((c, ci) => {
          o[c.trim()] = line.substring(i, ci != cols.length - 1 ? i + c.length : undefined).trim();
          // o.h = header;
          // o.l = line;
          i += c.length;
        })
        return o;
      })
      cb(null, r);
    })
    .on("error", (err) => cb(err));

  // if (!cb) {
  //   return new Promise((resolve, reject) => {
  //     cb = (err, data) => err ? reject(err) : resolve(data);
  //   })
  // }
}
//lsof(console.log);
//lsof().then(console.log);