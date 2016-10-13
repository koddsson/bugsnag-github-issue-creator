require('dotenv').config();

var http = require('https');
var querystring = require('querystring');

console.log('Loading function');

exports.handler = (event, context, callback) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  // construct the stacktrace
  var formattedStacktrace = (
    event.event["sentry.interfaces.Exception"].values[0].stacktrace.frames.filter((frame) => frame.in_app)
  ).map((frame) => {
    return "at " + frame.function + " (" + frame.filename + ":" + frame.lineno + ")";
  }).join('\n');

  var stacktrace = "<details><summary>Stacktrace</summary>" + formattedStacktrace + "</details>";

  var date = new Date(event.event.received * 1000);
  var formattedDate = date.getFullYear() + '/' + date.getMonth() + '/' + date.getDate() + ' ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();

  var message = (
    "Hey hey :wave:!\n\n" +
    "An error occured at " + formattedDate + " and the culprit was: `" + event.culprit + "`\n\n\n" +
    stacktrace
  );

  var postData = JSON.stringify({
    "title": event.message,
    "body": message,
    "assignees": [],
    "labels": ["bug"],
  });

  console.log(process.env);

  var options = {
    hostname: 'api.github.com',
    port: 443,
    path: '/repos/apis-is/apis/issues',
    method: 'POST',
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      'Authorization': `token ${process.env.GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'User-Agent': 'koddsson',
    }
  };

  var req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
      console.log(`BODY: ${chunk}`);
    });
    res.on('end', () => {
      console.log('No more data in response.');
    });
    callback(null, {});  // Echo back the whole event.
  });

  req.on('error', (e) => {
    console.log(`problem with request: ${e.message}`);
    callback(e);
  });

  // write data to request body
  req.write(postData);
  req.end();
};
