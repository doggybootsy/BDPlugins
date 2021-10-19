/**
 * @name LocalServer
 * @description Makes a local server within discord. 
 * Path starts at user home
 * @version 1.0.0
 * @author doggybootsy
 * @source https://github.com/doggybootsy/BDPlugins/
 * @website https://doggybootsy.github.io/
 */

const http = require("http")
const url = require("url")
const fs = require("fs")
const path = require("path")

const Text = BdApi.findModuleByDisplayName("Text")
const Anchor = BdApi.findModuleByDisplayName("Anchor")
const FormTitle = BdApi.findModuleByDisplayName("FormTitle")
const { React } = BdApi

module.exports = class LocalServer {
  server = http.createServer(function (req, res) {
    fs.readFile(
      path.join(process.env.HOME, decodeURI(url.parse(req.url, true).pathname)), 
      function(err, data) {
        if (err) {
          res.writeHead(404, {"Content-Type": "text/html"})
          return res.end("404 Not Found")
        } 
        return res.end(data)
      }
    )
  })
  getSettingsPanel() {
    const goodUrl = `http://localhost:8080${__dirname.replace(process.env.HOME, "")}/${__filename}`
    const badUrl = `http://localhost:8080${__dirname.replace(process.env.HOME, "")}`
    return React.createElement(React.Fragment, {
      children: [
        React.createElement(FormTitle, {tag: "h4", style: {marginTop: "10px"}}, "Url demos"),
        React.createElement(Text, {style: {marginTop: "10px"}}, "Good Url demo, 200"),
        React.createElement(Anchor, {href: goodUrl}, goodUrl),
        React.createElement(Text, {style: {marginTop: "10px"}}, "Bad Url demo, 404"),
        React.createElement(Anchor, {href: badUrl}, badUrl),
      ]
    })
  }
  start() {
    try {this.server.listen(8080)} 
    catch (error) {BdApi.alert("LocalServer", ["Port `8080` is already is taken", "LocalServer failed to start"])}
  }
  stop() {this.server.close()}
}
